'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import { useBlogPosts } from '@/hooks/use-blog';
import type { BlogPost } from '@/types/blog';

export function BlogCard({ post }: { post: BlogPost }) {
  return <Link href={`/blog/${post.slug}`} className="group block overflow-hidden">
    <div className="relative aspect-[1.25] overflow-hidden bg-[#eae4dd]">{post.coverImage ? <Image src={post.coverImage} alt={post.title} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw"/> : <div className="grid h-full place-items-center text-3xl tracking-[.18em]">VALÉRE</div>}</div>
    <div className="pt-5"><p className="eyebrow text-[#8a7467]">{post.category} · {post.publishedAt?.seconds ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString('bg-BG') : 'VALÉRE'}</p><h3 className="display-serif mt-3 text-[30px] leading-tight sm:text-[36px]">{post.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-7 text-neutral-500">{post.excerpt}</p><span className="mt-5 inline-flex items-center gap-2 border-b border-black/60 pb-1 text-[11px] tracking-[.13em]">ПРОЧЕТИ <ArrowUpRight size={15}/></span></div>
  </Link>;
}

export function BlogListing() {
  const { posts, loading, error } = useBlogPosts();
  const [category, setCategory] = useState('Всички');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['Всички', ...new Set(posts.map((p) => p.category))], [posts]);
  const visible = useMemo(() => posts.filter((p) => (category === 'Всички' || p.category === category) && `${p.title} ${p.excerpt} ${p.tags?.join(' ') || ''}`.toLocaleLowerCase('bg').includes(query.toLocaleLowerCase('bg'))), [posts, category, query]);
  return <><section className="bg-[#f0ece7] px-6 py-24 text-center sm:py-32"><p className="eyebrow">THE WORLD OF VALÉRE</p><h1 className="display-serif mt-5 text-[60px] leading-none sm:text-[90px]">The Journal<span className="italic">.</span></h1><p className="mx-auto mt-7 max-w-xl text-sm leading-8 text-neutral-600">Модни истории, стайлинг идеи и всичко, което ни вдъхновява.</p></section>
  <div className="section-wrap py-12 sm:py-20"><div className="mb-12 flex flex-wrap items-center justify-between gap-5 border-b border-black/10 pb-7"><div className="flex flex-wrap gap-3">{categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 text-xs ${category === c ? 'bg-[#272420] text-white' : 'border border-black/10 hover:bg-[#f3eee8]'}`}>{c}</button>)}</div><label className="flex items-center gap-2 border-b border-black/20 py-2"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Търси статии..." className="w-[170px] bg-transparent text-xs outline-none"/></label></div>
  {loading ? <p className="py-20 text-center text-sm text-neutral-500">Зареждане на статиите...</p> : error ? <p role="alert" className="py-20 text-center text-sm text-red-700">{error}</p> : visible.length ? <div className="grid gap-x-7 gap-y-16 md:grid-cols-2 lg:grid-cols-3">{visible.map((post) => <BlogCard key={post.id} post={post}/>)}</div> : <div className="py-24 text-center"><p className="display-serif text-3xl">Очаквайте нови истории.</p><p className="mt-5 text-sm text-neutral-500">Скоро ще публикуваме първите статии.</p></div>}</div></>;
}
