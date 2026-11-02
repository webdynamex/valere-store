"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Heart, Minus, Plus, Truck } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useStore } from "@/context/store-context";
import { formatPrice } from "@/lib/constants";
import { isDemoProduct } from "@/lib/demo-products";

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useProducts();
  const { addToCart, favoriteIds, toggleFavorite } = useStore();
  const product = useMemo(() => products.find((item) => item.slug === slug), [products, slug]);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [openSection, setOpenSection] = useState("details");
  const colors = product ? [...new Set(product.variants.map((item) => item.color))] : [];
  const sizes = product ? [...new Set(product.variants.filter((item) => item.color === (color || colors[0])).map((item) => item.size))] : [];
  const selectedColor = colors.includes(color) ? color : colors[0] || "";
  const selectedSize = sizes.includes(size) ? size : sizes[0] || "";
  const variant = product?.variants.find((item) => item.color === selectedColor && item.size === selectedSize);
  const liked = product ? favoriteIds.includes(product.id) : false;
  useEffect(() => { setActiveImage(0); setColor(""); setSize(""); }, [slug]);
  if (loading) return <div className="section-wrap py-32 text-center text-sm">Зареждане...</div>;
  if (!product) return <div className="section-wrap py-32 text-center"><p className="display-serif text-3xl">Продуктът не е намерен.</p><Link href="/shop" className="mt-6 inline-block border-b border-black pb-1 text-xs">ОБРАТНО КЪМ МАГАЗИНА</Link></div>;
  const isDemo = isDemoProduct(product.id);

  return <div className="section-wrap pb-24 pt-8 sm:pt-14">
    <div className="mb-8 flex items-center gap-2 text-[11px] text-neutral-500"><Link href="/shop" className="flex items-center gap-2 hover:text-black"><ArrowLeft size={13}/> Магазин</Link><span>/</span><span className="text-[#262522]">{product.name}</span></div>
    <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-16 xl:gap-24">
      <div><div className="relative aspect-[3/3.75] overflow-hidden bg-[#eae5de]">{product.images[activeImage] && <Image src={product.images[activeImage]} alt={product.name} fill unoptimized priority className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw"/>}{product.isNew && <span className="product-chip absolute left-5 top-5">NEW ARRIVAL</span>}</div>{product.images.length > 1 && <div className="mt-3 flex gap-3">{product.images.map((image, index) => <button key={`${index}-${image}`} onClick={() => setActiveImage(index)} className={`relative h-24 w-20 overflow-hidden bg-[#ece7e0] ${activeImage === index ? "ring-1 ring-[#262522] ring-offset-2" : ""}`} aria-label={`Снимка ${index+1}`}><Image src={image} alt="" fill unoptimized className="object-cover" sizes="80px"/></button>)}</div>}</div>
      <div className="lg:pt-10"><p className="eyebrow">VALÉRE / {product.category.toUpperCase()}</p><h1 className="mt-5 text-[28px] font-medium tracking-[.04em] sm:text-[35px]">{product.name}</h1><p className="mt-3 text-sm text-neutral-500">{product.subtitle || "The VALÉRE edit"}</p><div className="mt-7 flex items-center gap-3 text-xl"><span>{formatPrice(product.priceCents)}</span>{product.compareAtCents && <span className="text-base text-neutral-400 line-through">{formatPrice(product.compareAtCents)}</span>}</div>
      <div className="mt-10 border-t border-black/10 pt-8"><div className="flex items-center justify-between"><p className="text-xs font-medium tracking-[.07em]">ЦВЯТ: <span className="font-normal text-neutral-500">{selectedColor}</span></p></div><div className="mt-4 flex flex-wrap gap-2">{colors.map((item) => <button key={item} onClick={() => { setColor(item); setSize(""); }} className={`min-w-20 border px-4 py-3 text-xs ${selectedColor === item ? "border-black" : "border-black/15"}`}>{item}</button>)}</div></div>
      <div className="mt-8"><div className="flex items-center justify-between"><p className="text-xs font-medium tracking-[.07em]">РАЗМЕР: <span className="font-normal text-neutral-500">{selectedSize}</span></p></div><div className="mt-4 flex flex-wrap gap-2">{sizes.map((item) => { const matching = product.variants.find((v) => v.color === selectedColor && v.size === item); return <button key={item} disabled={!matching?.stock} onClick={() => setSize(item)} className={`min-w-12 border px-4 py-3 text-xs ${selectedSize === item ? "border-black bg-black text-white" : "border-black/15"} disabled:cursor-not-allowed disabled:text-neutral-300 disabled:line-through`}>{item}</button>; })}</div></div>
      <div className="mt-9 flex gap-3"><button disabled={!variant || variant.stock < 1} onClick={() => variant && addToCart(product, variant)} className="btn-dark min-h-14 flex-1 justify-center disabled:cursor-not-allowed disabled:bg-neutral-400">{variant?.stock ? "ДОБАВИ В КОЛИЧКАТА" : "ИЗЧЕРПАНО"} <Plus size={16}/></button><button onClick={() => toggleFavorite(product.id)} aria-label="Добави в любими" className="flex h-14 w-14 shrink-0 items-center justify-center border border-black/20"><Heart size={20} strokeWidth={1.4} fill={liked ? "#262522" : "none"}/></button></div>
      {isDemo && <div className="mt-5 border border-[#c7b9a9] bg-[#f9f4ed] p-4 text-xs leading-6 text-[#685447]">Демонстрационен артикул — показан за дизайн и тест на количката. Не може да бъде поръчан.</div>}
      {variant?.stock ? <p className="mt-5 flex items-center gap-2 text-xs text-[#49604a]"><Check size={15}/> В наличност</p> : null}
      <div className="mt-11 border-t border-black/10"><button onClick={() => setOpenSection(openSection === "details" ? "" : "details")} className="flex w-full items-center justify-between py-5 text-xs font-medium tracking-[.08em]">ОПИСАНИЕ {openSection === "details" ? <Minus size={15}/> : <ChevronDown size={15}/>}</button>{openSection === "details" && <p className="pb-7 text-sm leading-8 text-neutral-600">{product.description}</p>}</div><div className="border-t border-black/10"><button onClick={() => setOpenSection(openSection === "delivery" ? "" : "delivery")} className="flex w-full items-center justify-between py-5 text-xs font-medium tracking-[.08em]">ДОСТАВКА И ВРЪЩАНЕ {openSection === "delivery" ? <Minus size={15}/> : <ChevronDown size={15}/>}</button>{openSection === "delivery" && <p className="pb-7 text-sm leading-8 text-neutral-600">Интеграцията с Еконт и Спиди, както и финалните условия за доставка и връщане, предстоят преди официалния старт.</p>}</div><div className="mt-6 flex items-center gap-3 bg-[#f2efeb] p-5 text-xs text-neutral-600"><Truck strokeWidth={1.2} size={23}/> Доставка в България — предстои свързване на куриерите.</div>
      </div>
    </div>
  </div>;
}
