'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useBlogPosts } from '@/hooks/use-blog';
import { MarkdownArticle } from '@/components/markdown-article';

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, loading, error } = useBlogPosts();
  const post = posts.find((p) => p.slug === slug);
  useEffect(() => { if (post) document.title = `${post.seoTitle || post.title} | VALÉRE`; }, [post]);
  if (loading) return <div className="section-wrap py-32 text-center text-sm">Зареждане...</div>;
  if (error) return <div className="section-wrap py-32 text-center text-sm text-red-700">{error}</div>;
  if (!post) return <div className="section-wrap py-32 text-center"><h1 className="display-serif text-4xl">Статията не е намерена.</h1><Link href="/blog" className="mt-6 inline-block border-b border-black pb-2 text-sm">Към блога</Link></div>;
  return <article className="pb-24"><header className="mx-auto max-w-[950px] px-6 pb-11 pt-14 text-center sm:pb-16 sm:pt-24"><Link href="/blog" className="inline-flex items-center gap-2 text-xs tracking-wider text-neutral-500"><ArrowLeft size={15}/> ВСИЧКИ СТАТИИ</Link><p className="eyebrow mt-11 text-[#8a7467]">{post.category}</p><h1 className="display-serif mt-5 text-[46px] leading-[1.08] sm:text-[76px]">{post.title}</h1><p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-neutral-600">{post.excerpt}</p><div className="mt-7 text-xs tracking-wide text-neutral-500">{post.author} · {post.publishedAt?.seconds ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString('bg-BG') : 'VALÉRE'}</div></header>
    {post.coverImage && <div className="section-wrap"><div className="relative aspect-[1.65] overflow-hidden bg-[#e9e2da]"><Image src={post.coverImage} alt={post.title} fill unoptimized priority className="object-cover" sizes="100vw"/></div></div>}
    <div className="mx-auto max-w-[830px] px-6 pt-12 sm:pt-20"><MarkdownArticle source={post.body}/>{post.tags?.length > 0 && <div className="mt-16 flex flex-wrap gap-2 border-t border-black/10 pt-8">{post.tags.map((tag) => <span key={tag} className="bg-[#f1ede8] px-3 py-2 text-xs">#{tag}</span>)}</div>}<Link href="/blog" className="mt-14 inline-flex items-center gap-2 border-b border-black pb-2 text-xs tracking-wider"><ArrowLeft size={16}/> КЪМ ЖУРНАЛА</Link></div>
  </article>;
}
