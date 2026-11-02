import { ArrowUpRight } from "lucide-react";
import { Instagram } from "@/components/instagram-icon";
import { HomeHero, HomeCollections, HomeStory } from "@/components/home-dynamic";
import { ProductSection } from "@/components/product-section";

export default function Home() {
  return <>
    <HomeHero/>
    <section className="border-b border-[#dedbd6] bg-[#f3f0eb] py-[23px]"><div className="section-wrap flex flex-wrap justify-center gap-x-12 gap-y-4 text-center text-[10px] tracking-[.17em] text-[#57514b] sm:justify-between sm:text-[11px]"><span>CURATED WITH INTENTION</span><span>TIMELESS & CONTEMPORARY</span><span>MADE FOR YOUR MOMENTS</span></div></section>
    <ProductSection/>
    <HomeCollections/>
    <HomeStory/>
    <section className="section-wrap py-24 text-center sm:py-32"><Instagram size={27} strokeWidth={1.3} className="mx-auto"/><p className="eyebrow mt-8">THE WORLD OF VALÉRE</p><h2 className="display-serif mt-3 text-[40px] sm:text-[65px]">Follow the <em>mood.</em></h2><p className="mt-5 text-sm text-neutral-500">Стил, вдъхновение и нови находки.</p><a href="https://www.instagram.com/valere.concept_/" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[12px] tracking-[.12em]">@VALERE.CONCEPT_ <ArrowUpRight size={17}/></a></section>
  </>;
}
