"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { demoProducts } from "@/lib/demo-products";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase-client";
import type { Product } from "@/types/store";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(isFirebaseConfigured ? [] : demoProducts);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getClientDb();
    if (!db) return;
    const q = query(collection(db, "products"), where("status", "==", "published"));
    return onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Product)));
      setLoading(false);
      setError(null);
    }, () => {
      setError("Не успяхме да заредим продуктите. Проверете Firebase настройките.");
      setLoading(false);
    });
  }, []);

  return { products, loading, error, demo: !isFirebaseConfigured };
}
