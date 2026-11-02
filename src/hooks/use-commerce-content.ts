'use client';

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase-client';
import {
  DEFAULT_HOMEPAGE, DEFAULT_SHIPPING, mergedCategories, mergedCollections,
  type CommerceCategory, type CommerceCollection, type HomepageConfig, type ShippingConfig,
} from '@/lib/commerce-defaults';

export function useCommerceCatalog() {
  const [savedCategories, setSavedCategories] = useState<CommerceCategory[]>([]);
  const [savedCollections, setSavedCollections] = useState<CommerceCollection[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const db = getClientDb();
    if (!db) return;
    const a = onSnapshot(collection(db, 'categories'),
      (snapshot) => setSavedCategories(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as CommerceCategory))),
      () => setError('Няма достъп до категориите. Публикувайте актуалните Firestore правила.'));
    const b = onSnapshot(collection(db, 'collections'),
      (snapshot) => setSavedCollections(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as CommerceCollection))),
      () => setError('Няма достъп до колекциите. Публикувайте актуалните Firestore правила.'));
    return () => { a(); b(); };
  }, []);
  return { categories: mergedCategories(savedCategories), collections: mergedCollections(savedCollections), savedCategories, savedCollections, error };
}

export function useHomepageConfig() {
  const [home, setHome] = useState<HomepageConfig>(DEFAULT_HOMEPAGE);
  const [error, setError] = useState('');
  useEffect(() => {
    const db = getClientDb();
    if (!db) return;
    return onSnapshot(doc(db, 'storefront', 'home'),
      (snap) => setHome({ ...DEFAULT_HOMEPAGE, ...(snap.exists() ? snap.data() : {}) }),
      () => setError('Неуспешно зареждане на началната страница.'));
  }, []);
  return { home, error };
}

export function useShippingConfig() {
  const [shipping, setShipping] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [error, setError] = useState('');
  useEffect(() => {
    const db = getClientDb();
    if (!db) return;
    return onSnapshot(doc(db, 'settings', 'shipping'),
      (snap) => setShipping({ ...DEFAULT_SHIPPING, ...(snap.exists() ? snap.data() : {}) }),
      () => setError('Няма достъп до тарифите за доставка.'));
  }, []);
  return { shipping, error };
}
