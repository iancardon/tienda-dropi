import { Resend } from "resend";

/**
 * Aviso por correo cuando entra un pedido nuevo.
 *
 * Reglas de diseño, a propósito:
 * - Nunca puede tumbar el checkout. Si algo falla, se registra con
 *   console.error y el pedido sigue su curso igual.
 * - Nunca imprime la API key ni datos del cliente en el log.
 * - Sin HTML: el correo va en texto plano, así que no hay nada que escapar.
 * - Si faltan las variables, no hace nada y tampoco es un error.
 */

export type OrderEmailConfig = {
  apiKey: string;
  to: string;
  from: string;
  /** true solo si ORDER_EMAIL_TEST=true: permite avisar de pedidos de prueba. */
  includeDemo: boolean;
};

export function readOrderEmailConfig(): OrderEmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ORDER_NOTIFY_EMAIL?.trim();
  if (!apiKey || !to) return null;

  return {
    apiKey,
    to,
    // onboarding@resend.dev es el remitente que Resend permite usar mientras no
    // se configura un dominio propio.
    from: process.env.ORDER_EMAIL_FROM?.trim() || "onboarding@resend.dev",
    includeDemo: process.env.ORDER_EMAIL_TEST === "true",
  };
}

type OrderForEmail = {
  id: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string;
  customerNeighborhood: string | null;
  customerCity: string;
  customerDepartment: string;
  customerReference: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  isDemo: boolean;
  items: {
    quantity: number;
    unitPrice: number;
    productVariant: { name: string; sku: string; product: { name: string } };
  }[];
};

function cop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Hora de Colombia (America/Bogota), que es UTC-5 todo el año. */
function colombiaTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

/** Una línea por campo; lo que venga vacío se marca para que se note. */
function field(label: string, value: string | null | undefined): string {
  const text = value?.trim();
  return text ? `${label}: ${text}` : `${label}: (no indicado)`;
}

export function buildOrderEmail(order: OrderForEmail, adminUrl: string): {
  subject: string;
  text: string;
} {
  const codigo = order.id.slice(0, 8).toUpperCase();

  const cuerpo = [
    `Nuevo pedido ${codigo}`,
    `Fecha: ${colombiaTime(order.createdAt)} (hora de Colombia)`,
    "",
    "PRODUCTOS",
    ...order.items.map((item) => {
      const producto = item.productVariant.product.name;
      const variante = item.productVariant.name;
      const etiquetaVariante = variante && variante !== "Única" ? ` (${variante})` : "";
      const sku = item.productVariant.sku ? ` [SKU ${item.productVariant.sku}]` : "";
      return `- ${producto}${etiquetaVariante}${sku} x${item.quantity} — ${cop(
        item.unitPrice * item.quantity
      )}`;
    }),
    "",
    "RESUMEN",
    `Subtotal: ${cop(order.subtotal)}`,
    `Envío: ${cop(order.shippingCost)}`,
    `Total a pagar contra entrega: ${cop(order.total)}`,
    "",
    "CLIENTE",
    field("Nombre", order.customerName),
    field("Teléfono", order.customerPhone),
    field("Correo", order.customerEmail),
    field("Dirección", order.customerAddress),
    field("Barrio", order.customerNeighborhood),
    field("Ciudad", order.customerCity),
    field("Departamento", order.customerDepartment),
    field("Referencia", order.customerReference),
    "",
    `Ver en el panel: ${adminUrl}/admin/pedidos/${order.id}`,
    "",
    ...(order.isDemo
      ? ["ATENCIÓN: este pedido está marcado como pedido de prueba."]
      : []),
  ];

  return {
    subject: `Nuevo pedido ${codigo} - ${cop(order.total)}`,
    text: cuerpo.join("\n"),
  };
}

export type SendResult = "sent" | "skipped-demo" | "skipped-config" | "failed";

/**
 * Envía el aviso. Nunca lanza: cualquier fallo se registra y se devuelve.
 */
export async function notifyNewOrder(order: OrderForEmail): Promise<SendResult> {
  const config = readOrderEmailConfig();
  if (!config) return "skipped-config";
  if (order.isDemo && !config.includeDemo) return "skipped-demo";

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const adminUrl = siteUrl || "https://tu-dominio.com";
  const { subject, text } = buildOrderEmail(order, adminUrl);

  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: config.to,
      subject,
      text,
    });
    if (error) {
      // El mensaje de Resend no trae la API key, pero por si acaso se recorta.
      console.error(
        `[correo-pedido] Resend devolvio un error para el pedido ${order.id.slice(0, 8).toUpperCase()}: ${String(
          error.message
        ).slice(0, 300)}`
      );
      return "failed";
    }
    return "sent";
  } catch (error) {
    // Ni la key ni datos del cliente: solo el motivo y el identificador del pedido.
    console.error(
      `[correo-pedido] No se pudo avisar del pedido ${order.id
        .slice(0, 8)
        .toUpperCase()}: ${error instanceof Error ? error.message : "error desconocido"}`
    );
    return "failed";
  }
}