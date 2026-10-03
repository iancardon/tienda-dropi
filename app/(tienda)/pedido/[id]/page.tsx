import type { Metadata } from "next";
import { SmartImage } from "@/components/smart-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getImages } from "@/lib/products";
import { STATUS_LABELS, shortOrderId } from "@/lib/orders";
import { getWhatsAppUrl, formatPrice, STORE_CONFIG } from "@/lib/store";
import { CartSync } from "@/components/cart-sync";
import { IconCash, IconCheck, IconTruck, IconWhatsApp } from "@/components/icons";

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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <CartSync />

      {/* Encabezado de éxito. Es lo primero que ve la persona al llegar, así
          que va fuera de la caja para no competir con el resumen. */}
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <IconCheck className="h-8 w-8 text-emerald-600" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          ¡Gracias por tu pedido!
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
          Registramos tu pedido correctamente. Te escribimos por WhatsApp para
          confirmar los datos de entrega.
        </p>
      </div>

      {/* Los tres pasos siguientes son lo que va a ocurrir. Se muestran arriba
          porque es la duda inmediata: "¿y ahora qué?". */}
      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <IconWhatsApp className="h-4 w-4" />,
            title: "Te escribimos",
            detail: "Confirmamos tus datos por WhatsApp",
          },
          {
            icon: <IconTruck className="h-4 w-4" />,
            title: "Despachamos",
            detail: "Te enviamos el número de guía",
          },
          {
            icon: <IconCash className="h-4 w-4" />,
            title: "Pagas al recibir",
            detail: "En efectivo al mensajero",
          },
        ].map((step) => (
          <li
            key={step.title}
            className="rounded-xl border border-zinc-200 bg-white p-3.5 text-center"
          >
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              {step.icon}
            </span>
            <p className="mt-2 text-sm font-semibold text-zinc-900">
              {step.title}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-zinc-500">
              {step.detail}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        {/* Identificadores del pedido: la persona los necesita para escribir
            por WhatsApp, por eso el número va con tipografía monoespaciada. */}
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">Número de pedido</dt>
            <dd className="font-mono text-base font-bold text-zinc-900">
              {shortOrderId(order.id)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">Estado</dt>
            <dd>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">Fecha</dt>
            <dd className="text-zinc-800">{createdAt}</dd>
          </div>
        </dl>

        <h2 className="mt-7 text-base font-bold text-zinc-900">
          Resumen del pedido
        </h2>
        <ul className="mt-2 divide-y divide-zinc-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              {item.image ? (
                <SmartImage
                  src={item.image}
                  alt={item.product.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] text-zinc-500">
                  Sin img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-medium text-zinc-800">
                  {item.product.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {item.productVariant.name} × {item.quantity}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-zinc-800">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {formatPrice(item.unitPrice)} c/u
                </p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-2 border-t border-zinc-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-600">Subtotal</dt>
            <dd className="font-medium text-zinc-900">
              {formatPrice(order.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-600">Envío</dt>
            <dd className="font-medium text-zinc-900">
              {formatPrice(order.shippingCost)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
            <dt className="text-base font-bold text-zinc-900">
              Total a pagar contra entrega
            </dt>
            <dd className="text-xl font-bold text-emerald-700">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <p className="font-semibold text-zinc-800">Datos de entrega</p>
          <p className="mt-1.5 text-zinc-600">{order.customerName}</p>
          <p className="text-zinc-600">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-zinc-600">{order.customerEmail}</p>}
          <p className="text-zinc-600">
            {order.customerAddress}
            {order.customerNeighborhood ? `, ${order.customerNeighborhood}` : ""},{" "}
            {order.customerCity} — {order.customerDepartment}
          </p>
          {order.customerReference && (
            <p className="mt-1 text-zinc-600">
              Referencia: {order.customerReference}
            </p>
          )}
        </div>

        {/* El botón de WhatsApp es la acción principal de esta pantalla: sin
            él el pedido queda sin confirmar. */}
        <div className="mt-6 rounded-xl bg-emerald-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-emerald-800">
            <IconWhatsApp className="h-5 w-5" />
            Confirma tu pedido por WhatsApp
          </p>
          {showWhatsAppWarning && (
            <p className="mt-2 text-xs text-amber-600">
              Modo desarrollo: STORE_WHATSAPP no configurado en .env
            </p>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <IconWhatsApp className="h-5 w-5" />
            Enviar por WhatsApp
          </a>
          <p className="mt-2 text-xs text-emerald-700">
            Se abrirá WhatsApp con el mensaje listo. Solo pulsa enviar.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/productos"
            className="rounded-xl bg-emerald-600 px-6 py-3.5 text-center font-semibold text-white transition hover:bg-emerald-700"
          >
            Seguir comprando
          </Link>
          <Link
            href="/"
            className="text-center text-sm font-medium text-zinc-500 transition hover:text-emerald-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}