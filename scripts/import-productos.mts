/**
 * Importador de productos desde CSV.
 *
 *   npx tsx scripts/import-productos.mts catalogo.csv            -> simulación
 *   npx tsx scripts/import-productos.mts catalogo.csv --apply    -> escribe en la BD
 *
 * Opciones:
 *   --apply                 escribe los cambios (sin esto es solo un reporte)
 *   --skip-invalid          omite las filas con errores en vez de abortar
 *   --deactivate-missing    desactiva productos que no estén en el CSV
 *   --delimiter=;           fuerza el separador (por defecto se detecta)
 *
 * Columnas reconhecidas (acepta variantes con o sin tildes, en español o inglés):
 *   nombre* · descripcion* · categoria* · precio* · descripcion_corta
 *   precio_anterior · costo · costo_envio · proveedor · stock · sku · variante · imagenes
 *   destacado · activo · id_proveedor
 *
 * Varias filas con el mismo nombre se agrupan en un producto y cada fila
 * aporta una variante (columna `variante`; si falta, se usa el SKU).
 */
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const ALIASES: Record<string, string[]> = {
  nombre: ["nombre", "name", "producto", "titulo", "title"],
  descripcion: ["descripcion", "description", "detalle", "ficha"],
  descripcion_corta: ["descripcioncorta", "shortdescription", "resumen"],
  categoria: ["categoria", "category", "familia", "linea"],
  precio: ["precio", "precioventa", "valor", "price", "pvp", "preciopublico", "preciounidad"],
  precio_anterior: [
    "precioanterior",
    "preciodescuento",
    "preciotachado",
    "oldprice",
    "preciooriginal",
  ],
  costo: ["costo", "cost", "costoproveedor", "supplierprice", "preciocompra", "preciocosto"],
  stock: ["stock", "existencias", "cantidad", "inventario", "quantity", "unidades"],
  sku: ["sku", "codigo", "cod", "referencia", "item", "codproducto"],
  variante: ["variante", "variation", "talla", "color", "modelo"],
  imagenes: ["imagenes", "images", "imagen", "image", "foto", "urlimagen", "imageurl"],
  destacado: ["destacado", "featured", "destacados"],
  activo: ["activo", "active", "habilitado", "publicado", "visible"],
  id_proveedor: ["idproveedor", "supplierproductid", "iddropi", "codigoproveedor", "idproductoproveedor"],
  proveedor: ["proveedor", "supplier", "proveedornombre", "suppliername"],
  costo_envio: [
    "costoenvio",
    "envioproveedor",
    "costoflete",
    "shippingcost",
    "suppliershippingcost",
    "enviodelproveedor",
  ],
};

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

function parseCsv(text: string, delimiter: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Acepta "$19.000", "19.000,50", "19000" -> 19000.5 */
function parseMoney(raw: string): number | null {
  const cleaned = raw
    .replace(/[^\d.,-]/g, "")
    .replace(/(?!^)-/g, "")
    .trim();
  if (cleaned === "" || cleaned === "-") return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma > -1 && lastDot > -1) {
    // Ambos separadores: el último que aparece es el decimal.
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else {
    const sep = lastComma > -1 ? "," : lastDot > -1 ? "." : "";
    if (sep === "") {
      normalized = cleaned;
    } else {
      const occurrences = cleaned.split(sep).length - 1;
      const decimals = cleaned.length - cleaned.lastIndexOf(sep) - 1;
      // "1.234" y "1,000" son miles; "19,50" y "1.5" son decimales.
      const isDecimal = occurrences === 1 && decimals > 0 && decimals <= 2;
      normalized = isDecimal
        ? cleaned.replace(sep, ".")
        : cleaned.split(sep).join("");
    }
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseInt10(raw: string, fallback: number): number {
  const value = Number.parseInt(raw.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(value) ? value : fallback;
}

function parseBool(raw: string, fallback: boolean): boolean {
  const v = normalizeHeader(raw);
  if (v === "") return fallback;
  if (["1", "true", "si", "yes", "verdadero", "x", "activo", "habilitado"].includes(v))
    return true;
  if (["0", "false", "no", "falso", "inactivo", "oculto"].includes(v)) return false;
  return fallback;
}

function splitImages(raw: string): string[] {
  return raw
    .split(/[|;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .slice(0, 8);
}

function isValidImageUrl(value: string): boolean {
  return /^(https?:\/\/|\/)/i.test(value);
}

function stockStatusFor(stock: number): string {
  if (stock <= 0) return "agotado";
  if (stock <= 5) return "bajo_stock";
  return "disponible";
}

type ProductDraft = {
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription: string | null;
  basePrice: number;
  originalPrice: number | null;
  discountPercent: number | null;
  supplierPrice: number;
  supplierShippingCost: number;
  supplier: string;
  supplierProductId: string | null;
  images: string[];
  featured: boolean;
  active: boolean;
  rows: { line: number; variant: string; sku: string; stock: number }[];
};

function usage(): never {
  console.log(`Uso: npx tsx scripts/import-productos.mts <archivo.csv> [opciones]

Opciones:
  --apply                 escribe los cambios en la base de datos
  --skip-invalid          omite filas inválidas en vez de abortar
  --deactivate-missing    desactiva productos ausentes del CSV
  --delimiter=<char>      separador forzado (por defecto: detección automática)
  --help                  esta ayuda`);
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith("--"));
  const apply = args.includes("--apply");
  const skipInvalid = args.includes("--skip-invalid");
  const deactivateMissing = args.includes("--deactivate-missing");
  const forcedDelimiter = args
    .find((a) => a.startsWith("--delimiter="))
    ?.split("=")[1];

  if (args.includes("--help") || !fileArg) usage();

  const filePath = path.resolve(process.cwd(), fileArg);
  const text = await readFile(filePath, "utf8");
  const delimiter = forcedDelimiter ?? detectDelimiter(text);
  const table = parseCsv(text, delimiter);

  if (table.length < 2) {
    console.error("El CSV no tiene filas de datos.");
    process.exit(1);
  }

  const headers = table[0].map((h) => normalizeHeader(h));
  const columnOf: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const index = headers.findIndex((h) => aliases.includes(h));
    if (index > -1) columnOf[field] = index;
  }

  const read = (row: string[], field: string): string =>
    columnOf[field] === undefined ? "" : (row[columnOf[field]] ?? "").trim();

  const missing = (["nombre", "categoria", "precio"] as const).filter(
    (f) => columnOf[f] === undefined
  );
  console.log(`Archivo:    ${filePath}`);
  console.log(`Separador:  ${delimiter === "\t" ? "\\t" : delimiter}`);
  console.log(`Filas:      ${table.length - 1}`);
  console.log(
    `Columnas:   ${
      Object.keys(columnOf).length
    } reconhecidas -> ${Object.keys(columnOf).join(", ") || "ninguna"}`
  );
  if (missing.length > 0) {
    console.error(
      `\nFaltan columnas obligatorias: ${missing.join(", ")}.\n` +
        `Encabezados encontrados: ${table[0].join(" | ")}`
    );
    process.exit(1);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const drafts = new Map<string, ProductDraft>();
  const seenSkus = new Map<string, string>();

  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const line = i + 1;
    const name = read(row, "nombre");
    if (name === "") {
      warnings.push(`Línea ${line}: sin nombre, se omite.`);
      continue;
    }

    const price = parseMoney(read(row, "precio"));
    if (price === null || price <= 0) {
      errors.push(`Línea ${line} ("${name}"): precio inválido o vacío.`);
      continue;
    }

    const category = read(row, "categoria");
    if (category.length < 2) {
      errors.push(`Línea ${line} ("${name}"): la categoría es obligatoria.`);
      continue;
    }

    const slug = slugify(name);
    if (slug === "") {
      errors.push(`Línea ${line} ("${name}"): el nombre no genera un slug válido.`);
      continue;
    }

    const description = read(row, "descripcion");
    if (description.length < 10) {
      errors.push(
        `Línea ${line} ("${name}"): la descripción debe tener al menos 10 caracteres.`
      );
      continue;
    }

    const originalPrice = parseMoney(read(row, "precio_anterior"));
    const discountPercent =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null;

    const images = splitImages(read(row, "imagenes"));
    const badImage = images.find((img) => !isValidImageUrl(img));
    if (badImage) {
      errors.push(`Línea ${line} ("${name}"): imagen inválida "${badImage}".`);
      continue;
    }

    const stock = parseInt10(read(row, "stock"), 0);
    const skuRaw = read(row, "sku");
    const sku = skuRaw !== "" ? skuRaw.toUpperCase() : "";

    if (sku && seenSkus.has(sku)) {
      errors.push(
        `Línea ${line} ("${name}"): SKU "${sku}" repetido (ya aparece en la línea ${seenSkus.get(sku)}).`
      );
      continue;
    }
    if (sku) seenSkus.set(sku, String(line));

    const variantName = read(row, "variante");

    let draft = drafts.get(slug);
    if (!draft) {
      draft = {
        name,
        slug,
        category,
        description,
        shortDescription: read(row, "descripcion_corta") || null,
        basePrice: price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
        discountPercent,
        supplierPrice: parseMoney(read(row, "costo")) ?? 0,
        supplierShippingCost: parseMoney(read(row, "costo_envio")) ?? 0,
        supplier: read(row, "proveedor") || "Dropi",
        supplierProductId: read(row, "id_proveedor") || null,
        images,
        featured: parseBool(read(row, "destacado"), false),
        active: parseBool(read(row, "activo"), true),
        rows: [],
      };
      drafts.set(slug, draft);
    }

    const index = draft.rows.length;
    draft.rows.push({
      line,
      variant:
        variantName || sku || (index === 0 ? "Única" : `Variante ${index + 1}`),
      sku:
        sku ||
        `${slug.toUpperCase().replace(/-/g, "").slice(0, 12)}-${String(index + 1).padStart(2, "0")}`,
      stock,
    });
  }

  // SKU en conflicto con otro producto de la base de datos
  const dbSkus = await prisma.productVariant.findMany({
    where: { sku: { in: [...seenSkus.keys()] } },
    select: { sku: true, product: { select: { slug: true } } },
  });
  for (const v of dbSkus) {
    const conflict = [...drafts.values()].find((d) =>
      d.rows.some((r) => r.sku === v.sku)
    );
    if (conflict && conflict.slug !== v.product.slug) {
      errors.push(
        `SKU "${v.sku}" ya pertenece al producto "${v.product.slug}" y en el CSV a "${conflict.slug}".`
      );
    }
  }

  console.log(`\nProductos detectados: ${drafts.size}`);
  for (const draft of drafts.values()) {
    const totalStock = draft.rows.reduce((acc, r) => acc + r.stock, 0);
    console.log(
      `  - ${draft.name} (${draft.slug}) · ${draft.category} · $${draft.basePrice} · ` +
        `${draft.rows.length} variante(s) · stock ${totalStock}` +
        (draft.images.length ? ` · ${draft.images.length} imagen(es)` : " · sin imagen")
    );
  }

  if (warnings.length > 0) {
    console.log(`\nAvisos (${warnings.length}):`);
    for (const w of warnings.slice(0, 20)) console.log(`  ! ${w}`);
    if (warnings.length > 20) console.log(`  ... y ${warnings.length - 20} más`);
  }

  if (errors.length > 0) {
    console.error(`\nErrores (${errors.length}):`);
    for (const e of errors.slice(0, 40)) console.error(`  x ${e}`);
    if (errors.length > 40) console.error(`  ... y ${errors.length - 40} más`);
    if (!skipInvalid) {
      console.error("\nAbortado. Corrige el CSV o usa --skip-invalid para omitir esas filas.");
      process.exit(1);
    }
  }

  if (!apply) {
    console.log("\nSimulación: no se escribió nada. Usa --apply para guardar en la BD.");
    return;
  }

  let created = 0;
  let updated = 0;
  let variantsCreated = 0;
  let variantsDeleted = 0;

  await prisma.$transaction(async (tx) => {
    for (const draft of drafts.values()) {
      const existing = await tx.product.findUnique({
        where: { slug: draft.slug },
        include: { variants: { select: { id: true, sku: true } } },
      });

      const data = {
        name: draft.name,
        category: draft.category,
        description: draft.description,
        shortDescription: draft.shortDescription,
        basePrice: draft.basePrice,
        originalPrice: draft.originalPrice,
        discountPercent: draft.discountPercent,
        supplierPrice: draft.supplierPrice,
        supplierShippingCost: draft.supplierShippingCost,
        supplier: draft.supplier,
        supplierProductId: draft.supplierProductId,
        images: draft.images,
        featured: draft.featured,
        active: draft.active,
        // Si el producto existía como DEMO, al importar el catálogo real deja de serlo.
        isDemo: false,
      };

      if (existing) {
        await tx.product.update({ where: { id: existing.id }, data });

        const keep = new Set(draft.rows.map((r) => r.sku));
        for (const v of existing.variants) {
          if (!keep.has(v.sku)) {
            const res = await tx.productVariant.deleteMany({
              where: { id: v.id, orderItems: { none: {} } },
            });
            variantsDeleted += res.count;
          }
        }
        for (const row of draft.rows) {
          const current = existing.variants.find((v) => v.sku === row.sku);
          if (current) {
            await tx.productVariant.update({
              where: { id: current.id },
              data: { name: row.variant, stock: row.stock, stockStatus: stockStatusFor(row.stock) },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: existing.id,
                name: row.variant,
                sku: row.sku,
                stock: row.stock,
                stockStatus: stockStatusFor(row.stock),
              },
            });
            variantsCreated++;
          }
        }
        updated++;
      } else {
        await tx.product.create({
          data: {
            ...data,
            slug: draft.slug,
            variants: {
              create: draft.rows.map((row) => ({
                name: row.variant,
                sku: row.sku,
                stock: row.stock,
                stockStatus: stockStatusFor(row.stock),
              })),
            },
          },
        });
        created++;
      }
    }

    if (deactivateMissing) {
      const slugs = [...drafts.keys()];
      const res = await tx.product.updateMany({
        where: { slug: { notIn: slugs }, active: true },
        data: { active: false },
      });
      console.log(`\nProductos desactivados fuera del CSV: ${res.count}`);
    }
  });

  console.log(
    `\nImportación completada: ${created} creados, ${updated} actualizados, ` +
      `${variantsCreated} variantes nuevas, ${variantsDeleted} variantes eliminadas.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
