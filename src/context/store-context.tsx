"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine, Product, Variant } from "@/types/store";
import { isDemoProduct } from "@/lib/demo-products";

const STORAGE_CART = "valere-cart-v1";
const STORAGE_FAVORITES = "valere-favorites-v1";

type StoreContextValue = {
  cart: CartLine[];
  count: number;
  subtotalCents: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variant: Variant) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
};
const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem(STORAGE_CART) || "[]");
      const savedFavorites = JSON.parse(localStorage.getItem(STORAGE_FAVORITES) || "[]");
      if (Array.isArray(savedCart)) setCart(savedCart);
      if (Array.isArray(savedFavorites)) setFavoriteIds(savedFavorites);
    } catch { /* Invalid old local data — start fresh */ }
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_CART, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favoriteIds)); }, [favoriteIds, hydrated]);

  const addToCart = useCallback((product: Product, variant: Variant) => {
    const key = `${product.id}::${variant.key}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) return current.map((line) => line.key === key ? { ...line, quantity: Math.min(line.quantity + 1, variant.stock) } : line);
      return [...current, {
        key, productId: product.id, slug: product.slug, name: product.name,
        image: product.images[0] || "", priceCents: product.priceCents,
        color: variant.color, size: variant.size, variantKey: variant.key,
        quantity: 1, isDemo: isDemoProduct(product.id),
      }];
    });
    setCartOpen(true);
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setCart((current) => current.map((line) => line.key === key ? { ...line, quantity: Math.max(1, Math.min(20, quantity)) } : line));
  }, []);
  const removeFromCart = useCallback((key: string) => setCart((current) => current.filter((line) => line.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }, []);
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalCents = cart.reduce((sum, line) => sum + line.quantity * line.priceCents, 0);
  const value = useMemo(() => ({ cart, count, subtotalCents, cartOpen, setCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, favoriteIds, toggleFavorite }), [cart, count, subtotalCents, cartOpen, addToCart, updateQuantity, removeFromCart, clearCart, favoriteIds, toggleFavorite]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore requires StoreProvider");
  return value;
}
