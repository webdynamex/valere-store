import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Instagram } from "@/components/instagram-icon";

export function Footer() {
  return (
    <footer className="bg-[#262522] text-[#eeebe6]">
      <div className="mx-auto grid max-w-[1440px] gap-11 px-6 pb-16 pt-20 sm:px-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-16 lg:px-16">
        <div><Link href="/" className="brand-wordmark brand-wordmark--footer inline-block">VALÉRE</Link><p className="mt-5 max-w-[330px] text-sm leading-7 text-white/55">Curated pieces. Confident moments. Individual style.</p><a href="https://www.instagram.com/valere.concept_/" target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-xs tracking-[.12em]"><Instagram size={17}/> @VALERE.CONCEPT_ <ArrowUpRight size={14}/></a></div>
        <div><h3 className="mb-6 text-xs tracking-[.18em]">КОЛЕКЦИЯ</h3><div className="flex flex-col gap-4 text-sm text-white/55"><Link href="/shop">Всички продукти</Link><Link href="/shop?category=clothing">Дрехи</Link><Link href="/shop?category=corsets">Корсети</Link><Link href="/shop?category=accessories">Аксесоари</Link><Link href="/shop?category=eyewear">Очила</Link></div></div>
        <div><h3 className="mb-6 text-xs tracking-[.18em]">ИНФОРМАЦИЯ</h3><div className="flex flex-col gap-4 text-sm text-white/55"><span>Доставка — предстои</span><span>Връщане — предстои</span><span>Условия — предстоят</span><span>Лични данни — предстои</span><Link href="/account">Моят профил</Link></div></div>
        <div><h3 className="mb-6 text-xs tracking-[.18em]">СВЪРЖЕТЕ СЕ С НАС</h3><p className="text-sm leading-7 text-white/55">Пишете ни през Instagram за въпроси относно моделите и размерите.</p><a href="https://www.instagram.com/valere.concept_/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 border-b border-white/60 pb-1 text-xs tracking-[.14em]">НАПИШЕТЕ НИ <ArrowUpRight size={15}/></a></div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 border-t border-white/10 px-6 py-6 text-[10px] tracking-[.08em] text-white/45 sm:flex-row sm:px-12 lg:px-16"><span>© {new Date().getFullYear()} VALÉRE. ALL RIGHTS RESERVED.</span><span>DESIGNED WITH INTENTION</span></div>
    </footer>
  );
}
