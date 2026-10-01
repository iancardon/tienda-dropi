import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel de administración",
};

export default async function AdminDashboard() {
  const [totalOrders, groupByStatus, productCount, agotadosCount, salesAgg] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.productVariant.count({ where: { stockStatus: "agotado" } }),
      prisma.order.aggregate({ _sum: { total: true } }),
    ]);

  const counts = Object.fromEntries(
    groupByStatus.map((g) => [g.status, g._count._all])
  );

  const cards = [
    { label: "Pedidos totales", value: totalOrders, href: "/admin/pedidos" },
    {
      label: "Ventas (todos los pedidos)",
      value: formatCOP(salesAgg._sum.total ?? 0),
      href: "/admin/pedidos",
    },
    { label: "Pendientes", value: counts["pendiente"] ?? 0, href: "/admin/pedidos" },
    { label: "En preparación", value: counts["preparando"] ?? 0, href: "/admin/pedidos" },
    { label: "Enviados", value: counts["enviado"] ?? 0, href: "/admin/pedidos" },
    { label: "Entregados", value: counts["entregado"] ?? 0, href: "/admin/pedidos" },
    { label: "Productos activos", value: productCount, href: "/admin/productos" },
    { label: "Variantes agotadas", value: agotadosCount, href: "/admin/productos" },
  ];

  const quickLinks = [
    { href: "/admin/pedidos", title: "Gestionar pedidos", description: "Ver pedidos, cambiar estado y registrar el ID de Dropi." },
    { href: "/admin/productos/nuevo", title: "Crear producto", description: "Agregar un producto nuevo con sus variantes y precios." },
    { href: "/admin/productos", title: "Editar productos", description: "Actualizar precio, stock, imágenes y más." },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold">Resumen</h1>
      <p className="mt-1 text-zinc-500">
        Estado actual de la tienda: pedidos y stock.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
          >
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">Accesos rápidos</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-700">
              {link.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}