'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BlogCard } from '@/components/blog-listing';
import { useBlogPosts } from '@/hooks/use-blog';

export function HomeJournal() {
  const { posts } = useBlogPosts();
  if (!posts.length) return null;
  const featured = [...posts].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3);
  return <section className="section-wrap py-20 sm:py-28"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">VALÉRE JOURNAL</p><h2 className="display-serif mt-4 text-[40px] sm:text-[60px]">Stories & inspiration.</h2></div><Link href="/blog" className="inline-flex items-center gap-2 border-b border-black pb-2 text-xs tracking-wider">ВСИЧКИ СТАТИИ <ArrowUpRight size={16}/></Link></div><div className="grid gap-x-7 gap-y-12 md:grid-cols-3">{featured.map((post) => <BlogCard key={post.id} post={post}/>)}</div></section>;
}
