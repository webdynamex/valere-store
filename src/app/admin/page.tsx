"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ArrowLeft, Check, LogOut, Package, Plus, ShoppingBag, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { CATEGORIES, formatPrice, productTotalStock } from "@/lib/constants";
import { getClientAuth, getClientDb, getClientStorage, isFirebaseConfigured } from "@/lib/firebase-client";
import type { Category, Order, OrderStatus, Product, ProductStatus, Variant } from "@/types/store";

type EditorState = {
  id?: string; name: string; slug: string; subtitle: string; description: string;
  category: Category; price: string; compareAt: string; imageUrls: string;
  colors: string; sizes: string; initialStock: string; status: ProductStatus;
};
const blank: EditorState = { name: "", slug: "", subtitle: "", description: "", category: "clothing", price: "", compareAt: "", imageUrls: "", colors: "Black", sizes: "S, M, L", initialStock: "1", status: "draft" };
const orderStatuses: OrderStatus[] = ["new", "confirmed", "shipped", "completed", "cancelled"];
const orderLabels: Record<OrderStatus, string> = { new: "Нова", confirmed: "Потвърдена", shipped: "Изпратена", completed: "Завършена", cancelled: "Отказана" };
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const splitList = (value: string) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [uploading, setUploading] = useState(false);
  const db = getClientDb();
  const auth = getClientAuth();

  useEffect(() => {
    const clientAuth = getClientAuth();
    const clientDb = getClientDb();
    if (!clientAuth || !clientDb) { setAuthReady(true); return; }
    return onAuthStateChanged(clientAuth, async (user) => {
      setAuthReady(false);
      setAuthUser(user);
      if (!user) { setIsAdmin(false); setAuthReady(true); return; }
      try {
        const access = await getDoc(doc(clientDb, "admins", user.uid));
        setIsAdmin(access.exists());
      } catch { setIsAdmin(false); }
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const clientDb = getClientDb();
    if (!clientDb) return;
    const unsubProducts = onSnapshot(collection(clientDb, "products"), (snap) => setProducts(snap.docs.map((item) => ({ ...item.data(), id: item.id } as Product))), () => setError("Неуспешно зареждане на продуктите."));
    const unsubOrders = onSnapshot(collection(clientDb, "orders"), (snap) => setOrders(snap.docs.map((item) => ({ ...item.data(), id: item.id } as Order)).sort((a, b) => ((b.createdAt as { seconds?: number } | undefined)?.seconds || 0) - ((a.createdAt as { seconds?: number } | undefined)?.seconds || 0))), () => setError("Неуспешно зареждане на поръчките."));
    return () => { unsubProducts(); unsubOrders(); };
  }, [isAdmin]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!auth) return;
    setBusy(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Неуспешен вход. Проверете данните и достъпа."); }
    finally { setBusy(false); }
  }

  const editProduct = (product: Product) => {
    setEditor({
      id: product.id, name: product.name, slug: product.slug, subtitle: product.subtitle ?? "", description: product.description,
      category: product.category, price: String(product.priceCents / 100), compareAt: product.compareAtCents ? String(product.compareAtCents / 100) : "",
      imageUrls: product.images.join("\n"), colors: [...new Set(product.variants.map((v) => v.color))].join(", "),
      sizes: [...new Set(product.variants.map((v) => v.size))].join(", "),
      initialStock: "0", status: product.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!db || !editor || busy || uploading) return;
    const slug = slugify(editor.slug);
    const priceCents = Math.round(Number(editor.price) * 100);
    const compareAtCents = editor.compareAt ? Math.round(Number(editor.compareAt) * 100) : undefined;
    const colors = splitList(editor.colors);
    const sizes = splitList(editor.sizes);
    const images = editor.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    const stock = Number(editor.initialStock);
    if (!slug || !Number.isSafeInteger(priceCents) || priceCents <= 0 || !colors.length || !sizes.length || !Number.isSafeInteger(stock) || stock < 0 || stock > 10000 || !images.length) { setError("Попълнете име, валиден slug, цена, снимка, размери, цветове и наличност."); return; }
    if (images.some((url) => !url.startsWith("https://"))) { setError("Снимките трябва да имат HTTPS адреси или да са качени през бутона за снимки."); return; }
    const existing = editor.id ? products.find((item) => item.id === editor.id) : undefined;
    const variants: Variant[] = colors.flatMap((color) => sizes.map((size) => {
      const key = `${color}|${size}`;
      const old = existing?.variants.find((v) => v.key === key);
      return { key, color, size, stock: old ? old.stock : stock, sku: old?.sku || "" };
    }));
    const duplicates = products.some((item) => item.slug === slug && item.id !== editor.id);
    if (duplicates) { setError("Вече има продукт с този slug. Изберете друг."); return; }
    setBusy(true); setError("");
    try {
      const productId = editor.id || doc(collection(db, "products")).id;
      await setDoc(doc(db, "products", productId), {
        name: editor.name.trim(), slug, subtitle: editor.subtitle.trim(), description: editor.description.trim(),
        category: editor.category, priceCents, ...(compareAtCents && compareAtCents > priceCents ? { compareAtCents } : {}),
        images, variants, status: editor.status, featured: true,
        updatedAt: serverTimestamp(), ...(!editor.id ? { createdAt: serverTimestamp() } : {}),
      }, { merge: Boolean(editor.id) });
      setEditor(null);
    } catch { setError("Неуспешно записване. Проверете Firestore rules и администраторския достъп."); }
    finally { setBusy(false); }
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length || !editor) return;
    const storage = getClientStorage();
    if (!storage) { setError("Firebase Storage не е свързан."); return; }
    setUploading(true); setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") || file.size >= 8 * 1024 * 1024) throw new Error("Снимката трябва да бъде изображение под 8 MB.");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `products/${editor.id || "new"}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
        const result = await uploadBytes(ref(storage, path), file, { contentType: file.type });
        urls.push(await getDownloadURL(result.ref));
      }
      setEditor((current) => current ? { ...current, imageUrls: [current.imageUrls, ...urls].filter(Boolean).join("\n") } : current);
    } catch (err) { setError(err instanceof Error ? err.message : "Неуспешно качване на снимките."); }
    finally { setUploading(false); }
  }

  const setStock = useCallback(async (product: Product, key: string, value: number) => {
    const clientDb = getClientDb();
    if (!clientDb) return;
    try { await updateDoc(doc(clientDb, "products", product.id), { variants: product.variants.map((variant) => variant.key === key ? { ...variant, stock: Math.max(0, value) } : variant), updatedAt: serverTimestamp() }); }
    catch { setError("Неуспешно обновяване на наличността."); }
  }, []);

  if (!isFirebaseConfigured) return <div className="section-wrap py-28 text-center"><h1 className="display-serif text-4xl">VALÉRE Admin</h1><p className="mt-6 text-sm text-neutral-600">Добавете Firebase Web конфигурацията в .env.local, за да активирате администрацията.</p></div>;
  if (!authReady) return <div className="section-wrap py-32 text-center text-sm">Проверка на достъпа...</div>;
  if (!authUser) return <section className="section-wrap flex min-h-[65vh] items-center justify-center py-20"><form onSubmit={signIn} className="w-full max-w-[420px] border border-neutral-200 bg-white p-8 sm:p-12"><p className="eyebrow">MANAGEMENT PORTAL</p><h1 className="display-serif mt-3 text-4xl">VALÉRE Admin</h1><div className="mt-10 space-y-5"><label className="field-label">Имейл<input type="email" required className="field-input" value={email} onChange={(e) => setEmail(e.target.value)}/></label><label className="field-label">Парола<input type="password" required className="field-input" value={password} onChange={(e) => setPassword(e.target.value)}/></label></div>{error && <p className="mt-5 text-xs text-red-600">{error}</p>}<button className="btn-dark mt-8 w-full justify-center" disabled={busy}>{busy ? "ВЛИЗАНЕ..." : "ВЛЕЗ В ПАНЕЛА"}</button></form></section>;
  if (!isAdmin) return <section className="section-wrap py-32 text-center"><h1 className="font-serif text-3xl">Нямате администраторски достъп.</h1><p className="mt-5 text-sm text-neutral-500">Добавете документ с UID на този потребител в Firestore → admins, създаден ръчно през Firebase Console.</p><button onClick={() => auth && signOut(auth)} className="btn-outline mt-7">ИЗХОД</button></section>;

  return <div className="section-wrap pb-28 pt-12"><div className="mb-12 flex flex-wrap items-start justify-between gap-5"><div><Link href="/" className="inline-flex items-center gap-2 text-xs text-neutral-500"><ArrowLeft size={14}/> Към магазина</Link><p className="eyebrow mt-8">BACKOFFICE / VALÉRE</p><h1 className="display-serif mt-2 text-[42px] sm:text-[58px]">Dashboard</h1><p className="mt-3 text-xs text-neutral-500">{authUser.email}</p></div><button onClick={() => auth && signOut(auth)} className="btn-outline"><LogOut size={16}/> ИЗХОД</button></div>
    <div className="mb-11 grid gap-4 sm:grid-cols-3"><div className="bg-[#f1ede7] p-7"><Package size={22} strokeWidth={1.2}/><p className="mt-5 text-3xl">{products.length}</p><p className="mt-2 text-xs tracking-wide text-neutral-500">ОБЩО ПРОДУКТИ</p></div><div className="bg-[#f1ede7] p-7"><Check size={22} strokeWidth={1.2}/><p className="mt-5 text-3xl">{products.filter((item) => item.status === "published").length}</p><p className="mt-2 text-xs tracking-wide text-neutral-500">ПУБЛИКУВАНИ</p></div><div className="bg-[#f1ede7] p-7"><ShoppingBag size={22} strokeWidth={1.2}/><p className="mt-5 text-3xl">{orders.filter((order) => order.status === "new").length}</p><p className="mt-2 text-xs tracking-wide text-neutral-500">НОВИ ПОРЪЧКИ</p></div></div>
    {error && <div className="mb-7 flex items-start justify-between gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}<button onClick={() => setError("")}><X size={15}/></button></div>}
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200"><div className="flex gap-8"><button onClick={() => { setTab("products"); setEditor(null); }} className={`pb-5 text-xs tracking-[.1em] ${tab === "products" ? "border-b-2 border-black" : "text-neutral-500"}`}>ПРОДУКТИ</button><button onClick={() => { setTab("orders"); setEditor(null); }} className={`pb-5 text-xs tracking-[.1em] ${tab === "orders" ? "border-b-2 border-black" : "text-neutral-500"}`}>ПОРЪЧКИ</button></div>{tab === "products" && <button onClick={() => setEditor({ ...blank })} className="btn-dark mb-3"><Plus size={15}/> НОВ ПРОДУКТ</button>}</div>
    {editor && tab === "products" && <form onSubmit={saveProduct} className="mb-11 border border-[#dbd4cb] bg-[#f7f4ef] p-6 sm:p-9"><div className="mb-8 flex items-center justify-between"><h2 className="font-serif text-2xl">{editor.id ? "Редакция на продукт" : "Нов продукт"}</h2><button type="button" onClick={() => setEditor(null)} aria-label="Затвори"><X size={19}/></button></div><div className="grid gap-5 sm:grid-cols-2"><label className="field-label">Име *<input required className="field-input" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value, slug: editor.id ? editor.slug : slugify(e.target.value) })}/></label><label className="field-label">Slug (латиница) *<input required className="field-input" value={editor.slug} onChange={(e) => setEditor({ ...editor, slug: e.target.value })}/></label><label className="field-label">Подзаглавие<input className="field-input" value={editor.subtitle} onChange={(e) => setEditor({ ...editor, subtitle: e.target.value })}/></label><label className="field-label">Категория<select className="field-input" value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value as Category })}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="field-label">Цена в евро *<input required min="0.01" step="0.01" type="number" className="field-input" value={editor.price} onChange={(e) => setEditor({ ...editor, price: e.target.value })}/></label><label className="field-label">Стара цена в евро<input min="0.01" step="0.01" type="number" className="field-input" value={editor.compareAt} onChange={(e) => setEditor({ ...editor, compareAt: e.target.value })}/></label><label className="field-label">Цветове, разделени със запетая<input className="field-input" value={editor.colors} onChange={(e) => setEditor({ ...editor, colors: e.target.value })}/></label><label className="field-label">Размери, разделени със запетая<input className="field-input" value={editor.sizes} onChange={(e) => setEditor({ ...editor, sizes: e.target.value })}/></label><label className="field-label">Начална наличност на нов вариант<input type="number" min="0" max="10000" className="field-input" value={editor.initialStock} onChange={(e) => setEditor({ ...editor, initialStock: e.target.value })}/></label><label className="field-label">Статус<select className="field-input" value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value as ProductStatus })}><option value="draft">Чернова</option><option value="published">Публикуван</option></select></label><label className="field-label sm:col-span-2">Описание<textarea rows={4} className="field-input" value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })}/></label><label className="field-label sm:col-span-2">Снимки — HTTPS URL, по един на ред<textarea rows={4} className="field-input" value={editor.imageUrls} onChange={(e) => setEditor({ ...editor, imageUrls: e.target.value })}/></label><label className="inline-flex w-fit cursor-pointer items-center gap-3 border border-black/20 bg-white px-5 py-3 text-xs"><UploadCloud size={19}/>{uploading ? "КАЧВАНЕ..." : "КАЧИ СНИМКИ"}<input type="file" multiple accept="image/*" className="hidden" disabled={uploading} onChange={(e) => void uploadImages(e.target.files)}/></label></div><p className="mt-5 text-xs leading-6 text-neutral-500">При редакция съществуващите наличности на непроменени варианти се запазват. Може да ги промените по-долу от списъка с продукти.</p><button type="submit" disabled={busy || uploading} className="btn-dark mt-8">{busy ? "ЗАПИСВАНЕ..." : "ЗАПАЗИ ПРОДУКТА"} <Check size={16}/></button></form>}
    {tab === "products" && <div className="space-y-4">{products.length === 0 ? <p className="py-16 text-center text-sm text-neutral-500">Все още няма продукти. Добавете първия артикул.</p> : products.map((product) => <div key={product.id} className="border border-neutral-200 p-5"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm font-medium tracking-wide">{product.name}</p><p className="mt-2 text-xs text-neutral-500">{formatPrice(product.priceCents)} · {product.category} · {productTotalStock(product.variants)} бр. налични · {product.status === "published" ? "Публикуван" : "Чернова"}</p></div><div className="flex flex-wrap gap-3"><button onClick={() => editProduct(product)} className="border border-black/15 px-4 py-2 text-xs">РЕДАКЦИЯ</button><button className="border border-black/15 px-4 py-2 text-xs" onClick={() => db && updateDoc(doc(db, "products", product.id), { status: product.status === "published" ? "draft" : "published" }).catch(() => setError("Неуспешна промяна на статуса."))}>{product.status === "published" ? "СКРИЙ" : "ПУБЛИКУВАЙ"}</button><button className="border border-red-200 px-4 py-2 text-xs text-red-600" onClick={() => { if (db && window.confirm(`Да изтрием ли ${product.name}?`)) deleteDoc(doc(db, "products", product.id)).catch(() => setError("Неуспешно изтриване.")); }}>ИЗТРИЙ</button></div></div><div className="mt-5 flex flex-wrap gap-x-6 gap-y-4 border-t border-neutral-100 pt-4">{product.variants.map((variant) => <div className="flex items-center gap-2 text-xs" key={variant.key}><span>{variant.color} / {variant.size}</span><input type="number" aria-label={`Наличност ${variant.key}`} min="0" className="w-16 border border-neutral-200 px-2 py-1" value={variant.stock} onChange={(e) => void setStock(product, variant.key, Number(e.target.value))}/></div>)}</div></div>)}</div>}
    {tab === "orders" && <div className="space-y-4">{orders.length === 0 ? <p className="py-16 text-center text-sm text-neutral-500">Все още няма поръчки.</p> : orders.map((order) => <div key={order.id} className="border border-neutral-200 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[13px] font-medium">{order.customer?.firstName} {order.customer?.lastName} · {order.customer?.phone}</p><p className="mt-2 text-xs text-neutral-500">{order.customer?.email} · {order.customer?.city} · {order.customer?.address}</p><p className="mt-2 text-xs text-neutral-500">Поръчка: {order.id} · {order.delivery === "econt" ? "Еконт" : "Спиди"} · Наложен платеж</p></div><div><p className="mb-2 text-right text-sm font-medium">{formatPrice(order.subtotalCents)}</p><select className="border border-neutral-200 bg-white px-3 py-2 text-xs" value={order.status} onChange={(e) => db && order.id && updateDoc(doc(db, "orders", order.id), { status: e.target.value }).catch(() => setError("Неуспешна промяна на поръчката."))}>{orderStatuses.map((status) => <option key={status} value={status}>{orderLabels[status]}</option>)}</select></div></div><div className="mt-5 border-t border-neutral-100 pt-4 text-xs leading-6 text-neutral-600">{order.lines?.map((line, index) => <p key={`${line.productId}-${index}`}>{line.quantity} × {line.name} ({line.color}, {line.size}) — {formatPrice(line.priceCents * line.quantity)}</p>)}{order.customer?.comment && <p className="mt-3">Коментар: {order.customer.comment}</p>}</div></div>)}</div>}
  </div>;
}
