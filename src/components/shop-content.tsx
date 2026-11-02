"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useCommerceCatalog } from "@/hooks/use-commerce-content";
import { useProducts } from "@/hooks/use-products";
import { useStore } from "@/context/store-context";
import { ProductCard } from "@/components/product-card";
import { productPriceSummary } from "@/lib/pricing";

export function ShopContent() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "all";
  const collectionId = params.get("collection") || "";
  const { categories, collections } = useCommerceCatalog();
  const filter = params.get("filter") || "all";
  const search = params.get("q") || "";
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const { products, loading, error, demo } = useProducts();
  const { favoriteIds } = useStore();
  const setCategory = (next: string) => {
    const q = new URLSearchParams(params.toString());
    if (next === "all") q.delete("category"); else q.set("category", next);
    router.push(`/shop${q.size ? `?${q.toString()}` : ""}`);
    setShowFilters(false);
  };
  const shown = useMemo(() => {
    let result = products.filter((item) => (category === "all" || item.category === category) && (!collectionId || (collections.find((c) => c.id === collectionId && c.published)?.productIds || []).includes(item.id)) && (!search || `${item.name} ${item.description}`.toLocaleLowerCase("bg").includes(search.toLocaleLowerCase("bg"))));
    if (filter === "new") result = result.filter((item) => item.isNew);
    if (filter === "favorites") result = result.filter((item) => favoriteIds.includes(item.id));
    if (sort === "price-asc") result = [...result].sort((a, b) => productPriceSummary(a).from - productPriceSummary(b).from);
    if (sort === "price-desc") result = [...result].sort((a, b) => productPriceSummary(b).from - productPriceSummary(a).from);
    if (sort === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, category, collectionId, collections, filter, favoriteIds, search, sort]);
  return <>
    <div className="bg-[#f2efeb] px-5 py-16 text-center sm:py-20"><p className="eyebrow">THE VALÉRE WARDROBE</p><h1 className="display-serif mt-4 text-[50px] sm:text-[75px]">The <em>collection</em></h1><p className="mx-auto mt-4 max-w-[510px] text-sm leading-7 text-[#6b625a]">Стилни находки, подбрани с отношение към детайла.</p></div>
    <div className="section-wrap pb-24 pt-10 sm:pt-14">
      {demo && <div className="mb-9 border border-[#c9b9a9] bg-[#f9f4ed] px-5 py-3 text-xs leading-6 text-[#685447]">ДЕМО РЕЖИМ: продуктите, снимките и цените са примерни. Поръчки за тези артикули не се приемат.</div>}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ddd7] pb-6">
        <div className="hidden flex-wrap gap-8 md:flex"><button className={`filter-link ${category === "all" ? "active" : ""}`} onClick={() => setCategory("all")}>ВСИЧКИ</button>{categories.filter((item) => item.active).map((item) => <button key={item.id} className={`filter-link ${category === item.id ? "active" : ""}`} onClick={() => setCategory(item.id)}>{item.name.toLocaleUpperCase("bg")}</button>)}</div>
        <button className="flex items-center gap-2 text-xs md:hidden" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17}/> КАТЕГОРИИ</button>
        <div className="ml-auto flex items-center gap-6"><span className="hidden text-xs text-neutral-500 sm:inline">{shown.length} продукта</span><label className="flex items-center gap-3 text-[11px] tracking-[.1em]">ПОДРЕДИ <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent py-2 text-[11px] outline-none"><option value="featured">По подразбиране</option><option value="price-asc">Цена: възходяща</option><option value="price-desc">Цена: низходяща</option><option value="name">Име</option></select></label></div>
      </div>
      {showFilters && <div className="flex flex-col gap-5 border-b border-neutral-200 py-7 md:hidden"><button className="self-end" onClick={() => setShowFilters(false)} aria-label="Затвори"><X size={18}/></button><button className="text-left text-sm" onClick={() => setCategory("all")}>Всички</button>{categories.filter((item) => item.active).map((item) => <button key={item.id} className="text-left text-sm" onClick={() => setCategory(item.id)}>{item.name}</button>)}</div>}
      {search && <p className="mt-7 text-sm text-neutral-600">Резултати за: <strong>{search}</strong></p>}
      {loading ? <div className="py-24 text-center text-sm text-neutral-500">Зареждане на продуктите...</div> : error ? <div className="py-24 text-center text-sm text-red-700">{error}</div> : shown.length ? <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-11 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-14">{shown.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="py-24 text-center"><p className="display-serif text-3xl">Няма намерени продукти.</p><button onClick={() => router.push("/shop")} className="mt-6 border-b border-black pb-2 text-xs tracking-wide">ВИЖ ЦЯЛАТА КОЛЕКЦИЯ</button></div>}
    </div>
  </>;
}
