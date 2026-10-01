/**
 * Cálculo de precios y márgenes (dropshipping).
 *
 * El costo del proveedor nunca se muestra en la tienda: solo en el panel.
 * El margen se calcula sobre el precio de venta (no sobre el costo).
 */
import { formatCOP } from "./format";

/** Margen mínimo recomendado para no vender por debajo de lo que cuesta. */
export const MIN_MARGIN_PERCENT = 20;

export type UnitMargin = {
  salePrice: number;
  supplierPrice: number;
  /** Ganancia por unidad en COP (puede ser negativa). */
  amount: number;
  /** Margen sobre el precio de venta, en porcentaje. */
  percent: number;
  /** Markup sobre el costo del proveedor, en porcentaje. */
  markupPercent: number;
  /** El precio de venta no cubre el costo. */
  isLoss: boolean;
  /** Margen por debajo del mínimo recomendado. */
  isLow: boolean;
};

export function calculateMargin(
  salePrice: number,
  supplierPrice: number
): UnitMargin {
  const amount = salePrice - supplierPrice;
  const percent = salePrice > 0 ? Math.round((amount / salePrice) * 100) : 0;
  const markupPercent =
    supplierPrice > 0 ? Math.round((amount / supplierPrice) * 100) : 0;

  return {
    salePrice,
    supplierPrice,
    amount,
    percent,
    markupPercent,
    isLoss: amount <= 0,
    isLow: amount <= 0 || percent < MIN_MARGIN_PERCENT,
  };
}

export function marginLabel(margin: UnitMargin): string {
  if (margin.isLoss) return "Venta por debajo del costo";
  return `${formatCOP(margin.amount)} por unidad (${margin.percent}%)`;
}

export function marginTone(margin: UnitMargin): string {
  if (margin.isLoss) return "text-red-600";
  if (margin.isLow) return "text-amber-600";
  return "text-emerald-700";
}

export type OrderMargin = {
  revenue: number;
  cost: number;
  profit: number;
  percent: number;
  /** Items sin costo registrado (pedidos creados antes de congelar el costo). */
  pendingCost: boolean;
};

/**
 * Margen real de un pedido usando el costo congelado en cada ítem.
 * Si algún ítem no tiene costo guardado, se informa para no mostrar un margen falso.
 */
export function calculateOrderMargin(
  items: { quantity: number; unitPrice: number; unitCost: number | null }[]
): OrderMargin {
  const revenue = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cost = items.reduce(
    (sum, i) => sum + (i.unitCost ?? 0) * i.quantity,
    0
  );
  const profit = revenue - cost;

  return {
    revenue,
    cost,
    profit,
    percent: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
    pendingCost: items.some((i) => i.unitCost === null),
  };
}

/**
 * Precio de venta sugerido a partir del costo del proveedor.
 * @param targetPercent margen mínimo deseado sobre el precio de venta.
 */
export function suggestedSalePrice(
  supplierPrice: number,
  targetPercent: number = MIN_MARGIN_PERCENT
): number {
  if (supplierPrice <= 0) return 0;
  const divisor = 1 - targetPercent / 100;
  if (divisor <= 0) return 0;
  return Math.ceil(supplierPrice / divisor / 1000) * 1000;
}
