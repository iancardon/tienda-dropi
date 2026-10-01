import type { Prisma } from "@prisma/client";

export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

export type ProductVariantWithProduct = Prisma.ProductVariantGetPayload<{
  include: { product: true };
}>;

export function getImages(images: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(images)
    ? images.filter((i): i is string => typeof i === "string")
    : [];
}

export function variantPrice(
  product: { basePrice: number },
  variant: { priceOverride: number | null }
): number {
  return variant.priceOverride ?? product.basePrice;
}

export function priceFromProduct(product: {
  basePrice: number;
  variants: { priceOverride: number | null }[];
}): number {
  return product.variants.reduce(
    (min, v) => Math.min(min, v.priceOverride ?? product.basePrice),
    product.basePrice
  );
}

export function getProductDiscount(product: {
  basePrice: number;
  originalPrice: number | null;
}): number | null {
  if (!product.originalPrice || product.originalPrice <= product.basePrice) {
    return null;
  }
  return Math.round(((product.originalPrice - product.basePrice) / product.originalPrice) * 100);
}

export function getProductOriginalPrice(product: {
  basePrice: number;
  originalPrice: number | null;
}): number | null {
  if (!product.originalPrice || product.originalPrice <= product.basePrice) {
    return null;
  }
  return product.originalPrice;
}

export function isProductOutOfStock(product: {
  variants: { stockStatus: string; stock: number }[];
}): boolean {
  return (
    product.variants.length === 0 ||
    product.variants.every((v) => v.stockStatus === "agotado" || v.stock <= 0)
  );
}

export function getProductStockStatus(product: {
  variants: { stockStatus: string; stock: number }[];
}): "disponible" | "bajo_stock" | "agotado" {
  if (product.variants.length === 0) return "agotado";
  
  const hasDisponible = product.variants.some(v => v.stockStatus === "disponible" && v.stock > 0);
  const hasBajoStock = product.variants.some(v => v.stockStatus === "bajo_stock" && v.stock > 0);
  
  if (hasDisponible) return "disponible";
  if (hasBajoStock) return "bajo_stock";
  return "agotado";
}

export function getVariantStockStatus(variant: { stock: number; stockStatus: string }): "disponible" | "bajo_stock" | "agotado" {
  if (variant.stock <= 0 || variant.stockStatus === "agotado") return "agotado";
  if (variant.stockStatus === "bajo_stock" || variant.stock <= 5) return "bajo_stock";
  return "disponible";
}