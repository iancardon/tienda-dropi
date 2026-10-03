"use client";

import Link from "next/link";
import { SmartImage } from "@/components/smart-image";
import type { Route } from "next";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { getVariantStockStatus } from "@/lib/products";
import { STORE_CONFIG } from "@/lib/store";
import { IconCart, IconChat, IconClose, IconShield } from "@/components/icons";

export default function CarritoPage() {
  const { items, isLoading, removeItem, updateQuantity, getSubtotal, sessionId } = useCart();
  const subtotal = getSubtotal();
  const shipping = STORE_CONFIG.shippingCost;
  const total = subtotal + (items.length > 0 ? shipping : 0);
  const isEmpty = items.length === 0;

  // Si una variante se agotó después de añadirla, el carrito no puede seguir
  // como si nada. Se avisa y se ofrece quitar el artículo, pero no se borra
  // solo: la persona puede querer pedir otra cantidad o Cambiar de producto.
  const soldOutItems = items.filter(
    (item) => getVariantStockStatus(item.productVariant) === "agotado"
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="mt-4 text-zinc-500">Cargando carrito…</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
            <IconCart className="h-7 w-7 text-zinc-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-zinc-900">
            Tu carrito está vacío
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
            Todavía no has añadido nada. Explora el catálogo y paga al recibir
            tu pedido.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/productos"
              className="rounded-xl bg-emerald-600 px-8 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              Ver productos
            </Link>
            <Link
              href="/contacto"
              className="rounded-xl border border-zinc-300 px-8 py-3.5 font-semibold text-zinc-700 transition hover:border-emerald-400"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Carrito de compras
        </h1>
        <p className="mt-1.5 text-[15px] text-zinc-600">
          Revisa tu pedido antes de continuar. Pagas en efectivo cuando lo
          recibas.
        </p>
      </header>

      {soldOutItems.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            {soldOutItems.length === 1
              ? "Un producto se agotó"
              : `${soldOutItems.length} productos se agotaron`}
          </p>
          <p className="mt-0.5">
            Quítalos del carrito para poder confirmar el pedido.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onRemove={removeItem}
                onQuantityChange={updateQuantity}
              />
            ))}
          </ul>

          <Link
            href="/productos"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            ← Seguir comprando
          </Link>
        </div>

        {/* El resumen se pega arriba en pantallas grandes para no tener que
            bajar hasta el final después de cambiar cantidades. */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="text-base font-bold text-zinc-900">Resumen</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600">Subtotal</dt>
                <dd className="font-semibold text-zinc-900">
                  {formatCOP(subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600">Envío</dt>
                <dd className="font-semibold text-zinc-900">
                  {formatCOP(shipping)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
                <dt className="text-base font-bold text-zinc-900">Total</dt>
                <dd className="text-xl font-bold text-emerald-700">
                  {formatCOP(total)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-zinc-500">
              <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              El envío se paga contra entrega junto con el total. No pagas nada
              por adelantado.
            </p>

            <Link
              href={`/checkout?session=${sessionId}` as Route}
              className="mt-5 block rounded-xl bg-emerald-600 px-6 py-3.5 text-center font-semibold text-white transition hover:bg-emerald-700"
            >
              Continuar con el pedido
            </Link>

            <Link
              href="/contacto"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:border-emerald-400"
            >
              <IconChat className="h-4 w-4" />
              ¿Dudas? Escríbenos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type CartItem = ReturnType<typeof useCart>["items"][number];

function CartRow({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: (variantId: string) => void;
  onQuantityChange: (variantId: string, quantity: number) => void;
}) {
  const variant = item.productVariant;
  const product = variant.product;
  const stockStatus = getVariantStockStatus(variant);
  const price = variant.priceOverride ?? product.basePrice;
  const soldOut = stockStatus === "agotado";
  const atMaxStock = item.quantity >= variant.stock;
  const image = product.images?.[0];

  const stockLabel = {
    disponible: null,
    bajo_stock: "Pocas unidades",
    agotado: "Agotado",
  }[stockStatus];

  return (
    <li className="p-4">
      <div className="flex gap-3.5 sm:gap-4">
        <Link
          href={`/productos/${product.slug}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-24 sm:w-24"
        >
          {image ? (
            <SmartImage
              src={image}
              alt={product.name}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-zinc-400">
              Sin imagen
            </span>
          )}
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/55">
              <span className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white">
                Agotado
              </span>
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/productos/${product.slug}`}
                className="text-[15px] leading-snug font-semibold text-zinc-900 transition hover:text-emerald-700"
              >
                {product.name}
              </Link>
              <p className="mt-0.5 text-xs text-zinc-500">
                Variante: {variant.name}
              </p>
              <p className="text-xs text-zinc-400">SKU: {variant.sku}</p>
            </div>

            <span className="shrink-0 text-right text-[15px] font-bold text-zinc-900">
              {formatCOP(price * item.quantity)}
            </span>
          </div>

          {stockLabel && (
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                stockStatus === "bajo_stock"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {stockLabel}
            </span>
          )}

          {/* En móvil la cantidad y el precio unitario bajan de línea: en
              360 px no caben en el mismo renglón sin partir el texto. */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-lg border border-zinc-300">
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.productVariantId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label={`Quitar una unidad de ${product.name}`}
                  className="flex h-9 w-9 items-center justify-center text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-9 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.productVariantId, item.quantity + 1)}
                  disabled={atMaxStock || soldOut}
                  aria-label={`Añadir una unidad de ${product.name}`}
                  className="flex h-9 w-9 items-center justify-center text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemove(item.productVariantId)}
                aria-label={`Eliminar ${product.name} del carrito`}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-zinc-500">
              {formatCOP(price)} c/u
            </span>
          </div>

          {atMaxStock && !soldOut && (
            <p className="mt-1.5 text-xs text-amber-600">
              Llegaste al máximo disponible ({variant.stock}).
            </p>
          )}
        </div>
      </div>
    </li>
  );
}