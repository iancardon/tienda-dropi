"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { assertAdmin } from "@/lib/auth";

export type ProductFormState = { error?: string } | null;

const STOCK_STATUSES = ["disponible", "bajo_stock", "agotado"];

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function computeDiscount(
  basePrice: number,
  originalPrice: number | null
): number | null {
  if (!originalPrice || originalPrice <= basePrice) return null;
  return Math.round(((originalPrice - basePrice) / originalPrice) * 100);
}

function parseOptionalPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Costo de envío que cobra el proveedor (0 si no cobra). */
function parseShippingCost(raw: FormDataEntryValue | null): number {
  const parsed = parseFloat(String(raw ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseSupplier(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim() || "Dropi";
}

function parseVariants(formData: FormData, fallbackPrefix: string) {
  const count = Math.min(
    Math.max(parseInt(String(formData.get("variants_count") ?? "0"), 10) || 0, 0),
    50
  );
  const rows: {
    id?: string;
    name: string;
    sku: string;
    priceOverride: number | null;
    stock: number;
    stockStatus: string;
  }[] = [];

  for (let i = 0; i < count; i++) {
    const id = String(formData.get(`variant_id_${i}`) ?? "").trim() || undefined;
    const name = String(formData.get(`variant_name_${i}`) ?? "").trim();
    if (!name) continue;
    const sku =
      String(formData.get(`variant_sku_${i}`) ?? "").trim() ||
      `${fallbackPrefix}-${String(i + 1).padStart(2, "0")}`;
    const priceRaw = String(formData.get(`variant_price_${i}`) ?? "").trim();
    let priceOverride: number | null = null;
    if (priceRaw !== "") {
      const parsed = parseFloat(priceRaw.replace(",", "."));
      priceOverride = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }
    const stockRaw = String(formData.get(`variant_stock_${i}`) ?? "").trim();
    const stockParsed = parseInt(stockRaw, 10);
    const stock = Number.isFinite(stockParsed) && stockParsed >= 0 ? stockParsed : 0;
    const statusRaw = String(formData.get(`variant_stockStatus_${i}`) ?? "");
    const stockStatus = STOCK_STATUSES.includes(statusRaw)
      ? statusRaw
      : "disponible";
    rows.push({ id, name, sku, priceOverride, stock, stockStatus });
  }
  return rows;
}

function validateBase(
  name: string,
  category: string,
  description: string,
  basePrice: number,
  supplierPrice: number
): string | undefined {
  if (name.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (category.length < 2) return "La categoría es obligatoria.";
  if (description.length < 10)
    return "La descripción debe tener al menos 10 caracteres.";
  if (!Number.isFinite(basePrice) || basePrice <= 0)
    return "El precio de venta debe ser mayor a 0.";
  if (!Number.isFinite(supplierPrice) || supplierPrice < 0)
    return "El costo del proveedor no puede ser negativo.";
  return undefined;
}

async function ensureUniqueSlug(slug: string): Promise<string> {
  let candidate = slug;
  let i = 2;
  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${i++}`;
  }
  return candidate;
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const basePrice = parseFloat(String(formData.get("basePrice") ?? ""));
  const supplierPrice = parseFloat(String(formData.get("supplierPrice") ?? ""));

  const error = validateBase(name, category, description, basePrice, supplierPrice);
  if (error) return { error };

  const slug = await ensureUniqueSlug(slugify(name));
  const images = parseImages(String(formData.get("images") ?? ""));
  const supplier = parseSupplier(formData.get("supplier"));
  const supplierShippingCost = parseShippingCost(formData.get("supplierShippingCost"));
  const supplierProductId =
    String(formData.get("supplierProductId") ?? "").trim() || null;
  const shortDescription =
    String(formData.get("shortDescription") ?? "").trim() || null;
  const originalPrice = parseOptionalPrice(
    String(formData.get("originalPrice") ?? "")
  );
  const discountPercent = computeDiscount(basePrice, originalPrice);
  const featured = String(formData.get("featured")) === "on";
  const active = String(formData.get("active")) === "on";
  const isDemo = String(formData.get("isDemo")) === "on";
  const variants = parseVariants(formData, slug);

  await prisma.product.create({
    data: {
      name,
      slug,
      category,
      description,
      shortDescription,
      basePrice,
      originalPrice,
      discountPercent,
      featured,
      supplierPrice,
      supplierShippingCost,
      supplier,
      supplierProductId,
      images,
      active,
      isDemo,
      variants: { create: variants },
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Producto inválido." };

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: { select: { id: true } } },
  });
  if (!existing) return { error: "El producto no existe." };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const basePrice = parseFloat(String(formData.get("basePrice") ?? ""));
  const supplierPrice = parseFloat(String(formData.get("supplierPrice") ?? ""));

  const error = validateBase(name, category, description, basePrice, supplierPrice);
  if (error) return { error };

  const images = parseImages(String(formData.get("images") ?? ""));
  const supplier = parseSupplier(formData.get("supplier"));
  const supplierShippingCost = parseShippingCost(formData.get("supplierShippingCost"));
  const supplierProductId =
    String(formData.get("supplierProductId") ?? "").trim() || null;
  const shortDescription =
    String(formData.get("shortDescription") ?? "").trim() || null;
  const originalPrice = parseOptionalPrice(
    String(formData.get("originalPrice") ?? "")
  );
  const discountPercent = computeDiscount(basePrice, originalPrice);
  const featured = String(formData.get("featured")) === "on";
  const active = String(formData.get("active")) === "on";
  const isDemo = String(formData.get("isDemo")) === "on";
  const variants = parseVariants(formData, existing.slug);

  const existingIds = new Set(existing.variants.map((v) => v.id));
  const keepIds = new Set(
    variants.map((v) => v.id).filter((v): v is string => Boolean(v))
  );
  const variantsToDelete = [...existingIds].filter((id) => !keepIds.has(id));

  await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        description,
        shortDescription,
        basePrice,
        originalPrice,
        discountPercent,
        featured,
        supplierPrice,
        supplierShippingCost,
        supplier,
        supplierProductId,
        images,
        active,
        isDemo,
      },
    }),
    // Las variantes que se quitaron del formulario se eliminan solo si no
    // tienen pedidos asociados (para no romper el historial de órdenes).
    ...variantsToDelete.map((variantId) =>
      prisma.productVariant.deleteMany({
        where: {
          id: variantId,
          orderItems: { none: {} },
        },
      })
    ),
    ...variants.map((v) => {
      if (v.id) {
        return prisma.productVariant.update({
          where: { id: v.id },
          data: {
            name: v.name,
            sku: v.sku,
            priceOverride: v.priceOverride,
            stock: v.stock,
            stockStatus: v.stockStatus,
          },
        });
      }
      return prisma.productVariant.create({
        data: {
          productId: id,
          name: v.name,
          sku: v.sku,
          priceOverride: v.priceOverride,
          stock: v.stock,
          stockStatus: v.stockStatus,
        },
      });
    }),
  ]);

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/admin/productos/" + id);
  redirect("/admin/productos");
}

export async function toggleVariantStock(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const status = STOCK_STATUSES.includes(String(formData.get("stockStatus")))
    ? String(formData.get("stockStatus"))
    : undefined;
  if (!id || !status) return;

  await prisma.productVariant.update({ where: { id }, data: { stockStatus: status } });
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
}

export async function toggleProductActive(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;

  await prisma.product.update({ where: { id }, data: { active } });
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/");
}