"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const { getTotalItems } = useCart();
  const count = getTotalItems();

  return (
    <Link
      href="/carrito"
      className="relative transition hover:text-emerald-600"
    >
      <span className="flex items-center gap-1 text-sm font-medium">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2M5 9h14l1 12H4L5 9z" />
        </svg>
        Carrito
      </span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 min-w-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center text-xs font-semibold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}