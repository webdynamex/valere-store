"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import type { Product } from "@/types/store";
import { formatPrice, productTotalStock } from "@/lib/constants";
import { useStore } from "@/context/store-context";

export function ProductCard({ product }: { product: Product }) {
  const { favoriteIds, toggleFavorite } = useStore();
  const saved = favoriteIds.includes(product.id);
  const soldOut = productTotalStock(product.variants) === 0;
  return (
    <div className="group min-w-0">
      <div className="relative overflow-hidden bg-[#eae6e0]">
        <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4.15] overflow-hidden">
          {product.images[0] ? <Image src={product.images[0]} alt={product.name} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-[1.045]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"/> : <div className="absolute inset-0 grid place-items-center text-xs tracking-[.2em] text-neutral-400">VALÉRE</div>}
        {product.images[1] && <Image src={product.images[1]} alt={`${product.name} детайл`} fill unoptimized className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" sizes="(max-width: 640px) 50vw, 25vw"/>}
        <div className="absolute bottom-4 right-4 hidden h-10 w-10 items-center justify-center rounded-full bg-white/90 transition-transform group-hover:scale-105 sm:flex"><ArrowUpRight size={18} strokeWidth={1.3}/></div>
      </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-2">{soldOut ? <span className="product-chip">ИЗЧЕРПАНО</span> : product.isNew ? <span className="product-chip">NEW</span> : product.compareAtCents ? <span className="product-chip">SPECIAL PRICE</span> : null}</div>
        <button onClick={() => toggleFavorite(product.id)} aria-label={saved ? "Премахни от любими" : "Добави в любими"} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 hover:bg-white"><Heart size={18} fill={saved ? "#262522" : "none"} strokeWidth={1.3}/></button>
      </div>
      <div className="pt-4 text-center sm:pt-5"><Link href={`/product/${product.slug}`} className="block text-[11px] font-medium tracking-[.09em] sm:text-[13px]">{product.name}</Link><p className="mt-1 text-[11px] text-neutral-500">{product.subtitle || "VALÉRE Collection"}</p><div className="mt-2 flex justify-center gap-3 text-xs sm:text-sm"><span>{formatPrice(product.priceCents)}</span>{product.compareAtCents && <span className="text-neutral-400 line-through">{formatPrice(product.compareAtCents)}</span>}</div></div>
    </div>
  );
}
