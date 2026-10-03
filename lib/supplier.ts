/**
 * Preparación de productos para trabajar con el proveedor (Dropi).
 *
 * Todavía NO hay integración con la API de Dropi: aquí solo se define qué
 * necesita un producto para poder venderse y despacharse con el proveedor.
 * Cuando exista la integración, este módulo es el punto de apoyo.
 */
import { calculateMargin, type UnitMargin } from "./pricing";

export const SUPPLIER_NAME = "Dropi";

/**
 * Margen de un producto descuuyendo el costo del proveedor y lo que el
 * proveedor cobra por enviarlo. Es la misma cuenta en todo el panel, para que
 * el número que ves en la lista sea el mismo que ves al editar.
 */
export function unitMarginFor(product: {
  basePrice: number;
  supplierPrice: number;
  supplierShippingCost?: number | null;
}): UnitMargin {
  return calculateMargin(
    product.basePrice,
    product.supplierPrice + (product.supplierShippingCost ?? 0)
  );
}

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
  const margin = unitMarginFor(product);

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
