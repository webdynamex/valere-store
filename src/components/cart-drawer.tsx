"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatPrice } from "@/lib/constants";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, subtotalCents, updateQuantity, removeFromCart } = useStore();
  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Количка">
      <button className="absolute inset-0 bg-black/45" aria-label="Затвори количката" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[465px] flex-col bg-[#fcfbf8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-7 py-6">
          <div className="flex items-center gap-3"><h2 className="font-serif text-[25px]">Моята количка</h2><span className="text-xs text-neutral-500">({cart.length})</span></div>
          <button onClick={() => setCartOpen(false)} aria-label="Затвори"><X size={22} strokeWidth={1.4}/></button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag size={42} strokeWidth={1}/><p className="font-serif text-2xl">Количката е празна</p>
            <p className="text-sm text-neutral-500">Открийте нещо, което ви вдъхновява.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)} className="btn-dark">КЪМ КОЛЕКЦИЯТА <ArrowRight size={14}/></Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto p-7">
              {cart.map((line) => (
                <div key={line.key} className="flex gap-4">
                  <Link href={`/product/${line.slug}`} onClick={() => setCartOpen(false)} className="relative h-[145px] w-[108px] shrink-0 overflow-hidden bg-[#e7e2dc]">
                    {line.image && <Image src={line.image} alt={line.name} fill unoptimized className="object-cover" sizes="108px"/>}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[11px] tracking-[.15em] text-neutral-500">VALÉRE</p>
                    <Link href={`/product/${line.slug}`} onClick={() => setCartOpen(false)} className="mt-2 text-[13px] font-medium tracking-wide">{line.name}</Link>
                    <p className="mt-2 text-xs text-neutral-500">{line.color} / {line.size}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center border border-black/15">
                        <button className="p-2" onClick={() => updateQuantity(line.key, line.quantity - 1)} aria-label="Намали"><Minus size={12}/></button>
                        <span className="w-6 text-center text-xs">{line.quantity}</span>
                        <button className="p-2" onClick={() => updateQuantity(line.key, line.quantity + 1)} aria-label="Увеличи"><Plus size={12}/></button>
                      </div>
                      <span className="text-[13px]">{formatPrice(line.priceCents * line.quantity)}</span>
                      <button className="text-neutral-400 hover:text-black" onClick={() => removeFromCart(line.key)} aria-label="Премахни"><Trash2 size={15}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-black/10 bg-white px-7 py-7">
              <div className="mb-3 flex justify-between text-sm"><span>Междинна сума</span><strong className="font-medium">{formatPrice(subtotalCents)}</strong></div>
              <p className="mb-5 text-[11px] leading-5 text-neutral-500">Доставката се уточнява при потвърждение на поръчката.</p>
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn-dark w-full justify-center">ПРОДЪЛЖИ КЪМ ПОРЪЧКА <ArrowRight size={15}/></Link>
              <button className="mt-4 w-full text-center text-xs underline underline-offset-4" onClick={() => setCartOpen(false)}>Продължи пазаруването</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
