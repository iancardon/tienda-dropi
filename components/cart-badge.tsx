"use client";

import Link from "next/link";
import { IconCart } from "@/components/icons";
import { useCart } from "@/lib/cart";

/**
 * Botón de carrito con contador. Vive en la cabecera, así que el texto no cabe
 * en móvil: se muestra solo el icono con una etiqueta accesible y el número de
 * artículos. El contador se lee con `aria-live` para que un lector de pantalla
 * avise cuando se añade algo.
 */
export function CartLink() {
  const { getTotalItems } = useCart();
  const count = getTotalItems();

  return (
    <Link
      href="/carrito"
      className="relative rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-emerald-700"
      aria-label={
        count > 0 ? `Carrito, ${count} ${count === 1 ? "artículo" : "artículos"}` : "Carrito vacío"
      }
    >
      <IconCart />
      {count > 0 && (
        <span
          aria-live="polite"
          className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}