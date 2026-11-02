'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, MoveUpRight } from 'lucide-react';
import { useCommerceCatalog, useHomepageConfig } from '@/hooks/use-commerce-content';
import { DEFAULT_HOMEPAGE } from '@/lib/commerce-defaults';

function Lines({ text }: { text: string }) {
  return <>{text.split('\n').map((line, index) => <span key={index}>{index > 0 && <br/>}{line}</span>)}</>;
}

export function HomeHero() {
  const { home } = useHomepageConfig();
  return <section className="relative min-h-[620px] overflow-hidden bg-[#ded6cc] sm:min-h-[730px] lg:min-h-[780px]">
    {home.heroImage && <Image src={home.heroImage} alt="VALÉRE fashion editorial" fill unoptimized priority className="object-cover object-center lg:object-[center_40%]" sizes="100vw"/>}
    <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent"/>
    <div className="section-wrap relative flex min-h-[620px] flex-col justify-end pb-20 text-white sm:min-h-[730px] sm:pb-24 lg:min-h-[780px] lg:pb-28">
      <div className="max-w-[850px]"><p className="mb-6 text-[11px] font-medium tracking-[.31em] sm:text-xs">{home.heroEyebrow}</p><h1 className="display-serif text-[57px] leading-[.96] sm:text-[83px] lg:text-[110px]">{home.heroTitle === DEFAULT_HOMEPAGE.heroTitle ? <>Wear your <em className="font-normal">own</em><br/>story.</> : <Lines text={home.heroTitle}/>}</h1><p className="mt-8 max-w-[430px] text-[14px] leading-7 text-white/90 sm:text-[16px]">{home.heroDescription}</p><Link href={home.heroLink} className="mt-9 inline-flex items-center gap-7 bg-white px-8 py-[18px] text-[11px] font-medium tracking-[.16em] text-[#24211e] transition-colors hover:bg-[#e7e0d8]">{home.heroButton} <ArrowUpRight size={17}/></Link></div>
      <div className="absolute bottom-8 right-6 hidden items-center gap-3 text-[10px] tracking-[.15em] sm:flex lg:right-14"><span className="h-px w-10 bg-white/80"/>EDITORIAL / 01</div>
    </div>
  </section>;
}

export function HomeCollections() {
  const { home } = useHomepageConfig();
  const { collections } = useCommerceCatalog();
  const featured = home.featuredCollectionIds.map((id) => collections.find((c) => c.id === id)).filter((c) => Boolean(c?.published));
  if (featured.length === 0) return null;
  return <section className="section-wrap pb-20 sm:pb-28"><div className="mb-9 flex items-end justify-between"><div><p className="eyebrow">EXPLORE OUR WORLD</p><h2 className="display-serif mt-3 text-[36px] sm:text-[55px]">{home.collectionHeading === DEFAULT_HOMEPAGE.collectionHeading ? <>Find your <em>signature</em></> : home.collectionHeading}</h2></div></div><div className="grid gap-4 md:grid-cols-2 md:gap-7">{featured.map((item) => {
    if (!item) return null;
    const href = item.id === 'corset-edit' && !item.productIds.length ? '/shop?category=corsets' : item.id === 'little-details' && !item.productIds.length ? '/shop?category=accessories' : `/shop?collection=${encodeURIComponent(item.id)}`;
    return <Link key={item.id} href={href} className="group relative aspect-[1.05] overflow-hidden bg-[#e5dfd7] sm:aspect-[1.12]">{item.image && <Image src={item.image} alt={item.name} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"/><div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-white sm:bottom-11 sm:left-11 sm:right-11"><div><p className="mb-3 text-[10px] tracking-[.25em]">{item.subtitle}</p><h3 className="display-serif text-[33px] sm:text-[43px]">{item.name}</h3></div><MoveUpRight size={29} strokeWidth={1}/></div></Link>;
  })}</div></section>;
}

export function HomeStory() {
  const { home } = useHomepageConfig();
  return <section className="bg-[#e9e3dc]"><div className="mx-auto grid max-w-[1600px] lg:grid-cols-2"><div className="flex flex-col justify-center px-7 py-20 sm:px-16 lg:px-[13%] lg:py-24"><p className="eyebrow">{home.storyEyebrow}</p><h2 className="display-serif mt-6 max-w-[530px] text-[49px] leading-[1.08] sm:text-[65px]">{home.storyTitle === DEFAULT_HOMEPAGE.storyTitle ? <>Not just clothes.<br/><em>A feeling.</em></> : <Lines text={home.storyTitle}/>}</h2><div className="mt-7 h-px w-16 bg-[#7b7066]"/><p className="mt-8 max-w-[430px] text-sm leading-8 text-[#665e57]">{home.storyDescription}</p><Link href="/shop" className="mt-8 inline-flex w-fit items-center gap-3 border-b border-black/70 pb-2 text-xs tracking-[.15em]">ОТКРИЙ VALÉRE <ArrowRight size={16}/></Link></div><div className="relative min-h-[460px] bg-[#d3c5b7] lg:min-h-[710px]">{home.storyImage && <Image src={home.storyImage} alt="VALÉRE editorial" fill unoptimized className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw"/>}</div></div></section>;
}
