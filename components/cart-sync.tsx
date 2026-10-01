"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";

export function CartSync() {
  const { refreshCart } = useCart();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    refreshCart();
  }, [refreshCart]);

  return null;
}
