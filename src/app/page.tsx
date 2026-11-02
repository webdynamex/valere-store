import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { Instagram } from "@/components/instagram-icon";
import { ProductSection } from "@/components/product-section";

const HERO_IMAGE = "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=90";
const EDITORIAL_IMAGE = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85";
const CORSET_IMAGE = "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1100&q=85";
const ACCESSORY_IMAGE = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1100&q=85";

export default function Home() {
  return <>
    <section className="relative min-h-[620px] overflow-hidden bg-[#ded6cc] sm:min-h-[730px] lg:min-h-[780px]">
      <Image src={HERO_IMAGE} alt="Fashion editorial — примерна снимка" fill unoptimized priority className="object-cover object-center lg:object-[center_40%]" sizes="100vw"/>
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent"/>
      <div className="section-wrap relative flex min-h-[620px] flex-col justify-end pb-20 text-white sm:min-h-[730px] sm:pb-24 lg:min-h-[780px] lg:pb-28">
        <div className="max-w-[760px]"><p className="mb-6 text-[11px] font-medium tracking-[.31em] sm:text-xs">VALÉRE / NEW PERSPECTIVES</p><h1 className="display-serif text-[57px] leading-[.96] sm:text-[83px] lg:text-[110px]">Wear your <em className="font-normal">own</em><br/>story.</h1><p className="mt-8 max-w-[430px] text-[14px] leading-7 text-white/90 sm:text-[16px]">Модата е лично изявление. Открий своя силует, настроение и увереност.</p><Link href="/shop" className="mt-9 inline-flex items-center gap-7 bg-white px-8 py-[18px] text-[11px] font-medium tracking-[.16em] text-[#24211e] transition-colors hover:bg-[#e7e0d8]">ОТКРИЙ КОЛЕКЦИЯТА <ArrowUpRight size={17}/></Link></div>
        <div className="absolute bottom-8 right-6 hidden items-center gap-3 text-[10px] tracking-[.15em] sm:flex lg:right-14"><span className="h-px w-10 bg-white/80"/>EDITORIAL / 01</div>
      </div>
    </section>
    <section className="border-b border-[#dedbd6] bg-[#f3f0eb] py-[23px]"><div className="section-wrap flex flex-wrap justify-center gap-x-12 gap-y-4 text-center text-[10px] tracking-[.17em] text-[#57514b] sm:justify-between sm:text-[11px]"><span>CURATED WITH INTENTION</span><span>TIMELESS & CONTEMPORARY</span><span>MADE FOR YOUR MOMENTS</span></div></section>
    <ProductSection/>
    <section className="section-wrap pb-20 sm:pb-28"><div className="mb-9 flex items-end justify-between"><div><p className="eyebrow">EXPLORE OUR WORLD</p><h2 className="display-serif mt-3 text-[36px] sm:text-[55px]">Find your <em>signature</em></h2></div></div><div className="grid gap-4 md:grid-cols-2 md:gap-7">{[{title:"The corset edit",label:"CORSETS",href:"/shop?category=corsets",image:CORSET_IMAGE},{title:"The little details",label:"ACCESSORIES",href:"/shop?category=accessories",image:ACCESSORY_IMAGE}].map((item) => <Link key={item.href} href={item.href} className="group relative aspect-[1.05] overflow-hidden bg-[#e5dfd7] sm:aspect-[1.12]"><Image src={item.image} alt={item.title} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw"/><div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"/><div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-white sm:bottom-11 sm:left-11 sm:right-11"><div><p className="mb-3 text-[10px] tracking-[.25em]">{item.label}</p><h3 className="display-serif text-[33px] sm:text-[43px]">{item.title}</h3></div><MoveUpRight size={29} strokeWidth={1}/></div></Link>)}</div></section>
    <section className="bg-[#e9e3dc]"><div className="mx-auto grid max-w-[1600px] lg:grid-cols-2"><div className="flex flex-col justify-center px-7 py-20 sm:px-16 lg:px-[13%] lg:py-24"><p className="eyebrow">THE VALÉRE PHILOSOPHY</p><h2 className="display-serif mt-6 max-w-[530px] text-[49px] leading-[1.08] sm:text-[65px]">Not just clothes.<br/><em>A feeling.</em></h2><div className="mt-7 h-px w-16 bg-[#7b7066]"/><p className="mt-8 max-w-[430px] text-sm leading-8 text-[#665e57]">VALÉRE е пространство за личен стил. За дрехите, които носиш по твоя начин. За детайлите, които те правят различна. За увереността да бъдеш себе си.</p><Link href="/shop" className="mt-8 inline-flex w-fit items-center gap-3 border-b border-black/70 pb-2 text-xs tracking-[.15em]">ОТКРИЙ VALÉRE <ArrowRight size={16}/></Link></div><div className="relative min-h-[460px] bg-[#d3c5b7] lg:min-h-[710px]"><Image src={EDITORIAL_IMAGE} alt="VALÉRE moodboard — примерна снимка" fill unoptimized className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw"/></div></div></section>
    <section className="section-wrap py-24 text-center sm:py-32"><Instagram size={27} strokeWidth={1.3} className="mx-auto"/><p className="eyebrow mt-8">THE WORLD OF VALÉRE</p><h2 className="display-serif mt-3 text-[40px] sm:text-[65px]">Follow the <em>mood.</em></h2><p className="mt-5 text-sm text-neutral-500">Стил, вдъхновение и нови находки.</p><a href="https://www.instagram.com/valere.concept_/" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[12px] tracking-[.12em]">@VALERE.CONCEPT_ <ArrowUpRight size={17}/></a></section>
  </>;
}
