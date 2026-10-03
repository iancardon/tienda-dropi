"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { variantPrice, getVariantStockStatus } from "@/lib/products";
import { IconCash, IconCart, IconCheck, IconShield } from "@/components/icons";

type Variant = {
  id: string;
  name: string;
  stock: number;
  stockStatus: string;
  priceOverride: number | null;
};

export function BuyBox({
  basePrice,
  variants,
}: {
  basePrice: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const available = variants.filter((v) => getVariantStockStatus(v) !== "agotado");
  const [selectedId, setSelectedId] = useState<string | null>(
    available[0]?.id ?? null
  );
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const selectedStockStatus = selected ? getVariantStockStatus(selected) : "agotado";
  const canBuy = Boolean(selected) && selectedStockStatus !== "agotado";

  const handleBuy = () => {
    if (!selected) return;
    router.push(`/checkout?variant=${selected.id}&qty=1` as Route);
  };

  const handleAddToCart = async () => {
    if (!selected) return;

    setAdding(true);
    try {
      await addItem(selected.id, 1);
      // Confirmación visible: al añadir desde el móvil la tarjeta queda fuera
      // de pantalla y no hay a dónde mirar para saber si funcionó.
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      {selected ? (
        <>
          <p className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            {formatCOP(variantPrice({ basePrice }, selected))}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <IconCash className="h-3.5 w-3.5 text-emerald-600" />
            Precio total, sin recargos. Pagas contra entrega.
          </p>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-zinc-400">Agotado</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Este producto no tiene unidades disponibles por ahora.
          </p>
        </>
      )}

      {variants.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium text-zinc-700">
            Variante
            {variants.length === 1 && (
              <span className="ml-1 text-xs font-normal text-zinc-400">
                (una sola opción)
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const stockStatus = getVariantStockStatus(v);
              const isAvailable = stockStatus !== "agotado";
              const isSelected = selected?.id === v.id;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(v.id)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700"
                      : isAvailable
                        ? "border-zinc-300 text-zinc-800 hover:border-emerald-400"
                        : "cursor-not-allowed border-zinc-200 text-zinc-400 line-through"
                  }`}
                >
                  {v.name}
                  {stockStatus === "bajo_stock" && (
                    <span className="ml-1 text-xs font-normal text-amber-600">
                      (pocas)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selected && selectedStockStatus === "bajo_stock" && (
            <p className="mt-2 text-xs font-medium text-amber-600">
              Quedan pocas unidades de esta variante.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canBuy || adding || added}
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-4 py-3.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
        >
          {added ? (
            <>
              <IconCheck className="h-4 w-4" />
              Agregado
            </>
          ) : (
            <>
              <IconCart className="h-4 w-4" />
              {adding ? "Agregando…" : "Agregar al carrito"}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuy}
          disabled={!canBuy}
          className="rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          Comprar ahora
        </button>
      </div>

      {/* Confirmación con enlace al carrito: permite seguir comprando o pasar
          directo a pagar sin tener que volver arriba a buscar el icono. */}
      {added && (
        <div className="animate-fade-rise mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm">
          <span className="font-medium text-emerald-800">
            Añadido al carrito
          </span>
          <button
            type="button"
            onClick={() => router.push("/carrito" as Route)}
            className="shrink-0 font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
          >
            Ver carrito
          </button>
        </div>
      )}

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
        <IconShield className="h-3.5 w-3.5 text-zinc-400" />
        Sin pago online. Pagas contra entrega al recibir.
      </p>
    </div>
  );
}