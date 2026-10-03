import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import { supplierReadiness, unitMarginFor } from "@/lib/supplier";
import { toggleProductActive, toggleVariantStock } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos",
};

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  if (products.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Productos</h1>
          <Link
            href="/admin/productos/nuevo"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            + Nuevo producto
          </Link>
        </div>
        <p className="mt-4 text-zinc-500">
          Aún no hay productos. Crea el primero.
        </p>
      </div>
    );
  }

  const demoCount = products.filter((p) => p.isDemo).length;
  const readyCount = products.filter(
    (p) => supplierReadiness(p).ready
  ).length;
  const atRiskCount = products.filter((p) => {
    const margin = unitMarginFor(p);
    return !p.isDemo && (margin.isLoss || margin.isLow);
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="mt-1 text-zinc-500">
            Gestiona precios, margen, stock y visibilidad. El stock refleja la
            disponibilidad del proveedor: no tenemos inventario propio.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-zinc-700">
          {products.length} producto(s)
        </span>
        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800">
          {readyCount} listos para el proveedor
        </span>
        {atRiskCount > 0 && (
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-amber-800">
            {atRiskCount} con margen bajo o negativo
          </span>
        )}
        {demoCount > 0 && (
          <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-amber-900">
            {demoCount} DEMO (solo pruebas)
          </span>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {products.map((product) => {
          const totalCost = product.supplierPrice + product.supplierShippingCost;
          const margin = unitMarginFor(product);
          const readiness = supplierReadiness(product);
          const totalStock = product.variants.reduce(
            (sum, v) => sum + v.stock,
            0
          );

          return (
          <div
            key={product.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    className={`text-lg font-bold ${product.active ? "text-zinc-900" : "text-zinc-400"}`}
                  >
                    {product.name}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {product.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {product.active ? "Activo" : "Oculto"}
                  </span>
                  {product.featured && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Destacado
                    </span>
                  )}
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
                    {product.supplier}
                    {product.supplierProductId
                      ? `: ${product.supplierProductId}`
                      : " · sin ID"}
                  </span>
                  {product.isDemo && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      DEMO · solo pruebas
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-zinc-700">
                    <span className="text-zinc-400">Venta:</span>{" "}
                    {formatCOP(product.basePrice)}
                  </span>
                  <span className="text-zinc-700">
                    <span className="text-zinc-400">Costo:</span>{" "}
                    {formatCOP(product.supplierPrice)}
                    {product.supplierShippingCost > 0 && (
                      <span className="text-zinc-400">
                        {" "}
                        + {formatCOP(product.supplierShippingCost)} envío ={" "}
                        {formatCOP(totalCost)}
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-700">
                    <span className="text-zinc-400">Margen:</span>{" "}
                    <span
                      className={
                        margin.isLoss
                          ? "font-semibold text-red-600"
                          : margin.isLow
                            ? "font-medium text-amber-600"
                            : "font-medium text-emerald-700"
                      }
                    >
                      {formatCOP(margin.amount)} ({margin.percent}%)
                    </span>
                  </span>
                  <span className="text-zinc-700">
                    <span className="text-zinc-400">Stock total:</span>{" "}
                    {totalStock} ({product.variants.length} variante
                    {product.variants.length === 1 ? "" : "s"})
                  </span>
                  <span className="text-zinc-700">
                    <span className="text-zinc-400">Imágenes:</span>{" "}
                    {Array.isArray(product.images) ? product.images.length : 0}
                  </span>
                </div>
                {readiness.ready ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Listo para {product.supplier}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-600">
                      Preparación {product.supplier}:
                    </span>{" "}
                    {readiness.missing.join(" · ")}
                  </p>
                )}
              </div>
              <form action={toggleProductActive} className="flex items-center gap-2">
                <input type="hidden" name="id" value={product.id} />
                <input
                  type="hidden"
                  name="active"
                  value={product.active ? "false" : "true"}
                />
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-emerald-400"
                >
                  Editar
                </Link>
                <button
                  type="submit"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    product.active
                      ? "border border-zinc-300 text-zinc-600 hover:border-red-300 hover:text-red-600"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {product.active ? "Ocultar" : "Publicar"}
                </button>
              </form>
            </div>

            <div className="mt-4 border-t border-zinc-100 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Variantes
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.length === 0 && (
                  <p className="text-sm text-zinc-400">
                    Sin variantes. El producto no se puede comprar.
                  </p>
                )}
                {product.variants.map((variant) => (
                  <form
                    key={variant.id}
                    action={toggleVariantStock}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                      variant.stockStatus === "disponible"
                        ? "border-zinc-200 bg-zinc-50"
                        : "border-zinc-200 bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    <input type="hidden" name="id" value={variant.id} />
                    <span className="font-medium">
                      {variant.name}
                      {variant.priceOverride !== null && (
                        <span className="ml-1 text-zinc-400">
                          ({formatCOP(variant.priceOverride)})
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {variant.sku} · Stock: {variant.stock}
                    </span>
                    <input
                      type="hidden"
                      name="stockStatus"
                      value={
                        variant.stockStatus === "disponible"
                          ? "agotado"
                          : "disponible"
                      }
                    />
                    <button
                      type="submit"
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold transition ${
                        variant.stockStatus === "disponible"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {variant.stockStatus === "disponible"
                        ? "Marcar agotado"
                        : "Reactivar"}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}