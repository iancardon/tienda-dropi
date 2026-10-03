import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import {
  NEXT_STATUS_HINT,
  ORDER_STATUSES,
  STATUS_BADGE,
  STATUS_LABELS,
  shortOrderId,
} from "@/lib/orders";
import { purgeDemoOrders, setOrderDemo, setOrderStatus, updateProviderOrder } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedidos",
};

const FILTERS = {
  todos: { label: "Todos", where: {} },
  pruebas: { label: "Solo pruebas", where: { isDemo: true } },
  reales: { label: "Solo reales", where: { isDemo: false } },
} as const;

type FilterKey = keyof typeof FILTERS;

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const filterKey: FilterKey =
    filtro === "pruebas" || filtro === "reales" ? filtro : "todos";
  const filter = FILTERS[filterKey];

  const [orders, demoCount] = await Promise.all([
    prisma.order.findMany({
      where: filter.where,
      include: { items: { include: { productVariant: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.count({ where: { isDemo: true } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
            <Link
              key={key}
              href={key === "todos" ? "/admin/pedidos" : `/admin/pedidos?filtro=${key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filterKey === key
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-700 hover:border-emerald-400"
              }`}
            >
              {FILTERS[key].label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-1 text-zinc-500">
        Cambia el estado manualmente después de validar por WhatsApp y registra el
        ID de Dropi cuando crees el envío.
      </p>

      {demoCount > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm text-purple-900">
            Hay <strong>{demoCount}</strong> pedido(s) marcados como prueba. Puedes
            borrarlos todos de una vez: los pedidos reales no se tocan.
          </p>
          <form action={purgeDemoOrders} className="flex items-center gap-2">
            <input
              type="text"
              name="confirm"
              placeholder="Escribe ELIMINAR"
              className="w-40 rounded-lg border border-purple-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              Purgar pruebas
            </button>
          </form>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="mt-6 text-zinc-500">
          {filterKey === "todos"
            ? "Aún no hay pedidos. Cuando lleguen desde el checkout, aparecerán aquí."
            : `No hay pedidos en el filtro "${FILTERS[filterKey].label}".`}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-2xl border bg-white p-5 ${
                order.isDemo ? "border-purple-200" : "border-zinc-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-mono font-semibold transition hover:text-emerald-600"
                    >
                      {shortOrderId(order.id)}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status] ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    {order.isDemo && (
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        Prueba
                      </span>
                    )}
                    {order.dropiOrderId ? (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        Dropi: {order.dropiOrderId}
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                        Sin crear en Dropi
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-zinc-900">
                    {order.customerName}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {order.customerPhone} · {order.customerAddress},{" "}
                    {order.customerCity} — {order.customerDepartment}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {order.items.reduce((acc, i) => acc + i.quantity, 0)} artículo(s) ·{" "}
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(order.createdAt)}
                  </p>
                  {NEXT_STATUS_HINT[order.status] && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Siguiente paso: {NEXT_STATUS_HINT[order.status]}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-900">
                      {formatCOP(order.total)}
                    </p>
                    <p className="text-xs text-zinc-400">Contra entrega</p>
                  </div>

                  <form action={setOrderStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
                    >
                      Guardar
                    </button>
                  </form>

                  <div className="flex items-center gap-3">
                    <form action={setOrderDemo}>
                      <input type="hidden" name="id" value={order.id} />
                      <input
                        type="hidden"
                        name="isDemo"
                        value={order.isDemo ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="text-xs font-medium text-purple-700 underline"
                      >
                        {order.isDemo ? "Quitar marca de prueba" : "Marcar como prueba"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-sm font-medium text-emerald-700 underline"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500">
                  {order.items
                    .map((item) => `${item.productVariant.name} ×${item.quantity}`)
                    .join(", ")}
                </p>
                <form
                  action={updateProviderOrder}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <input type="hidden" name="id" value={order.id} />
                  <input
                    type="text"
                    name="providerName"
                    defaultValue={order.providerName ?? ""}
                    placeholder="Proveedor"
                    className="w-36 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="providerOrderId"
                    defaultValue={order.providerOrderId ?? ""}
                    placeholder="ID pedido proveedor"
                    className="w-44 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-emerald-400"
                  >
                    Asignar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
