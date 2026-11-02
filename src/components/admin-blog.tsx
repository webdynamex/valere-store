'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Check, Eye, ImagePlus, Pencil, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { getClientDb, getClientStorage } from '@/lib/firebase-client';
import { slugifyCommerce } from '@/lib/commerce-defaults';
import { MarkdownArticle } from '@/components/markdown-article';
import type { BlogPost, BlogStatus } from '@/types/blog';

type EditablePost = Omit<BlogPost, 'createdAt' | 'updatedAt' | 'publishedAt'> & { isNew?: boolean };
const blank: EditablePost = {
  id: '', slug: '', title: '', excerpt: '', body: '', coverImage: '', category: 'Стил', tags: [],
  author: 'VALÉRE', status: 'draft', featured: false, seoTitle: '', seoDescription: '', isNew: true,
};
const dateLabel = (ts?: { seconds?: number }) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString('bg-BG') : '—';

export function AdminBlog({ onError }: { onError: (message: string) => void }) {
  const db = getClientDb();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editor, setEditor] = useState<EditablePost | null>(null);
  const [queryText, setQueryText] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, 'blogPosts'), (snapshot) => {
      setPosts(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as BlogPost)).sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
    }, () => onError('Не мога да заредя статиите. Провери Firestore правилата за blogPosts.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => [...new Set(['Стил', 'Тенденции', 'Съвети', 'Новини', ...posts.map((post) => post.category)])], [posts]);
  const visible = useMemo(() => posts.filter((post) => `${post.title} ${post.category} ${post.slug}`.toLowerCase().includes(queryText.toLowerCase())), [posts, queryText]);
  const change = <K extends keyof EditablePost>(key: K, value: EditablePost[K]) => setEditor((cur) => cur ? { ...cur, [key]: value } : null);
  const edit = (post: BlogPost) => { setEditor({ ...post }); setPreview(false); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const insertText = (start: string, end = '') => {
    const input = bodyRef.current;
    if (!input || !editor) return;
    const a = input.selectionStart, b = input.selectionEnd;
    const selected = editor.body.slice(a, b);
    const body = editor.body.slice(0, a) + start + (selected || 'текст') + end + editor.body.slice(b);
    change('body', body);
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(a + start.length, a + start.length + (selected || 'текст').length); });
  };

  async function upload(file: File | undefined, target: 'cover' | 'inline') {
    if (!file || !editor) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) { onError('Избери снимка до 8 MB.'); return; }
    const storage = getClientStorage();
    if (!storage) return onError('Firebase Storage не е конфигуриран.');
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, '_');
      const fileRef = ref(storage, `editorial/blog/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);
      if (target === 'cover') change('coverImage', url);
      else change('body', editor.body + `\n\n![${file.name.replace(/[\[\]]/g, '')}](${url})\n\n`);
      setSuccess('Снимката е качена. Запази статията, за да публикуваш промяната.');
    } catch { onError('Неуспешно качване. Провери Storage правилата за editorial/.'); }
    finally { setBusy(false); }
  }

  async function save(event?: FormEvent, targetStatus?: BlogStatus) {
    event?.preventDefault();
    if (!db || !editor || busy) return;
    const slug = slugifyCommerce(editor.slug || editor.title);
    const status = targetStatus || editor.status;
    if (!editor.title.trim() || slug.length < 3 || slug.length > 100) return onError('Въведи заглавие и валиден URL идентификатор.');
    if (editor.body.trim().length < 30) return onError('Съдържанието трябва да е поне 30 символа.');
    if (editor.coverImage && !/^https:\/\//.test(editor.coverImage)) return onError('Снимката трябва да има HTTPS адрес.');
    if (posts.some((p) => p.slug === slug && p.id !== editor.id)) return onError('Вече има статия с този URL идентификатор.');
    setBusy(true); setSuccess('');
    try {
      const id = editor.id || doc(collection(db, 'blogPosts')).id;
      const earlier = posts.find((p) => p.id === id);
      const payload = {
        slug, title: editor.title.trim().slice(0, 180), excerpt: editor.excerpt.trim().slice(0, 500),
        body: editor.body.slice(0, 120000), coverImage: editor.coverImage, category: editor.category.trim() || 'Стил',
        tags: editor.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 25), author: editor.author.trim() || 'VALÉRE',
        status, featured: !!editor.featured, seoTitle: editor.seoTitle.trim().slice(0, 180), seoDescription: editor.seoDescription.trim().slice(0, 300),
        updatedAt: serverTimestamp(),
        ...(!earlier ? { createdAt: serverTimestamp() } : {}),
        ...(status === 'published' && !earlier?.publishedAt ? { publishedAt: serverTimestamp() } : {}),
      };
      await setDoc(doc(db, 'blogPosts', id), payload, { merge: !!earlier });
      setEditor(null); setPreview(false); setSuccess(status === 'published' ? 'Статията е публикувана.' : 'Черновата е запазена.');
    } catch { onError('Неуспешен запис на статията. Провери Firestore правилата.'); }
    finally { setBusy(false); }
  }

  async function remove(post: BlogPost) {
    if (!db || !window.confirm(`Да изтрием ли окончателно статията „${post.title}“?`)) return;
    try { await deleteDoc(doc(db, 'blogPosts', post.id)); setSuccess('Статията е изтрита.'); }
    catch { onError('Неуспешно изтриване на статията.'); }
  }

  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">VALÉRE JOURNAL</p><h2 className="display-serif mt-2 text-4xl">Блог и статии</h2><p className="mt-3 text-sm text-neutral-500">Пиши статии, качвай снимки, запазвай чернови и публикувай директно в магазина.</p></div><button type="button" className="btn-dark" onClick={() => { setEditor({ ...blank, tags: [] }); setPreview(false); setSuccess(''); }}><Plus size={16}/> НОВА СТАТИЯ</button></div>
    {success && <p role="status" className="border border-[#bfd3c0] bg-[#f0f7ef] p-4 text-sm text-[#315733]">{success}</p>}
    {editor && <form onSubmit={(event) => void save(event)} className="space-y-7 border border-[#ddd5cc] bg-[#f8f5f0] p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-medium">{editor.id ? 'Редакция' : 'Нова статия'}</h3><button type="button" onClick={() => setEditor(null)} aria-label="Затвори"><X size={20}/></button></div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="field-label md:col-span-2">Заглавие *<input required className="field-input" maxLength={180} value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value, slug: editor.isNew ? slugifyCommerce(e.target.value) : editor.slug })}/></label>
        <label className="field-label">URL / slug *<input required className="field-input" value={editor.slug} onChange={(e) => change('slug', e.target.value)}/></label>
        <label className="field-label">Категория<input className="field-input" list="blog-categories" value={editor.category} onChange={(e) => change('category', e.target.value)}/><datalist id="blog-categories">{categories.map((c) => <option key={c} value={c}/>)}</datalist></label>
        <label className="field-label md:col-span-2">Кратко описание (карта, социални мрежи)<textarea rows={2} maxLength={500} className="field-input" value={editor.excerpt} onChange={(e) => change('excerpt', e.target.value)}/></label>
        <label className="field-label">Автор<input className="field-input" value={editor.author} maxLength={120} onChange={(e) => change('author', e.target.value)}/></label>
        <label className="field-label">Тагове, разделени със запетая<input className="field-input" value={editor.tags.join(', ')} onChange={(e) => change('tags', e.target.value.split(','))}/></label>
        <label className="field-label md:col-span-2">Основна снимка (HTTPS URL)<input type="url" className="field-input" value={editor.coverImage} onChange={(e) => change('coverImage', e.target.value)} placeholder="https://..."/></label>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs"><UploadCloud size={17}/> {busy ? 'КАЧВАНЕ...' : 'КАЧИ КОРИЦА'}<input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => void upload(e.target.files?.[0], 'cover')}/></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={editor.featured} onChange={(e) => change('featured', e.target.checked)}/> Избрана статия (featured)</label>
        <label className="field-label">SEO заглавие<input className="field-input" maxLength={180} value={editor.seoTitle} onChange={(e) => change('seoTitle', e.target.value)}/></label>
        <label className="field-label">SEO описание<input className="field-input" maxLength={300} value={editor.seoDescription} onChange={(e) => change('seoDescription', e.target.value)}/></label>
      </div>
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-medium">Съдържание *</h4><div className="flex flex-wrap gap-2"><button type="button" onClick={() => insertText('## ')} className="border px-3 py-2 text-xs">H2</button><button type="button" onClick={() => insertText('**', '**')} className="border px-3 py-2 text-xs font-bold">B</button><button type="button" onClick={() => insertText('*', '*')} className="border px-3 py-2 text-xs italic">I</button><button type="button" onClick={() => insertText('- ')} className="border px-3 py-2 text-xs">Списък</button><button type="button" onClick={() => insertText('[', '](https://example.com)')} className="border px-3 py-2 text-xs">Линк</button><label className="inline-flex cursor-pointer items-center gap-1 border px-3 py-2 text-xs"><ImagePlus size={15}/> Снимка в текста<input className="hidden" type="file" accept="image/*" disabled={busy} onChange={(e) => void upload(e.target.files?.[0], 'inline')}/></label></div></div>
        <div className="mb-4 flex gap-2"><button type="button" onClick={() => setPreview(false)} className={`px-4 py-2 text-xs ${!preview ? 'bg-[#262522] text-white' : 'bg-white'}`}>Редактор</button><button type="button" onClick={() => setPreview(true)} className={`flex items-center gap-2 px-4 py-2 text-xs ${preview ? 'bg-[#262522] text-white' : 'bg-white'}`}><Eye size={14}/> Преглед</button></div>
        {preview ? <div className="min-h-[300px] border border-[#ded8d0] bg-white p-6 sm:p-10"><MarkdownArticle source={editor.body || 'Тук ще се показва текстът на статията.'}/></div> : <textarea ref={bodyRef} required rows={18} className="field-input min-h-[360px] w-full resize-y font-mono text-sm leading-7" value={editor.body} onChange={(e) => change('body', e.target.value)} placeholder="Въведи статията си тук. Използвай бутоните за заглавия, удебелен текст, списъци, линкове и снимки."/>}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-6"><label className="field-label">Статус<select className="field-input" value={editor.status} onChange={(e) => change('status', e.target.value as BlogStatus)}><option value="draft">Чернова</option><option value="published">Публикувана</option></select></label><button type="submit" disabled={busy} className="btn-dark self-end"><Check size={16}/> {busy ? 'ЗАПИСВАНЕ...' : 'ЗАПАЗИ'}</button>{editor.status === 'draft' && <button type="button" disabled={busy} onClick={() => void save(undefined, 'published')} className="btn-outline self-end">ПУБЛИКУВАЙ</button>}</div>
      <p className="text-xs text-neutral-500">Статиите с „Чернова“ не се виждат от клиентите. Публикуваните могат да се отварят от публичния блог.</p>
    </form>}
    <div className="flex items-center gap-3 border border-[#e4ded5] bg-white px-4"><Search size={18} className="text-neutral-500"/><input value={queryText} onChange={(e) => setQueryText(e.target.value)} className="w-full bg-transparent py-4 text-sm outline-none" placeholder="Търси по заглавие, категория или URL..."/></div>
    <div className="grid gap-4">{visible.length ? visible.map((post) => <div key={post.id} className="flex flex-wrap items-center justify-between gap-5 border border-[#e4ded5] bg-white p-5 sm:p-6"><div className="flex min-w-0 items-center gap-4">{post.coverImage ? <img src={post.coverImage} alt="" className="h-20 w-16 object-cover"/> : <div className="grid h-20 w-16 place-items-center bg-[#eee8e1] text-xs">VALÉRE</div>}<div><p className="text-sm font-medium">{post.title}</p><p className="mt-2 text-xs text-neutral-500">{post.category} · {post.status === 'published' ? 'Публикувана' : 'Чернова'} · {dateLabel(post.publishedAt)}</p><p className="mt-1 text-xs text-neutral-400">/blog/{post.slug}</p></div></div><div className="flex gap-2"><button type="button" onClick={() => edit(post)} className="inline-flex gap-2 border border-black/15 px-3 py-2 text-xs"><Pencil size={14}/> РЕДАКЦИЯ</button>{post.status === 'published' && <Link href={`/blog/${post.slug}`} target="_blank" className="border border-black/15 px-3 py-2 text-xs" aria-label="Преглед на статията"><Eye size={15}/></Link>}<button type="button" onClick={() => void remove(post)} className="border border-red-200 px-3 py-2 text-red-600" aria-label="Изтрий статията"><Trash2 size={15}/></button></div></div>) : <p className="border border-[#e4ded5] bg-white p-10 text-center text-sm text-neutral-500">Няма намерени статии. Създай първата публикация за VALÉRE.</p>}</div>
  </div>;
}
