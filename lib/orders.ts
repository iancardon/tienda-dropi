import { STORE_CONFIG } from "@/lib/store";

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "preparando",
  "enviado",
  "entregado",
  "devolucion",
  "rechazado",
  "cancelado",
] as const;

/** Estados en los que el pedido ya no espera gestión. */
export const CLOSED_STATUSES = ["entregado", "devolucion", "rechazado", "cancelado"] as const;

export const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente de confirmación",
  confirmado: "Confirmado",
  preparando: "En preparación (proveedor)",
  enviado: "Enviado por el proveedor",
  entregado: "Entregado",
  devolucion: "En devolución",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

/** Qué sigue después de cada estado, para guiar el trabajo diario. */
export const NEXT_STATUS_HINT: Record<string, string> = {
  pendiente: "Confirma por WhatsApp y crea el envío en el proveedor.",
  confirmado: "Envía el pedido al proveedor para que lo procese.",
  preparando: "El proveedor está preparando el envío.",
  enviado: "Pendiente de entrega y cobro contra entrega.",
  entregado: "Cobro recibido. Pedido cerrado.",
  devolucion: "Gestiona la devolución con el cliente.",
  rechazado: "No se pudo enviar. Ofrece otra opción al cliente.",
  cancelado: "Pedido cerrado sin envío.",
};

export const STATUS_BADGE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmado: "bg-blue-100 text-blue-800",
  preparando: "bg-violet-100 text-violet-800",
  enviado: "bg-indigo-100 text-indigo-800",
  entregado: "bg-emerald-100 text-emerald-800",
  devolucion: "bg-orange-100 text-orange-800",
  rechazado: "bg-red-100 text-red-800",
  cancelado: "bg-zinc-200 text-zinc-700",
};

export function isClosedStatus(status: string): boolean {
  return (CLOSED_STATUSES as readonly string[]).includes(status);
}

export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function customerWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "";
  const intl = digits.length > 10 ? digits : `57${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

type OrderForMessage = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string;
  customerNeighborhood: string | null;
  customerCity: string;
  customerDepartment: string;
  customerReference: string | null;
  dropiOrderId: string | null;
  createdAt: Date;
  items: {
    quantity: number;
    unitPrice: number;
    unitCost?: number | null;
    productVariant: { name: string; sku: string; product: { name: string } };
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
};

function orderDate(order: { createdAt: Date }): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(order.createdAt);
}

function productLines(
  order: Pick<OrderForMessage, "items">,
  formatPrice: (amount: number) => string
): string[] {
  return order.items.map((item) => {
    const variant =
      item.productVariant.name.toLowerCase() === "única" ||
      item.productVariant.name.toLowerCase() === "unica"
        ? ""
        : ` (${item.productVariant.name})`;
    const line = `${formatPrice(item.unitPrice)} x ${item.quantity} = ${formatPrice(
      item.unitPrice * item.quantity
    )}`;
    return `- ${item.productVariant.product.name}${variant} · SKU ${item.productVariant.sku}: ${line}`;
  });
}

/** Mensaje de confirmación para el cliente, con el pedido completo. */
export function buildCustomerMessage(
  order: OrderForMessage,
  formatPrice: (amount: number) => string
): string {
  const address = [
    order.customerAddress,
    order.customerNeighborhood,
    order.customerCity,
    order.customerDepartment,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `Hola ${order.customerName.split(" ")[0]}, gracias por tu pedido en ${STORE_CONFIG.name} 🛍️`,
    "",
    `Pedido: #${shortOrderId(order.id)}`,
    `Fecha: ${orderDate(order)}`,
    "",
    "Productos:",
    ...productLines(order, formatPrice),
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Envío: ${formatPrice(order.shippingCost)}`,
    `*Total a pagar contra entrega: ${formatPrice(order.total)}*`,
    "",
    `Entregar en: ${address}`,
    order.customerReference ? `Referencia: ${order.customerReference}` : "",
    order.dropiOrderId ? `Pedido en el proveedor: ${order.dropiOrderId}` : "",
    "",
    "¿Confirmas que recibes este pedido? Responde este mensaje y te confirmamos.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/**
 * Mensaje para enviar el pedido al proveedor. Es texto: hoy el envío a Dropi
 * es manual (no hay API conectada) y este mensaje evita tener que armarlo a mano.
 */
export function buildSupplierMessage(
  order: OrderForMessage,
  formatPrice: (amount: number) => string
): string {
  const address = [
    order.customerAddress,
    order.customerNeighborhood,
    order.customerCity,
    order.customerDepartment,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `Nuevo pedido #${shortOrderId(order.id)} (${order.customerPhone})`,
    "",
    ...productLines(order, formatPrice),
    "",
    `Total cliente: ${formatPrice(order.total)} (incluye envío ${formatPrice(
      order.shippingCost
    )})`,
    `Costo estimado: ${formatPrice(
      order.items.reduce(
        (sum, item) => sum + (item.unitCost ?? 0) * item.quantity,
        0
      )
    )}`,
    "",
    `Entregar en: ${address}`,
    order.customerReference ? `Referencia: ${order.customerReference}` : "",
    order.customerEmail ? `Correo: ${order.customerEmail}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}