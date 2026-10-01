import { formatPrice } from "./store";

export function formatCOP(amount: number): string {
  return formatPrice(amount);
}