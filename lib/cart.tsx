"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export interface CartItem {
  id: string;
  productVariantId: string;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    sku: string;
    priceOverride: number | null;
    stock: number;
    stockStatus: string;
    product: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      originalPrice: number | null;
      images: string[];
      category: string;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  sessionId: string;
  addItem: (productVariantId: string, quantity?: number) => Promise<void>;
  removeItem: (productVariantId: string) => Promise<void>;
  updateQuantity: (productVariantId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getSubtotal: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "tiendadropi_cart_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(CART_STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(CART_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

async function fetchCart(sessionId: string) {
  const res = await fetch(`/api/cart?sessionId=${sessionId}`);
  if (!res.ok) return { items: [] };
  return res.json();
}

async function addToCartApi(sessionId: string, productVariantId: string, quantity: number) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, productVariantId, quantity }),
  });
  return res.json();
}

async function updateCartItemApi(sessionId: string, productVariantId: string, quantity: number) {
  const res = await fetch("/api/cart", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, productVariantId, quantity }),
  });
  return res.json();
}

async function removeFromCartApi(sessionId: string, productVariantId: string) {
  const res = await fetch("/api/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, productVariantId }),
  });
  return res.json();
}

async function clearCartApi(sessionId: string) {
  const res = await fetch("/api/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, clear: true }),
  });
  return res.json();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => getSessionId());
  const mountedRef = useRef(false);

  const refreshCart = async () => {
    if (!sessionId) return;
    if (!mountedRef.current) return;
    setIsLoading(true);
    try {
      const data = await fetchCart(sessionId);
      if (mountedRef.current) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      if (!sessionId) return;
      try {
        const data = await fetchCart(sessionId);
        if (!cancelled && mountedRef.current) {
          setItems(data.items || []);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [sessionId]);

  const addItem = async (productVariantId: string, quantity = 1) => {
    if (!sessionId) return;
    try {
      await addToCartApi(sessionId, productVariantId, quantity);
      await refreshCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeItem = async (productVariantId: string) => {
    if (!sessionId) return;
    try {
      await removeFromCartApi(sessionId, productVariantId);
      await refreshCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = async (productVariantId: string, quantity: number) => {
    if (!sessionId) return;
    if (quantity <= 0) {
      await removeItem(productVariantId);
      return;
    }
    try {
      await updateCartItemApi(sessionId, productVariantId, quantity);
      await refreshCart();
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const clearCart = async () => {
    if (!sessionId) return;
    try {
      await clearCartApi(sessionId);
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = item.productVariant.priceOverride ?? item.productVariant.product.basePrice;
      return sum + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        sessionId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getSubtotal,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}