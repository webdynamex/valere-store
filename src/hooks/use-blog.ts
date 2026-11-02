'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getClientDb, isFirebaseConfigured } from '@/lib/firebase-client';
import type { BlogPost } from '@/types/blog';

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState('');
  useEffect(() => {
    const db = getClientDb();
    if (!db) return;
    const q = query(collection(db, 'blogPosts'), where('status', '==', 'published'));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ ...d.data(), id: d.id } as BlogPost)).sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)));
      setLoading(false); setError('');
    }, () => { setLoading(false); setError('Блогът временно не е достъпен. Проверете Firestore правилата.'); });
  }, []);
  return { posts, loading, error };
}
