/**
 * Preparación de productos para trabajar con el proveedor (Dropi).
 *
 * Todavía NO hay integración con la API de Dropi: aquí solo se define qué
 * necesita un producto para poder venderse y despacharse con el proveedor.
 * Cuando exista la integración, este módulo es el punto de apoyo.
 */
import { calculateMargin } from "./pricing";

export const SUPPLIER_NAME = "Dropi";

export type SupplierReadiness = {
  ready: boolean;
  missing: string[];
};

/** Nombre del proveedor de un producto, con Dropi como valor por defecto. */
export function supplierNameOf(product: { supplier?: string | null }): string {
  const name = product.supplier?.trim();
  return name && name.length > 0 ? name : SUPPLIER_NAME;
}

export function supplierReadiness(
  product: {
    supplier?: string | null;
    supplierProductId: string | null;
    supplierPrice: number;
    supplierShippingCost?: number;
    basePrice: number;
    isDemo: boolean;
    active: boolean;
    variants: { sku: string; stock: number; stockStatus: string }[];
  }
): SupplierReadiness {
  const supplier = supplierNameOf(product);
  const missing: string[] = [];
  const margin = calculateMargin(
    product.basePrice,
    product.supplierPrice + (product.supplierShippingCost ?? 0)
  );

  if (product.isDemo) {
    missing.push("Es un producto DEMO (no se publica ni se despacha)");
  }
  if (!product.supplierProductId) {
    missing.push(`Falta el ID del producto en ${supplier}`);
  }
  if (product.supplierPrice <= 0) {
    missing.push("Falta el costo del proveedor");
  }
  if (margin.isLoss) {
    missing.push("El precio de venta no cubre el costo");
  } else if (margin.isLow) {
    missing.push("Margen por debajo del mínimo recomendado");
  }
  if (product.variants.length === 0) {
    missing.push("No tiene variantes");
  } else if (product.variants.every((v) => v.sku.trim() === "")) {
    missing.push("Las variantes no tienen SKU");
  }
  if (!product.active) {
    missing.push("Está oculto en la tienda");
  }

  return { ready: missing.length === 0, missing };
}
