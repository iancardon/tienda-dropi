"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { variantPrice, getVariantStockStatus } from "@/lib/products";

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
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const selectedStockStatus = selected ? getVariantStockStatus(selected) : "agotado";

  const handleBuy = () => {
    if (!selected) return;
    router.push(`/checkout?variant=${selected.id}&qty=1` as Route);
  };

  const handleAddToCart = async () => {
    if (!selected) return;
    await addItem(selected.id, 1);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      {selected ? (
        <>
          <p className="text-2xl font-bold text-zinc-900">
            {formatCOP(variantPrice({ basePrice }, selected))}
          </p>
          <p className="text-xs text-zinc-500">
            Precio total, sin recargos. Pagas contra entrega.
          </p>
        </>
      ) : (
        <p className="text-2xl font-bold text-zinc-400">Agotado</p>
      )}

      {variants.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-700">Variante</p>
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
                    <span className="ml-1 text-xs text-amber-600">(Pocas)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selected || selectedStockStatus === "agotado"}
          className="rounded-xl border border-emerald-600 bg-white text-emerald-600 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
        >
          Agregar al carrito
        </button>
        <button
          type="button"
          onClick={handleBuy}
          disabled={!selected || selectedStockStatus === "agotado"}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          Comprar ahora
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Sin pago online. Pagas contra entrega al recibir.
      </p>
    </div>
  );
}