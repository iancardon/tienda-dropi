import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import { getImages } from "@/lib/products";
import { calculateOrderMargin } from "@/lib/pricing";
import {
  NEXT_STATUS_HINT,
  ORDER_STATUSES,
  STATUS_BADGE,
  STATUS_LABELS,
  buildCustomerMessage,
  buildSupplierMessage,
  customerWhatsAppUrl,
  shortOrderId,
} from "@/lib/orders";
import { SmartImage } from "@/components/smart-image";
import { CopyButton } from "@/components/copy-button";
import {
  deleteOrder,
  purgeDemoOrders,
  setOrderDemo,
  setOrderStatus,
  updateProviderOrder,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle del pedido",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

export default async function AdminPedidoDetallePage({
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

  const items = order.items.map((item) => ({
    ...item,
    image: getImages(item.productVariant.product.images)[0],
  }));

  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const messageForCustomer = buildCustomerMessage(order, formatCOP);
  const messageForSupplier = buildSupplierMessage(order, formatCOP);
  const whatsappUrl = customerWhatsAppUrl(order.customerPhone, messageForCustomer);
  const phoneLink = customerWhatsAppUrl(order.customerPhone, "");

  const margin = calculateOrderMargin(order.items);
  const netMargin = margin.profit - order.shippingCost;
  const nextHint = NEXT_STATUS_HINT[order.status];
  const dateFormat = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/pedidos"
            className="text-sm text-zinc-500 transition hover:text-emerald-600"
          >
            ← Volver a pedidos
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-3xl font-bold">
            <span className="font-mono">#{shortOrderId(order.id)}</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[order.status] ?? "bg-zinc-100 text-zinc-600"}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
            {order.isDemo && (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                Pedido de prueba
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Creado el {dateFormat.format(order.createdAt)} · Actualizado el{" "}
            {dateFormat.format(order.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pedido/${order.id}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-400"
          >
            Ver como cliente
          </Link>
          <CopyButton
            text={messageForCustomer}
            label="Copiar resumen"
            title="Copia el pedido completo como texto"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">
                Productos ({order.items.length}{" "}
                {order.items.length === 1 ? "producto" : "productos"})
              </h2>
              <p className="text-sm text-zinc-500">{totalUnits} unidades</p>
            </div>

            <ul className="mt-4 divide-y divide-zinc-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-4 py-3">
                  {item.image ? (
                    <SmartImage
                      src={item.image}
                      alt={item.productVariant.product.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-medium uppercase text-zinc-400">
                      Sin img
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/productos/${item.productVariant.product.slug}`}
                      className="font-medium transition hover:text-emerald-600"
                    >
                      {item.productVariant.product.name}
                    </Link>
                    <p className="text-sm text-zinc-500">
                      Variante: {item.productVariant.name} · SKU{" "}
                      {item.productVariant.sku}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {formatCOP(item.unitPrice)} × {item.quantity} unidades
                    </p>
                    {item.unitCost !== null && (
                      <p className="text-xs text-zinc-400">
                        Costo proveedor: {formatCOP(item.unitCost)} c/u ·{" "}
                        {formatCOP(item.unitCost * item.quantity)} total
                      </p>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatCOP(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal ({totalUnits} unidades)</span>
                <span>{formatCOP(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Envío (contra entrega)</span>
                <span>{formatCOP(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total a cobrar</span>
                <span className="text-emerald-600">{formatCOP(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm">
              <p className="font-semibold text-zinc-700">Margen del pedido</p>
              <div className="mt-2 space-y-1 text-zinc-600">
                <div className="flex justify-between">
                  <span>Venta</span>
                  <span>{formatCOP(margin.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo del proveedor</span>
                  <span>
                    {margin.pendingCost ? "Parcial" : `-${formatCOP(margin.cost)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Envío que pagas tú</span>
                  <span>-{formatCOP(order.shippingCost)}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 font-semibold">
                <span>Utilidad estimada</span>
                <span className={netMargin < 0 ? "text-red-600" : "text-emerald-700"}>
                  {formatCOP(netMargin)} ({margin.percent}% sobre venta)
                </span>
              </div>
              {margin.pendingCost && (
                <p className="mt-2 text-xs text-amber-700">
                  Este pedido se creó sin costo registrado: el margen puede estar
                  incompleto.
                </p>
              )}
              {nextHint && (
                <p className="mt-2 text-xs text-zinc-500">Siguiente paso: {nextHint}</p>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold">Datos del cliente y entrega</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" value={<span className="font-medium">{order.customerName}</span>} />
              <Field
                label="Teléfono / WhatsApp"
                value={
                  phoneLink ? (
                    <a
                      href={phoneLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-700 underline"
                    >
                      {order.customerPhone}
                    </a>
                  ) : (
                    <span className="font-medium text-red-600">
                      {order.customerPhone} (inválido)
                    </span>
                  )
                }
              />
              <Field
                label="Correo"
                value={
                  order.customerEmail ? (
                    <a href={`mailto:${order.customerEmail}`} className="font-medium underline">
                      {order.customerEmail}
                    </a>
                  ) : (
                    <span className="text-zinc-400">No indicado</span>
                  )
                }
              />
              <Field
                label="Proveedor"
                value={
                  order.providerName ?? (
                    <span className="text-zinc-400">Sin asignar</span>
                  )
                }
              />
              <Field
                label="ID pedido en el proveedor"
                value={
                  order.providerOrderId ? (
                    <span className="font-mono">{order.providerOrderId}</span>
                  ) : (
                    <span className="text-zinc-400">Sin asignar</span>
                  )
                }
              />
              <Field
                label="Estado en el proveedor"
                value={
                  order.providerStatus ?? (
                    <span className="text-zinc-400">Sin reportar</span>
                  )
                }
              />
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Dirección
                </dt>
                <dd className="mt-1">
                  {order.customerAddress}
                  <br />
                  <span className="text-zinc-500">
                    {[
                      order.customerNeighborhood,
                      order.customerCity,
                      order.customerDepartment,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </dd>
              </div>
              <Field
                label="Referencia de entrega"
                value={
                  order.customerReference ?? (
                    <span className="text-zinc-400">No indicada</span>
                  )
                }
              />
              <Field
                label="Método de pago"
                value="Contra entrega (COD)"
              />
            </dl>
          </section>

          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-bold text-amber-900">Pedido de prueba</h2>
            <p className="mt-1 text-sm text-amber-800">
              Marca este pedido como prueba si no corresponde a una compra real.
              Los pedidos marcados se pueden borrar todos de una vez sin tocar los
              reales.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <form action={setOrderDemo}>
                <input type="hidden" name="id" value={order.id} />
                <input
                  type="hidden"
                  name="isDemo"
                  value={order.isDemo ? "false" : "true"}
                />
                <button
                  type="submit"
                  className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                >
                  {order.isDemo ? "Quitar marca de prueba" : "Marcar como prueba"}
                </button>
              </form>
              <p className="text-sm text-amber-800">
                Estado actual: {order.isDemo ? "marcado como prueba" : "pedido normal"}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold">Estado</h2>
            <form action={setOrderStatus} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Guardar estado
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold">Datos del proveedor</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Se llenan a mano después de crear el pedido en el proveedor. Cuando
              exista una integración real, estos mismos campos se completarán solos.
            </p>
            <form action={updateProviderOrder} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <input
                type="text"
                name="providerName"
                defaultValue={order.providerName ?? ""}
                placeholder="Proveedor. Ej. Dropi"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                name="providerOrderId"
                defaultValue={order.providerOrderId ?? ""}
                placeholder="ID del pedido en el proveedor. Ej. DRPI-12345"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                name="providerStatus"
                defaultValue={order.providerStatus ?? ""}
                placeholder="Estado en el proveedor. Ej. en preparación"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-400"
              >
                Guardar
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold">WhatsApp con el cliente</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Abre el chat con el pedido completo: productos, cantidades, precios,
              subtotal, envío, total y dirección.
            </p>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Enviar resumen por WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-sm text-red-600">
                Teléfono inválido: revisa los datos del cliente.
              </p>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-600">
                Ver el mensaje
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
                {messageForCustomer}
              </pre>
            </details>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold">Enviar al proveedor</h2>
            <p className="mt-1 text-sm text-zinc-500">
              El envío a Dropi es manual: copia este resumen y pégalo donde lo
              pidas. Cuando exista la API oficial, se automatiza.
            </p>
            <CopyButton
              text={messageForSupplier}
              label="Copiar resumen para el proveedor"
              copiedLabel="¡Copiado! Pégalo en Dropi"
              className="mt-3 w-full"
            />
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-600">
                Ver el mensaje
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
                {messageForSupplier}
              </pre>
            </details>
          </section>

          <section className="rounded-2xl border border-red-200 bg-white p-5">
            <h2 className="text-lg font-bold text-red-700">Eliminar pedido</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Borra este pedido y sus productos. Para confirmar, escribe{" "}
              <span className="font-mono font-semibold">{shortOrderId(order.id)}</span>.
            </p>
            <form action={deleteOrder} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <input
                type="text"
                name="confirm"
                placeholder={shortOrderId(order.id)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-red-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Eliminar este pedido
              </button>
            </form>
          </section>

          {order.isDemo && (
            <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
              <h2 className="text-lg font-bold text-purple-900">Borrar pruebas</h2>
              <p className="mt-1 text-sm text-purple-800">
                Elimina <strong>todos</strong> los pedidos marcados como prueba de
                una vez. Los pedidos reales nunca se tocan.
              </p>
              <form action={purgeDemoOrders} className="mt-3 space-y-3">
                <input
                  type="text"
                  name="confirm"
                  placeholder="Escribe ELIMINAR"
                  className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-800"
                >
                  Purgar pedidos de prueba
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
