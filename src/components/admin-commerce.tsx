'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, ImagePlus, Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getClientDb, getClientStorage } from '@/lib/firebase-client';
import { formatPrice, productTotalStock } from '@/lib/constants';
import {
  DEFAULT_CATEGORIES, DEFAULT_HOMEPAGE, DEFAULT_SHIPPING,
  slugifyCommerce, type CommerceCategory, type CommerceCollection, type HomepageConfig, type ShippingConfig,
} from '@/lib/commerce-defaults';
import { useCommerceCatalog, useHomepageConfig, useShippingConfig } from '@/hooks/use-commerce-content';
import type { Order, Product } from '@/types/store';

export type CommerceTab = 'overview' | 'categories' | 'collections' | 'homepage' | 'shipping' | 'customers' | 'analytics';
type CustomerRecord = { id: string; displayName?: string; email?: string; phone?: string; city?: string; createdAt?: { seconds?: number }; notes?: string };

type Props = { tab: CommerceTab; products: Product[]; orders: Order[]; onError: (message: string) => void };
const field = 'field-input';
const card = 'border border-[#e4ded5] bg-white p-5 sm:p-7';
const emptyCategory: CommerceCategory = { id: '', name: '', description: '', image: '', active: true, sortOrder: 10 };
const emptyCollection: CommerceCollection = { id: '', name: '', subtitle: '', image: '', productIds: [], published: false, sortOrder: 10 };
const moneyInput = (cents: number) => (cents / 100).toFixed(2);
const centsInput = (value: string) => Math.round(Number(value.replace(',', '.')) * 100);
const validCents = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 10000000;

export function AdminCommerce({ tab, products, orders, onError }: Props) {
  const db = getClientDb();
  const { categories, collections, savedCategories, savedCollections } = useCommerceCatalog();
  const { home } = useHomepageConfig();
  const { shipping } = useShippingConfig();
  const [catEdit, setCatEdit] = useState<CommerceCategory | null>(null);
  const [collEdit, setCollEdit] = useState<CommerceCollection | null>(null);
  const [homeEdit, setHomeEdit] = useState<HomepageConfig>(DEFAULT_HOMEPAGE);
  const [shippingEdit, setShippingEdit] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerEditId, setCustomerEditId] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { setHomeEdit(home); }, [home]);
  useEffect(() => { setShippingEdit(shipping); }, [shipping]);
  useEffect(() => {
    if (!db || (tab !== 'customers' && tab !== 'overview')) return;
    return onSnapshot(collection(db, 'customers'),
      (snapshot) => setCustomers(snapshot.docs.map((record) => ({ ...record.data(), id: record.id } as CustomerRecord))),
      () => onError('Няма достъп до клиентите. Публикувайте актуалните Firestore правила.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function safeSave(run: () => Promise<unknown>, message: string) {
    if (saving) return;
    setSaving(true); setSuccess('');
    try { await run(); setSuccess(message); }
    catch { onError('Записът не успя. Проверете интернет връзката и Firestore правилата.'); }
    finally { setSaving(false); }
  }

  async function uploadEditorial(file: File | undefined, target: 'category' | 'collection' | 'hero' | 'story') {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) return onError('Изберете снимка до 8 MB.');
    const storage = getClientStorage();
    if (!storage) return onError('Firebase Storage не е конфигуриран.');
    setSaving(true);
    try {
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, '_');
      const fileRef = ref(storage, `editorial/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);
      if (target === 'hero') setHomeEdit((p) => ({ ...p, heroImage: url }));
      else if (target === 'story') setHomeEdit((p) => ({ ...p, storyImage: url }));
      else if (target === 'collection') setCollEdit((p) => p ? { ...p, image: url } : null);
      else setCatEdit((p) => p ? { ...p, image: url } : null);
      setSuccess('Снимката е качена. Запазете формуляра, за да публикувате промяната.');
    } catch { onError('Качването на снимката е отказано. Проверете Storage правилата за editorial/.'); }
    finally { setSaving(false); }
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    if (!db || !catEdit) return;
    const id = catEdit.id || slugifyCommerce(catEdit.name);
    if (!/^[a-z0-9-]{2,60}$/.test(id) || !catEdit.name.trim()) return onError('Въведете име и валиден slug на категорията (латиница).');
    if (!catEdit.id && categories.some((x) => x.id === id)) return onError('Тази категория вече съществува.');
    await safeSave(() => setDoc(doc(db, 'categories', id), { ...catEdit, id, name: catEdit.name.trim(), sortOrder: Number(catEdit.sortOrder) || 0, updatedAt: serverTimestamp() }), 'Категорията е запазена.');
    setCatEdit(null);
  }

  async function removeCategory(item: CommerceCategory) {
    if (!db || products.some((p) => p.category === item.id)) return onError('Първо преместете продуктите от тази категория.');
    if (!window.confirm(`Да скрием категория „${item.name}“?`)) return;
    // Hide rather than delete: default categories are built in and would otherwise reappear.
    await safeSave(() => setDoc(doc(db, 'categories', item.id), { ...item, active: false, updatedAt: serverTimestamp() }), 'Категорията е скрита.');
  }

  async function saveCollection(event: FormEvent) {
    event.preventDefault();
    if (!db || !collEdit) return;
    const id = collEdit.id || slugifyCommerce(collEdit.name);
    if (!/^[a-z0-9-]{2,60}$/.test(id) || !collEdit.name.trim()) return onError('Въведете име и валиден slug на колекцията.');
    if (!collEdit.id && collections.some((x) => x.id === id)) return onError('Тази колекция вече съществува.');
    await safeSave(() => setDoc(doc(db, 'collections', id), { ...collEdit, id, name: collEdit.name.trim(), productIds: collEdit.productIds, sortOrder: Number(collEdit.sortOrder) || 0, updatedAt: serverTimestamp() }), 'Колекцията е запазена.');
    setCollEdit(null);
  }

  async function removeCollection(item: CommerceCollection) {
    if (!db || !window.confirm(`Да скрием колекция „${item.name}“?`)) return;
    await safeSave(() => setDoc(doc(db, 'collections', item.id), { ...item, published: false, updatedAt: serverTimestamp() }), 'Колекцията е скрита.');
  }

  async function saveHome(event: FormEvent) {
    event.preventDefault();
    if (!db) return;
    if (!homeEdit.heroTitle.trim() || !homeEdit.heroDescription.trim()) return onError('Заглавието и описанието са задължителни.');
    if (!homeEdit.heroLink.startsWith('/') || homeEdit.heroLink.startsWith('//')) return onError('Линкът на бутона трябва да е вътрешен адрес, например /shop.');
    await safeSave(() => setDoc(doc(db, 'storefront', 'home'), { ...homeEdit, updatedAt: serverTimestamp() }), 'Началната страница е обновена.');
  }

  async function saveShipping(event: FormEvent) {
    event.preventDefault();
    if (!db) return;
    const nums = [shippingEdit.econtCents, shippingEdit.speedyCents, shippingEdit.freeAboveCents];
    if (!nums.every(validCents)) return onError('Въведете валидни неотрицателни цени.');
    await safeSave(() => setDoc(doc(db, 'settings', 'shipping'), { ...shippingEdit, updatedAt: serverTimestamp() }), 'Доставките са запазени.');
  }

  const completedOrders = orders.filter((o) => o.status === 'completed');
  const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.subtotalCents || 0), 0);
  const totalRevenue = orders.filter((o) => !['cancelled'].includes(o.status)).reduce((sum, o) => sum + (o.subtotalCents || 0), 0);
  const lineCount = orders.reduce((sum, o) => sum + (o.lines?.reduce((n, l) => n + l.quantity, 0) || 0), 0);
  const recent = [...orders].sort((a, b) => ((b.createdAt as { seconds?: number } | undefined)?.seconds || 0) - ((a.createdAt as { seconds?: number } | undefined)?.seconds || 0));
  const filteredCustomers = useMemo(() => customers.filter((c) => `${c.email || ''} ${c.displayName || ''} ${c.phone || ''}`.toLocaleLowerCase('bg').includes(customerQuery.toLocaleLowerCase('bg'))), [customers, customerQuery]);
  const isDefaultCat = (id: string) => DEFAULT_CATEGORIES.some((x) => x.id === id);

  return <div className="space-y-7">
    {success && <div role="status" className="flex items-center gap-3 border border-[#c4d3c4] bg-[#eff6ee] px-5 py-3 text-xs text-[#3f6742]"><Check size={17}/>{success}<button className="ml-auto" onClick={() => setSuccess('')}>ЗАТВОРИ</button></div>}

    {tab === 'overview' && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[{ k: 'ОБЩО ПОРЪЧКИ', v: String(orders.length), sub: `${orders.filter((o) => o.status === 'new').length} нови` }, { k: 'ЗАВЪРШЕНИ ПРОДАЖБИ', v: formatPrice(completedRevenue), sub: `${completedOrders.length} приключени поръчки` }, { k: 'КЛИЕНТИ С ПРОФИЛ', v: String(customers.length), sub: 'Регистрирани в магазина' }, { k: 'НАЛИЧНОСТИ', v: String(products.reduce((a, p) => a + productTotalStock(p.variants || []), 0)), sub: `${products.length} продукта` }].map((m) => <div key={m.k} className="border border-[#e8e2da] bg-white p-5"><p className="text-[10px] font-medium tracking-[.13em] text-[#817970]">{m.k}</p><p className="mt-4 text-2xl font-light tracking-[-.03em]">{m.v}</p><p className="mt-2 text-xs text-neutral-500">{m.sub}</p></div>)}
      </div>
      <div className={card}><h2 className="mb-5 text-lg font-medium">Последни поръчки</h2>{recent.length ? <div className="divide-y divide-neutral-100">{recent.slice(0, 8).map((o) => <div key={o.id} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><span>{o.customer?.firstName} {o.customer?.lastName} <small className="ml-2 text-neutral-400">{o.id?.slice(0, 8)}</small></span><span>{formatPrice(o.subtotalCents || 0)} · {o.status}</span></div>)}</div> : <p className="py-8 text-sm text-neutral-500">Все още няма постъпили поръчки.</p>}</div>
      <p className="text-xs text-neutral-500">Статистиките използват реалните документи във Firestore. Приходите са ориентировъчни и не потвърждават получено плащане.</p>
    </>}

    {tab === 'categories' && <>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl">Категории</h2><p className="mt-1 text-xs text-neutral-500">Промените се показват в менюто и каталога.</p></div><button onClick={() => setCatEdit({ ...emptyCategory })} className="btn-dark"><Plus size={16}/> ДОБАВИ КАТЕГОРИЯ</button></div>
      {catEdit && <form className={`${card} grid gap-4 sm:grid-cols-2`} onSubmit={saveCategory}><h3 className="sm:col-span-2 text-lg">{catEdit.id ? 'Редакция на категория' : 'Нова категория'}</h3><label className="field-label">Име<input required className={field} value={catEdit.name} onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value, id: catEdit.id || slugifyCommerce(e.target.value) })}/></label><label className="field-label">Slug (латиница)<input className={field} placeholder="auto from name" disabled={categories.some((item) => item.id === catEdit.id)} value={catEdit.id} onChange={(e) => setCatEdit({ ...catEdit, id: slugifyCommerce(e.target.value) })}/></label><label className="field-label">Позиция<input className={field} type="number" value={catEdit.sortOrder} onChange={(e) => setCatEdit({ ...catEdit, sortOrder: Number(e.target.value) })}/></label><label className="field-label">Снимка (URL)<input className={field} value={catEdit.image} onChange={(e) => setCatEdit({ ...catEdit, image: e.target.value })}/></label><label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-black/20 px-4 py-3 text-xs"><UploadCloud size={16}/> КАЧИ СНИМКА<input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadEditorial(e.target.files?.[0], 'category')}/></label><label className="field-label sm:col-span-2">Описание<textarea className={field} rows={2} value={catEdit.description} onChange={(e) => setCatEdit({ ...catEdit, description: e.target.value })}/></label><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={catEdit.active} onChange={(e) => setCatEdit({ ...catEdit, active: e.target.checked })}/> Показвай категорията</label><div className="sm:col-span-2 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="btn-dark">ЗАПАЗИ</button><button type="button" onClick={() => setCatEdit(null)} className="btn-outline">ОТКАЗ</button></div></form>}
      <div className="grid gap-3 md:grid-cols-2">{categories.map((cat) => <div className={card} key={cat.id}><div className="flex justify-between gap-3"><div><p className="text-base font-medium">{cat.name}</p><p className="mt-1 text-xs text-neutral-500">/{cat.id} · {products.filter((p) => p.category === cat.id).length} продукта</p></div><span className="text-xs text-neutral-500">{cat.active ? 'Активна' : 'Скрита'} · #{cat.sortOrder}</span></div><div className="mt-5 flex gap-3"><button className="btn-outline min-h-0 px-4 py-2" onClick={() => setCatEdit({ ...cat })}><Pencil size={14}/> РЕДАКЦИЯ</button><button className="border border-black/10 px-4 py-2 text-xs" onClick={() => void removeCategory(cat)}><Trash2 size={14} className="inline"/> СКРИЙ</button></div>{isDefaultCat(cat.id) && !savedCategories.some((c) => c.id === cat.id) && <p className="mt-3 text-[11px] text-neutral-500">Стандартна категория — настройките ще се запишат при първата промяна.</p>}</div>)}</div>
    </>}

    {tab === 'collections' && <>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl">Колекции</h2><p className="mt-1 text-xs text-neutral-500">Подбирай продукти и избирай кои колекции да показваш.</p></div><button onClick={() => setCollEdit({ ...emptyCollection })} className="btn-dark"><Plus size={16}/> НОВА КОЛЕКЦИЯ</button></div>
      {collEdit && <form onSubmit={saveCollection} className={`${card} grid gap-4 sm:grid-cols-2`}><h3 className="sm:col-span-2 text-lg">{collEdit.id ? 'Редакция на колекция' : 'Нова колекция'}</h3><label className="field-label">Заглавие<input required className={field} value={collEdit.name} onChange={(e) => setCollEdit({ ...collEdit, name: e.target.value })}/></label><label className="field-label">Етикет / подзаглавие<input className={field} value={collEdit.subtitle} onChange={(e) => setCollEdit({ ...collEdit, subtitle: e.target.value })}/></label><label className="field-label sm:col-span-2">Снимка на колекцията (HTTPS URL)<input className={field} value={collEdit.image} onChange={(e) => setCollEdit({ ...collEdit, image: e.target.value })}/></label><label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-black/20 px-4 py-3 text-xs"><UploadCloud size={16}/> КАЧИ СНИМКА<input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadEditorial(e.target.files?.[0], 'collection')}/></label><label className="field-label">Позиция<input className={field} type="number" value={collEdit.sortOrder} onChange={(e) => setCollEdit({ ...collEdit, sortOrder: Number(e.target.value) })}/></label><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={collEdit.published} onChange={(e) => setCollEdit({ ...collEdit, published: e.target.checked })}/> Публикувана</label><div className="sm:col-span-2"><p className="mb-3 text-sm font-medium">Продукти в колекцията</p><div className="grid max-h-60 gap-2 overflow-y-auto rounded-sm border border-neutral-200 p-3 sm:grid-cols-2">{products.map((p) => <label key={p.id} className="flex items-center gap-3 p-2 text-xs"><input type="checkbox" checked={collEdit.productIds.includes(p.id)} onChange={(e) => setCollEdit({ ...collEdit, productIds: e.target.checked ? [...collEdit.productIds, p.id] : collEdit.productIds.filter((id) => id !== p.id) })}/>{p.name}</label>)}{!products.length && <p className="py-4 text-xs text-neutral-500">Добави продуктите, преди да ги включиш в колекция.</p>}</div></div><div className="sm:col-span-2 flex gap-3"><button disabled={saving} className="btn-dark">ЗАПАЗИ КОЛЕКЦИЯТА</button><button type="button" onClick={() => setCollEdit(null)} className="btn-outline">ОТКАЗ</button></div></form>}
      <div className="grid gap-3 md:grid-cols-2">{collections.map((item) => <div className={card} key={item.id}><div className="flex gap-4">{item.image ? <div className="h-24 w-20 shrink-0 bg-[#f1ece7] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }}/> : <span className="grid h-24 w-20 shrink-0 place-items-center bg-[#f1ece7]"><ImagePlus/></span>}<div><p className="font-medium">{item.name}</p><p className="mt-2 text-xs text-neutral-500">{item.productIds.length} избрани продукта · {item.published ? 'Публикувана' : 'Скрита'}</p><p className="mt-2 text-xs text-neutral-400">/shop?collection={item.id}</p></div></div><div className="mt-5 flex gap-3"><button className="btn-outline min-h-0 px-4 py-2" onClick={() => setCollEdit({ ...item })}><Pencil size={14}/> РЕДАКЦИЯ</button><button className="border border-black/10 px-4 py-2 text-xs" onClick={() => void removeCollection(item)}>СКРИЙ</button></div></div>)}</div>
    </>}

    {tab === 'homepage' && <form onSubmit={saveHome} className="space-y-6"><div><h2 className="text-xl">Редактор на началната страница</h2><p className="mt-2 text-xs text-neutral-500">Промените ще се виждат веднага на главната страница на магазина.</p></div><section className={`${card} grid gap-4 sm:grid-cols-2`}><h3 className="sm:col-span-2 text-lg">Първи банер (Hero)</h3>{([{ k: 'heroEyebrow', l: 'Малък надпис' }, { k: 'heroTitle', l: 'Голямо заглавие (нов ред с Enter)' }, { k: 'heroDescription', l: 'Описание' }, { k: 'heroImage', l: 'Адрес на снимката' }, { k: 'heroButton', l: 'Текст на бутона' }, { k: 'heroLink', l: 'Линк на бутона' }] as { k: keyof HomepageConfig; l: string }[]).map(({ k, l }) => <label className="field-label" key={k}>{l}<textarea rows={k === 'heroTitle' || k === 'heroDescription' ? 2 : 1} className={field} value={String(homeEdit[k])} onChange={(e) => setHomeEdit({ ...homeEdit, [k]: e.target.value })}/></label>)}<label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-black/20 px-4 py-3 text-xs sm:col-span-2"><UploadCloud size={16}/> КАЧИ HERO СНИМКА<input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadEditorial(e.target.files?.[0], 'hero')}/></label></section><section className={card}><h3 className="text-lg">Колекции на началната страница</h3><label className="field-label mt-4">Заглавие<input className={field} value={homeEdit.collectionHeading} onChange={(e) => setHomeEdit({ ...homeEdit, collectionHeading: e.target.value })}/></label><div className="mt-5 grid gap-3 sm:grid-cols-2">{collections.map((item) => <label key={item.id} className="flex items-center gap-3 border border-[#e7e2db] p-4 text-sm"><input type="checkbox" checked={homeEdit.featuredCollectionIds.includes(item.id)} onChange={(e) => setHomeEdit({ ...homeEdit, featuredCollectionIds: e.target.checked ? [...homeEdit.featuredCollectionIds, item.id] : homeEdit.featuredCollectionIds.filter((id) => id !== item.id) })}/>{item.name}</label>)}</div></section><section className={card}><h3 className="text-lg">Продукти на началната страница</h3><p className="mt-2 text-xs text-neutral-500">Изберете артикули, които да се показват в „The curated edit“. Ако не изберете нищо, се показват първите четири публикувани продукта.</p><div className="mt-5 grid max-h-60 gap-3 overflow-y-auto sm:grid-cols-2">{products.filter((p) => p.status === 'published').map((p) => <label key={p.id} className="flex items-center gap-3 border border-neutral-200 p-3 text-xs"><input type="checkbox" checked={(homeEdit.featuredProductIds || []).includes(p.id)} onChange={(e) => setHomeEdit({ ...homeEdit, featuredProductIds: e.target.checked ? [...(homeEdit.featuredProductIds || []), p.id] : (homeEdit.featuredProductIds || []).filter((id) => id !== p.id) })}/>{p.name}</label>)}</div></section><section className={`${card} grid gap-4 sm:grid-cols-2`}><h3 className="sm:col-span-2 text-lg">Секция за марката</h3>{([{ k: 'storyEyebrow', l: 'Малък надпис' }, { k: 'storyTitle', l: 'Заглавие' }, { k: 'storyDescription', l: 'Описание' }, { k: 'storyImage', l: 'Снимка (URL)' }] as { k: keyof HomepageConfig; l: string }[]).map(({ k, l }) => <label className="field-label" key={k}>{l}<textarea className={field} rows={2} value={String(homeEdit[k])} onChange={(e) => setHomeEdit({ ...homeEdit, [k]: e.target.value })}/></label>)}<label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-black/20 px-4 py-3 text-xs sm:col-span-2"><UploadCloud size={16}/> КАЧИ СНИМКА ЗА МАРКАТА<input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadEditorial(e.target.files?.[0], 'story')}/></label></section><button type="submit" disabled={saving} className="btn-dark">{saving ? 'ЗАПАЗВАНЕ...' : 'ПУБЛИКУВАЙ ПРОМЕНИТЕ'} <Check size={16}/></button></form>}

    {tab === 'shipping' && <form onSubmit={saveShipping} className="space-y-6"><div><h2 className="text-xl">Доставка и цени</h2><p className="mt-2 text-xs leading-6 text-neutral-500">Тук задаваш ръчни тарифи. Няма автоматична връзка с Еконт или Спиди. Реалните поръчки остават изключени.</p></div><div className={`${card} grid gap-5 sm:grid-cols-2`}><label className="field-label">Цена Еконт (€)<input className={field} type="number" min="0" max="100000" step="0.01" value={moneyInput(shippingEdit.econtCents)} onChange={(e) => setShippingEdit({ ...shippingEdit, econtCents: centsInput(e.target.value) })}/></label><label className="field-label">Цена Спиди (€)<input className={field} type="number" min="0" max="100000" step="0.01" value={moneyInput(shippingEdit.speedyCents)} onChange={(e) => setShippingEdit({ ...shippingEdit, speedyCents: centsInput(e.target.value) })}/></label><label className="field-label">Безплатна доставка над (€) — 0 означава изключена<input className={field} type="number" min="0" max="100000" step="0.01" value={moneyInput(shippingEdit.freeAboveCents)} onChange={(e) => setShippingEdit({ ...shippingEdit, freeAboveCents: centsInput(e.target.value) })}/></label><label className="inline-flex items-center gap-3 text-sm"><input type="checkbox" checked={shippingEdit.enabled} onChange={(e) => setShippingEdit({ ...shippingEdit, enabled: e.target.checked })}/> Показвай ориентировъчните тарифи на клиентите</label><label className="field-label sm:col-span-2">Съобщение за доставка<textarea className={field} rows={3} value={shippingEdit.notice} onChange={(e) => setShippingEdit({ ...shippingEdit, notice: e.target.value })}/></label></div><button disabled={saving} className="btn-dark">ЗАПАЗИ ДОСТАВКИТЕ <Check size={16}/></button></form>}

    {tab === 'customers' && <div className="space-y-6"><div><h2 className="text-xl">Клиенти</h2><p className="mt-2 text-xs text-neutral-500">Профили, създадени от клиенти на VALÉRE. Паролите никога не са достъпни за администрацията.</p></div><div className="relative"><Search size={17} className="absolute left-4 top-3.5 text-neutral-500"/><input className={`${field} pl-11`} value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Търси клиент по име, имейл или телефон"/></div><div className="space-y-3">{filteredCustomers.map((c) => <div key={c.id} className={card}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium">{c.displayName || 'Клиент'} <span className="text-neutral-400">· {c.email}</span></p><p className="mt-2 text-xs text-neutral-500">{c.phone || 'Няма телефон'} · {orders.filter((o) => o.customerUid === c.id).length} поръчки · {formatPrice(orders.filter((o) => o.customerUid === c.id && o.status === 'completed').reduce((sum, o) => sum + o.subtotalCents, 0))}</p></div><button className="btn-outline min-h-0 px-4 py-2" onClick={() => { setCustomerEditId(c.id); setCustomerNotes(''); if (db) void getDoc(doc(db, 'customerPrivate', c.id)).then((snap) => setCustomerNotes(String(snap.data()?.notes || ''))).catch(() => onError('Неуспешно зареждане на бележките.')); }}>БЕЛЕЖКИ</button></div>{customerEditId === c.id && <div className="mt-4"><textarea rows={3} className={field} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Вътрешна бележка — само за администратори"/><div className="mt-3 flex gap-2"><button disabled={saving} className="btn-dark" onClick={() => void safeSave(() => setDoc(doc(db!, 'customerPrivate', c.id), { notes: customerNotes.slice(0, 3000), updatedAt: serverTimestamp() }, { merge: true }), 'Бележката е запазена.')}>ЗАПАЗИ</button><button onClick={() => setCustomerEditId(null)} className="btn-outline">ЗАТВОРИ</button></div></div>}</div>)}{filteredCustomers.length === 0 && <div className={`${card} py-16 text-center text-sm text-neutral-500`}>Няма регистрирани клиенти или резултати от търсенето.</div>}</div></div>}

    {tab === 'analytics' && <div className="space-y-6"><h2 className="text-xl">Отчети и анализи</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[{ title: 'Общ оборот по поръчки (без отказани)', value: formatPrice(totalRevenue) }, { title: 'Приключени поръчки', value: String(completedOrders.length) }, { title: 'Продадени бройки по всички поръчки', value: String(lineCount) }, { title: 'Средна стойност на поръчка', value: formatPrice(orders.length ? Math.round(totalRevenue / orders.length) : 0) }, { title: 'Чернови', value: String(products.filter((p) => p.status === 'draft').length) }, { title: 'Продукти с нулева наличност', value: String(products.filter((p) => productTotalStock(p.variants || []) === 0).length) }].map((stat) => <div className={card} key={stat.title}><p className="text-xs text-neutral-500">{stat.title}</p><p className="mt-4 text-2xl">{stat.value}</p></div>)}</div><div className={card}><h3 className="mb-4 font-medium">Поръчки по статус</h3><div className="space-y-4">{(['new','confirmed','shipped','completed','cancelled'] as const).map((status) => <div key={status} className="flex items-center justify-between border-b border-neutral-100 pb-3 text-sm"><span>{status}</span><strong>{orders.filter((o) => o.status === status).length}</strong></div>)}</div></div><p className="text-xs leading-6 text-neutral-500">Сумите са отчетени от данните за поръчки, не от банкови транзакции. Плащанията и доставките все още не са автоматизирани.</p></div>}
  </div>;
}
