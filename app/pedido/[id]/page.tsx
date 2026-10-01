import type { Metadata } from "next";
import { SmartImage } from "@/components/smart-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getImages } from "@/lib/products";
import { STATUS_LABELS, shortOrderId } from "@/lib/orders";
import { getWhatsAppUrl, formatPrice, STORE_CONFIG } from "@/lib/store";
import { CartSync } from "@/components/cart-sync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido recibido",
  description: "Tu pedido fue registrado. Te contactaremos por WhatsApp para confirmarlo.",
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          productVariant: { include: { product: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const items = order.items.map((item) => {
    const product = item.productVariant.product;
    const images = getImages(product.images);
    return { ...item, product, image: images[0] };
  });

  const createdAt = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(order.createdAt);

  // Construir mensaje de WhatsApp
  const whatsappMessage = `🛍️ NUEVO PEDIDO en ${STORE_CONFIG.name}

Pedido: #${shortOrderId(order.id)}

Cliente:
${order.customerName}

Teléfono:
${order.customerPhone}

Ciudad:
${order.customerCity}

Dirección:
${order.customerAddress}${order.customerNeighborhood ? `, ${order.customerNeighborhood}` : ""}, ${order.customerCity} — ${order.customerDepartment}${order.customerReference ? `\nReferencia: ${order.customerReference}` : ""}

Productos:
${order.items
  .map(
    (item) =>
      `- ${item.productVariant.product.name} (${item.productVariant.name}) x${item.quantity}`
  )
  .join("\n")}

Subtotal:
${formatPrice(order.subtotal)}

Envío:
${formatPrice(order.shippingCost)}

TOTAL:
${formatPrice(order.total)}

Método de pago:
Contra entrega`;

  const whatsappUrl = getWhatsAppUrl(whatsappMessage);
  const showWhatsAppWarning = !STORE_CONFIG.whatsapp || STORE_CONFIG.whatsapp === "573000000000";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <CartSync />
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-emerald-600"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h1 className="mt-4 text-3xl font-bold text-zinc-900">
            ¡Gracias por tu pedido!
          </h1>
          <p className="mt-2 font-medium text-zinc-700">
            Tu pedido ha sido registrado correctamente.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            No pagaste nada ahora: pagas en efectivo cuando recibes el pedido.
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Número de pedido</span>
            <span className="font-mono font-semibold text-zinc-800">
              {shortOrderId(order.id)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-500">Estado</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-500">Fecha</span>
            <span className="text-zinc-800">{createdAt}</span>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-bold">Resumen del pedido</h2>
        <ul className="mt-3 divide-y divide-zinc-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              {item.image ? (
                <SmartImage
                  src={item.image}
                  alt={item.product.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-200 text-xs text-zinc-500">
                  Sin img
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-zinc-800">
                  {item.product.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {item.productVariant.name} × {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-800">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatPrice(item.unitPrice)} c/u
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-4">
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-700">Subtotal</span>
            <span className="text-sm text-zinc-500">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-zinc-700">Envío</span>
            <span className="text-sm text-zinc-500">{formatPrice(order.shippingCost)}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-4">
          <span className="font-semibold text-zinc-700">Total a pagar contra entrega</span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatPrice(order.total)}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 p-4 text-sm">
          <p className="font-semibold text-zinc-800">Datos de entrega</p>
          <p className="mt-1 text-zinc-600">{order.customerName}</p>
          <p className="text-zinc-600">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-zinc-600">{order.customerEmail}</p>}
          <p className="text-zinc-600">
            {order.customerAddress}{order.customerNeighborhood ? `, ${order.customerNeighborhood}` : ""}, {order.customerCity} — {order.customerDepartment}
          </p>
          {order.customerReference && (
            <p className="mt-1 text-zinc-600">Referencia: {order.customerReference}</p>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800 flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.38A8 8 0 0 0 12 2C6.477 2 2 6.477 2 12c0 3.433 1.79 6.529 4.5 8.38v-2.77c-.973-.546-1.5-1.418-1.5-2.38 0-1.657 1.343-3 3-3h.034C12.7 15 14.034 14 15.38 12.73l1.89-1.28c-.673-.73-1.07-1.69-1.07-2.72 0-2.21 1.79-4 4-4s4 1.79 4 4c0 .89-.266 1.71-.712 2.36l2.054 1.31A8.002 8.002 0 0022 12c0-4.411-3.589-8-8-8z" />
            </svg>
            Confirmar pedido por WhatsApp
          </p>
          {showWhatsAppWarning && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Modo desarrollo: STORE_WHATSAPP no configurado en .env
            </p>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.38A8 8 0 0 0 12 2C6.477 2 2 6.477 2 12c0 3.433 1.79 6.529 4.5 8.38v-2.77c-.973-.546-1.5-1.418-1.5-2.38 0-1.657 1.343-3 3-3h.034C12.7 15 14.034 14 15.38 12.73l1.89-1.28c-.673-.73-1.07-1.69-1.07-2.72 0-2.21 1.79-4 4-4s4 1.79 4 4c0 .89-.266 1.71-.712 2.36l2.054 1.31A8.002 8.002 0 0022 12c0-4.411-3.589-8-8-8z" />
            </svg>
            Enviar por WhatsApp
          </a>
          <p className="mt-2 text-xs text-emerald-700">
            Se abrirá WhatsApp con el mensaje pre-llenado. Solo envíalo.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/productos"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-emerald-700"
          >
            Seguir comprando
          </Link>
          <Link
            href="/"
            className="text-center text-sm font-medium text-zinc-500 transition hover:text-emerald-600"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}