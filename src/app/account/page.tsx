'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { Check, Heart, LogOut, Package, UserRound } from 'lucide-react';
import { getClientAuth, getClientDb, isFirebaseConfigured } from '@/lib/firebase-client';
import { formatPrice } from '@/lib/constants';
import type { Order } from '@/types/store';

type Customer = { displayName: string; email: string; phone: string; city: string; address: string };
const defaultCustomer = { displayName: '', email: '', phone: '', city: '', address: '' };

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<Customer>(defaultCustomer);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'orders' | 'profile'>('orders');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const db = getClientDb();
  const auth = getClientAuth();

  useEffect(() => {
    const client = getClientAuth();
    if (!client) { setReady(true); return; }
    return onAuthStateChanged(client, (active) => { setUser(active); setReady(true); setError(''); });
  }, []);
  useEffect(() => {
    const client = getClientDb();
    if (!client || !user) { setOrders([]); setProfile(defaultCustomer); return; }
    const stopProfile = onSnapshot(doc(client, 'customers', user.uid), (snapshot) => {
      const data = snapshot.data() || {};
      setProfile({ displayName: String(data.displayName || user.displayName || ''), email: user.email || '', phone: String(data.phone || ''), city: String(data.city || ''), address: String(data.address || '') });
    }, () => setError('Няма достъп до профила. Проверете Firestore правилата.'));
    const stopOrders = onSnapshot(query(collection(client, 'orders'), where('customerUid', '==', user.uid)),
      (snapshot) => setOrders(snapshot.docs.map((record) => ({ ...record.data(), id: record.id } as Order)).sort((a, b) => ((b.createdAt as { seconds?: number } | undefined)?.seconds || 0) - ((a.createdAt as { seconds?: number } | undefined)?.seconds || 0))),
      () => setError('Няма достъп до историята на поръчките. Публикувайте актуалните Firestore правила.'));
    return () => { stopProfile(); stopOrders(); };
  }, [user]);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    if (!auth || !db || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        try {
          await setDoc(doc(db, 'customers', result.user.uid), { displayName: name.trim(), email: result.user.email, phone: '', city: '', address: '', createdAt: serverTimestamp() });
        } catch { setError('Профилът е създаден, но данните не са записани във Firestore. Проверете правилата.'); }
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      setError(code === 'auth/email-already-in-use' ? 'Този имейл вече е регистриран.' : code === 'auth/weak-password' ? 'Паролата трябва да бъде поне 6 символа.' : 'Неуспешен вход/регистрация. Проверете имейла и паролата.');
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!auth || !email.trim()) return setError('Въведете имейла си, за да възстановите паролата.');
    try { await sendPasswordResetEmail(auth, email.trim()); setNotice('Ако имейлът е регистриран, ще получите инструкции за нова парола.'); }
    catch { setError('Неуспешно изпращане. Проверете имейла и настройките на Firebase Authentication.'); }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user || !db || busy) return;
    setBusy(true); setNotice(''); setError('');
    try {
      await updateDoc(doc(db, 'customers', user.uid), { displayName: profile.displayName.slice(0, 100), phone: profile.phone.slice(0, 30), city: profile.city.slice(0, 100), address: profile.address.slice(0, 250), updatedAt: serverTimestamp() });
      await updateProfile(user, { displayName: profile.displayName.slice(0, 100) });
      setNotice('Профилът е запазен.');
    } catch { setError('Промените не са записани. Проверете Firestore правилата.'); }
    finally { setBusy(false); }
  }

  if (!isFirebaseConfigured) return <div className="section-wrap py-24 text-center">Клиентските профили ще бъдат активирани след настройката на Firebase.</div>;
  if (!ready) return <div className="section-wrap py-24 text-center text-sm">Зареждане на профила...</div>;
  if (!user) return <div className="section-wrap py-16 sm:py-24"><div className="mx-auto w-full max-w-[460px] border border-[#e5dfd8] bg-white p-7 sm:p-12"><p className="eyebrow">VALÉRE ACCOUNT</p><h1 className="display-serif mt-3 text-[43px] sm:text-[57px]">{mode === 'login' ? 'Welcome back.' : 'Join VALÉRE.'}</h1><p className="mt-5 text-sm leading-7 text-neutral-500">{mode === 'login' ? 'Влез, за да проследяваш поръчките и да управляваш данните си.' : 'Създай профил, за да имаш история на покупките и по-бързо пазаруване.'}</p><form onSubmit={authenticate} className="mt-9 space-y-5">{mode === 'register' && <label className="field-label">Име<input required minLength={2} maxLength={100} className="field-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"/></label>}<label className="field-label">Имейл<input className="field-input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"/></label><label className="field-label">Парола<input className="field-input" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p role="status" className="text-sm text-[#597252]">{notice}</p>}<button disabled={busy} className="btn-dark w-full justify-center">{busy ? 'ЗАРЕЖДАНЕ...' : mode === 'login' ? 'ВЛЕЗ В ПРОФИЛА' : 'СЪЗДАЙ ПРОФИЛ'}</button></form><div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs"><button className="border-b border-black/60 pb-1" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Нямаш профил? Регистрирай се' : 'Имаш профил? Влез'}</button>{mode === 'login' && <button className="text-neutral-500 underline" onClick={() => void resetPassword()}>Забравена парола?</button>}</div></div></div>;

  return <div className="section-wrap py-14 sm:py-20"><div className="mb-12 flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">VALÉRE ACCOUNT</p><h1 className="display-serif mt-3 text-[44px] sm:text-[70px]">Моят профил.</h1><p className="mt-4 text-sm text-neutral-500">Здравей, {profile.displayName || user.email}</p></div><button className="btn-outline" onClick={() => auth && signOut(auth)}><LogOut size={16}/> ИЗХОД</button></div><div className="grid gap-9 lg:grid-cols-[250px_1fr]"><nav className="flex flex-col gap-3 self-start border border-[#e8e3dc] bg-white p-4"><button className={`flex items-center gap-3 px-4 py-4 text-left text-sm ${tab === 'orders' ? 'bg-[#262522] text-white' : ''}`} onClick={() => setTab('orders')}><Package size={17}/> Моите поръчки</button><button className={`flex items-center gap-3 px-4 py-4 text-left text-sm ${tab === 'profile' ? 'bg-[#262522] text-white' : ''}`} onClick={() => setTab('profile')}><UserRound size={17}/> Лични данни</button><Link className="flex items-center gap-3 px-4 py-4 text-sm" href="/shop?filter=favorites"><Heart size={17}/> Любими продукти</Link></nav><div className="min-w-0">{error && <p role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mb-6 flex items-center gap-2 border border-green-200 bg-green-50 p-4 text-sm text-green-800"><Check size={18}/>{notice}</p>}{tab === 'orders' ? <div><h2 className="mb-6 text-2xl">История на поръчките</h2>{orders.length ? <div className="space-y-4">{orders.map((order) => <div key={order.id} className="border border-[#e8e3dc] bg-white p-6"><div className="mb-5 flex flex-wrap justify-between gap-3 border-b border-neutral-100 pb-4"><div><p className="text-xs text-neutral-500">Поръчка #{order.id?.slice(0, 10)}</p><p className="mt-2 text-sm font-medium">{order.status === 'new' ? 'Нова' : order.status === 'confirmed' ? 'Потвърдена' : order.status === 'shipped' ? 'Изпратена' : order.status === 'completed' ? 'Завършена' : 'Отказана'}</p></div><strong>{formatPrice(order.subtotalCents)}</strong></div>{order.lines.map((line, index) => <p key={`${line.productId}-${index}`} className="mb-3 text-sm">{line.name} · {line.size} / {line.color} · {line.quantity} бр.</p>)}<p className="mt-4 text-xs text-neutral-500">Доставка: {order.delivery === 'econt' ? 'Еконт' : 'Спиди'}. Цена за доставка: {order.shippingCents === null ? 'ще бъде уточнена' : formatPrice(order.shippingCents)}.</p></div>)}</div> : <div className="border border-neutral-200 bg-white px-7 py-16 text-center"><p className="text-sm text-neutral-500">Все още няма поръчки, свързани с този профил.</p><p className="mt-3 text-xs text-neutral-400">Покупките без вход в профил не се добавят автоматично.</p><Link href="/shop" className="btn-dark mt-7">РАЗГЛЕДАЙ КОЛЕКЦИЯТА</Link></div>}</div> : <form className="max-w-[660px] space-y-5 border border-[#e8e3dc] bg-white p-6 sm:p-9" onSubmit={saveProfile}><h2 className="text-2xl">Лични данни</h2><label className="field-label">Име<input className="field-input" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}/></label><label className="field-label">Имейл (не може да се сменя оттук)<input className="field-input" readOnly value={user.email || ''}/></label><label className="field-label">Телефон<input className="field-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}/></label><label className="field-label">Град<input className="field-input" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })}/></label><label className="field-label">Адрес<input className="field-input" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}/></label><button className="btn-dark" disabled={busy}>ЗАПАЗИ ПРОМЕНИТЕ</button></form>}</div></div></div>;
}
