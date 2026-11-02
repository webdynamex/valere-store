"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Instagram } from "@/components/instagram-icon";
import { useStore } from "@/context/store-context";

const links = [
  { label: "НОВО", href: "/shop?filter=new" },
  { label: "ВСИЧКИ", href: "/shop" },
  { label: "ДРЕХИ", href: "/shop?category=clothing" },
  { label: "КОРСЕТИ", href: "/shop?category=corsets" },
  { label: "АКСЕСОАРИ", href: "/shop?category=accessories" },
  { label: "ОЧИЛА", href: "/shop?category=eyewear" },
];

export function Header() {
  const { count, setCartOpen, favoriteIds } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false);
  };

  return (
    <>
      <div className="bg-[#191816] px-4 py-[9px] text-center text-[10px] font-medium tracking-[.16em] text-white sm:text-[11px]">
        VALÉRE — STYLE THAT SPEAKS FOR YOU
      </div>
      <header className="sticky top-0 z-50 border-b border-[#e7e3dd] bg-[#fcfbf8]/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[80px] max-w-[1500px] items-center justify-between px-5 sm:px-9 lg:h-[92px] lg:px-14">
          <div className="flex min-w-[70px] items-center gap-5 sm:min-w-[140px]">
            <button className="lg:hidden" aria-label="Отвори менюто" onClick={() => setMenuOpen(true)}><Menu strokeWidth={1.5} size={24}/></button>
            <button className="hidden lg:block" aria-label="Търси" onClick={() => setSearchOpen((v) => !v)}><Search size={20} strokeWidth={1.5}/></button>
          </div>
          <Link href="/" aria-label="VALÉRE начало" className="absolute left-1/2 -translate-x-1/2 text-[32px] font-medium tracking-[.21em] sm:text-[41px]">VALÉRE</Link>
          <div className="flex min-w-[70px] justify-end gap-[18px] sm:min-w-[140px] sm:gap-6">
            <button className="lg:hidden" aria-label="Търси" onClick={() => setSearchOpen((v) => !v)}><Search size={20} strokeWidth={1.4}/></button>
            <Link href="/shop?filter=favorites" className="relative hidden sm:block" aria-label="Любими"><Heart size={20} strokeWidth={1.4}/>{favoriteIds.length > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-[9px] text-white">{favoriteIds.length}</span>}</Link>
            <button className="relative" aria-label="Количка" onClick={() => setCartOpen(true)}><ShoppingBag size={21} strokeWidth={1.45}/>{count > 0 && <span className="absolute -right-2 -top-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#2e2a27] px-0.5 text-[9px] text-white">{count}</span>}</button>
          </div>
        </div>
        <nav className="hidden justify-center gap-9 border-t border-black/[.04] pb-[17px] pt-[16px] lg:flex" aria-label="Главна навигация">
          {links.map((link) => <Link key={link.href} href={link.href} className="nav-link">{link.label}</Link>)}
        </nav>
        {searchOpen && <form onSubmit={onSearch} className="absolute left-0 right-0 top-full z-50 flex items-center gap-4 border-b border-black/10 bg-[#fcfbf8] px-6 py-5 shadow-md sm:px-16"><Search size={18}/><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Потърсете в колекцията..." className="w-full bg-transparent text-sm outline-none"/><button type="submit" aria-label="Търси"><ArrowRight size={20}/></button><button type="button" onClick={() => setSearchOpen(false)} aria-label="Затвори"><X size={20}/></button></form>}
      </header>
      {menuOpen && <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Меню"><button className="absolute inset-0 bg-black/45" onClick={() => setMenuOpen(false)} aria-label="Затвори менюто"/><aside className="absolute left-0 top-0 flex h-full w-[86%] max-w-[350px] flex-col bg-[#fcfbf8] p-7"><div className="flex items-center justify-between"><span className="text-2xl tracking-[.19em]">VALÉRE</span><button onClick={() => setMenuOpen(false)} aria-label="Затвори"><X/></button></div><div className="mt-12 flex flex-col gap-7">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-sm tracking-[.16em]">{link.label}</Link>)}</div><a className="mt-auto flex items-center gap-2 text-xs tracking-wider" href="https://www.instagram.com/valere.concept_/" target="_blank" rel="noreferrer"><Instagram size={18}/> FOLLOW ON INSTAGRAM</a></aside></div>}
    </>
  );
}
