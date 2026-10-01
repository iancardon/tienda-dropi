"use client";

import Link from "next/link";
import { SmartImage } from "@/components/smart-image";
import type { Route } from "next";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { getVariantStockStatus } from "@/lib/products";
import { STORE_CONFIG } from "@/lib/store";

export default function CarritoPage() {
  const { items, isLoading, removeItem, updateQuantity, getSubtotal, sessionId } = useCart();
  const subtotal = getSubtotal();
  const shipping = STORE_CONFIG.shippingCost;
  const total = subtotal + (items.length > 0 ? shipping : 0);
  const isEmpty = items.length === 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
        <p className="mt-4 text-zinc-500">Cargando carrito...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Carrito de compras</h1>
      <p className="mt-1 text-zinc-500">
        Revisa tu pedido antes de continuar.
      </p>

      {isEmpty ? (
        <div className="mt-16 text-center">
          <svg
            className="mx-auto h-16 w-16 text-zinc-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold">Tu carrito está vacío</h2>
          <p className="mt-2 text-zinc-500">
            Agrega productos para comenzar tu pedido.
          </p>
          <Link
            href="/productos"
            className="mt-6 inline-block rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Ir a productos
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <ul className="divide-y divide-zinc-200">
              {items.map((item) => {
                const variant = item.productVariant;
                const product = variant.product;
                const stockStatus = getVariantStockStatus(variant);
                const price = variant.priceOverride ?? product.basePrice;
                const image = product.images?.[0];

                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 p-4 hover:bg-zinc-50"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                      {image ? (
                        <SmartImage
                          src={image}
                          alt={product.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                          Sin imagen
                        </div>
                      )}
                      {stockStatus === "agotado" && (
                        <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
                          <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/productos/${product.slug}`}
                            className="font-semibold text-zinc-900 hover:text-emerald-600"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-sm text-zinc-500">
                            Variante: {variant.name}
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-500">
                            SKU: {variant.sku}
                          </p>
                        </div>
                        <span className="font-semibold text-zinc-900 whitespace-nowrap">
                          {formatCOP(price)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            stockStatus === "disponible"
                              ? "bg-emerald-100 text-emerald-800"
                              : stockStatus === "bajo_stock"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {stockStatus === "disponible" && "Disponible"}
                          {stockStatus === "bajo_stock" && "Pocas unidades"}
                          {stockStatus === "agotado" && "Agotado"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border border-zinc-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productVariantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-10 w-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productVariantId, item.quantity + 1)}
                          className="h-10 w-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productVariantId)}
                        className="text-zinc-400 hover:text-red-600"
                        aria-label="Eliminar"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-700">Subtotal</span>
              <span className="font-semibold text-zinc-900">{formatCOP(subtotal)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-zinc-600">Envío (Contra entrega)</span>
              <span className="font-medium text-zinc-900">{formatCOP(shipping)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
              <span className="text-lg font-bold text-zinc-700">Total</span>
              <span className="text-xl font-bold text-emerald-600">{formatCOP(total)}</span>
            </div>
            <p className="mt-4 text-xs text-zinc-500 text-center">
              El costo de envío se paga contra entrega junto con el total.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/productos"
                className="flex-1 rounded-xl border border-zinc-300 px-6 py-3 text-center font-semibold text-zinc-700 transition hover:border-emerald-400"
              >
                Seguir comprando
              </Link>
              <Link
                href={`/checkout?session=${sessionId}` as Route}
                className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-emerald-700"
              >
                Continuar con el pedido
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}