"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { useHomepageConfig } from "@/hooks/use-commerce-content";

export function ProductSection() {
  const { products, loading, error } = useProducts();
  const { home } = useHomepageConfig();
  const featured = (home.featuredProductIds || []).length
    ? home.featuredProductIds.map((id) => products.find((p) => p.id === id)).filter((p): p is (typeof products)[number] => Boolean(p))
    : products;
  return (
    <section className="section-wrap py-20 sm:py-28">
      <div className="mb-9 flex items-end justify-between gap-5 sm:mb-12"><div><p className="eyebrow">DISCOVER YOUR NEXT FAVORITE</p><h2 className="display-serif mt-3 text-[36px] sm:text-[55px]">The curated edit<span className="italic">.</span></h2></div><Link href="/shop" className="mb-2 hidden items-center gap-2 border-b border-black pb-1 text-[11px] tracking-[.1em] sm:flex">РАЗГЛЕДАЙ ВСИЧКИ <ArrowUpRight size={15}/></Link></div>
      {loading ? <p className="text-sm text-neutral-500">Зареждане на колекцията...</p> : error ? <p className="text-sm text-red-700">{error}</p> : featured.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">{featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="border border-neutral-200 p-14 text-center text-sm">Очаквайте първата колекция на VALÉRE.</div>}
      <div className="mt-12 flex justify-center sm:hidden"><Link className="btn-outline" href="/shop">ВИЖ КОЛЕКЦИЯТА <ArrowUpRight size={15}/></Link></div>
    </section>
  );
}
