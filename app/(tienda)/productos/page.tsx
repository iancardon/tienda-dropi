import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { CatalogEmpty } from "@/components/catalog-empty";
import { CatalogFilters } from "@/components/catalog-filters";
import { IconCash, IconTruck } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { priceFromProduct, type ProductWithVariants } from "@/lib/products";
import { STORE_CONFIG } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Catálogo completo con pago contra entrega en toda Colombia. Paga en efectivo cuando recibas tu pedido.",
};

type Params = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductosPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;

  const categoria = readParam(params.categoria);
  const query = readParam(params.q);
  const onlyOffers = readParam(params.ofertas) === "1";
  const orden = readParam(params.orden) ?? "destacados";

  // `baseWhere` nunca incluye filtros de búsqueda: se reutiliza también para
  // contar las categorías, que deben salir del catálogo completo y no del
  // resultado ya filtrado (si no, buscar "café" escondería las demás
  // categorías y la persona no podría cambiar de opinión).
  const baseWhere: Prisma.ProductWhereInput = { active: true, isDemo: false };

  const where: Prisma.ProductWhereInput = {
    ...baseWhere,
    ...(categoria ? { category: categoria } : {}),
    ...(onlyOffers ? { originalPrice: { not: null } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy = buildOrderBy(orden);

  const [unsortedProducts, categoriesRaw, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy,
      take: 60,
    }),
    prisma.product.findMany({
      where: baseWhere,
      select: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  // El precio efectivo (base o el más barato entre variantes) vive en el
  // objeto, no en una columna, así que el orden por precio se aplica aquí.
  const products = sortByEffectivePrice(unsortedProducts, orden);

  const categories = [
    ...new Set(categoriesRaw.map((row) => row.category?.trim()).filter(Boolean)),
  ] as string[];

  // Si hay productos en total pero la consulta principal no devolvió ninguno,
  // el corte de 60 no es el problema: es que el filtro no coincide con nada.
  const filteredOut = total > products.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {categoria ? categoria : "Todos los productos"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
          Elige lo que necesitas y paga en efectivo cuando recibas tu pedido.
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-emerald-700">
          <span className="flex items-center gap-1.5">
            <IconCash className="h-4 w-4" />
            Pago contra entrega
          </span>
          <span className="flex items-center gap-1.5">
            <IconTruck className="h-4 w-4" />
            Envíos a toda Colombia
          </span>
        </p>
      </header>

      {/* Los filtros leen la URL, así que van dentro de `Suspense`: la
          navegación de Next no puede dejar la página en espera sin nada que
          mostrar. */}
      <div className="mt-7">
        <Suspense
          fallback={
            <div className="h-12 animate-soft-pulse rounded-xl bg-zinc-100" />
          }
        >
          <CatalogFilters categories={categories} total={total} />
        </Suspense>
      </div>

      <div className="mt-7">
        {products.length > 0 ? (
          <>
            <div className="grid-products grid gap-3 sm:gap-4 lg:gap-5">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>

            {filteredOut && (
              <p className="mt-6 text-center text-sm text-zinc-500">
                Mostrando {products.length} de {total} productos. Afina la búsqueda
                para ver menos resultados.
              </p>
            )}
          </>
        ) : (
          <CatalogEmpty
            title={
              query || categoria || onlyOffers
                ? "No encontramos productos con esos filtros"
                : undefined
            }
            description={
              query || categoria || onlyOffers
                ? "Prueba con otra palabra, quita algún filtro o mira todo el catálogo."
                : undefined
            }
          />
        )}
      </div>

      {products.length > 0 && (
        <p className="mt-12 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-400">
          ¿No encuentras lo que buscas? Escríbenos por WhatsApp y lo pedimos
          para ti. {STORE_CONFIG.name} · Paga contra entrega en toda Colombia.
        </p>
      )}
    </div>
  );
}

/**
 * Ordena por el precio que realmente ve el cliente. Reutiliza `priceFromProduct`
 * para no duplicar la regla de "desde".
 */
function sortByEffectivePrice<T extends ProductWithVariants>(
  products: T[],
  orden: string,
): T[] {
  if (orden !== "precio-asc" && orden !== "precio-desc") return products;

  const direction = orden === "precio-asc" ? 1 : -1;

  return [...products].sort(
    (a, b) => (priceFromProduct(a) - priceFromProduct(b)) * direction,
  );
}

function readParam(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  if (typeof single !== "string") return undefined;
  const trimmed = single.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Traduce el parámetro `orden` al `orderBy` de Prisma.
 *
 * El precio no es una columna del producto: es el precio base o, si alguna
 * variante lo sobrescribe, el más barato. Por eso el orden por precio se
 * resuelve en memoria después de traer las variantes, en lugar de pedir un
 * `orderBy` que no existiría.
 */
function buildOrderBy(orden: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (orden) {
    case "nuevos":
      return [{ createdAt: "desc" }];
    case "destacados":
      return [{ featured: "desc" }, { createdAt: "desc" }];
    default:
      return [{ name: "asc" }];
  }
}