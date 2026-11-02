"use client";

import { useMemo } from "react";
import { Copy, Info } from "lucide-react";
import { formatPrice } from "@/lib/constants";

export type VariantDraft = { price: string; compareAt: string; stock: string; sku: string; image: string };
export type VariantDrafts = Record<string, VariantDraft>;

export const variantKey = (color: string, size: string) => `${color}|${size}`;
export const splitOptions = (value: string) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];

export function VariantPriceEditor({ colors, sizes, basePrice, initialStock, drafts, onChange }:
  { colors: string; sizes: string; basePrice: string; initialStock: string; drafts: VariantDrafts; onChange: (next: VariantDrafts) => void }) {
  const combos = useMemo(() => splitOptions(colors).flatMap((color) => splitOptions(sizes).map((size) => ({ color, size, key: variantKey(color, size) }))), [colors, sizes]);
  const edit = (key: string, field: keyof VariantDraft, value: string) => {
    const fallback = { price: "", compareAt: "", stock: initialStock || "0", sku: "", image: "" };
    onChange({ ...drafts, [key]: { ...fallback, ...drafts[key], [field]: value } });
  };
  const fillAll = () => {
    const next = { ...drafts };
    combos.forEach(({ key }) => { next[key] = { price: basePrice, compareAt: "", stock: initialStock || "0", sku: next[key]?.sku || "", image: next[key]?.image || "" }; });
    onChange(next);
  };
  return <section className="sm:col-span-2 mt-6 border border-[#dcd5cc] bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-medium">Цени и наличности по варианти</h3><p className="mt-2 max-w-2xl text-xs leading-6 text-neutral-500">Всеки цвят и размер може да има собствена цена, намаление, SKU, снимка и наличност. Оставете цена празна, за да се използва основната цена.</p></div>
      <button type="button" onClick={fillAll} className="inline-flex items-center gap-2 border border-black/15 px-3 py-2 text-xs"><Copy size={14}/> Копирай основната цена</button>
    </div>
    {combos.length > 80 ? <p className="mt-6 border border-red-200 p-4 text-sm text-red-700">Твърде много комбинации (максимум 80). Намалете броя цветове или размери.</p> :
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[780px] text-left text-xs"><thead><tr className="border-b border-black/10 text-[10px] uppercase tracking-wider text-neutral-500"><th className="px-2 py-3">Вариант</th><th className="px-2 py-3">Цена €</th><th className="px-2 py-3">Стара цена €</th><th className="px-2 py-3">Наличност</th><th className="px-2 py-3">SKU / артикул №</th><th className="px-2 py-3">Снимка URL</th></tr></thead><tbody>{combos.map(({ color, size, key }) => {
      const item = drafts[key];
      const base = Number(basePrice.replace(",", "."));
      const display = item?.price ? Number(item.price.replace(",", ".")) : base;
      return <tr key={key} className="border-b border-black/[.07] align-middle"><td className="whitespace-nowrap px-2 py-3 font-medium">{color} / {size}<div className="mt-1 text-[10px] font-normal text-neutral-500">{Number.isFinite(display) ? formatPrice(Math.round(display*100)) : "—"}</div></td>
        <td className="px-2 py-3"><input type="number" min="0.01" step="0.01" placeholder={basePrice || "Цена"} aria-label={`Цена за ${color} ${size}`} className="field-input min-w-[98px]" value={item?.price ?? ""} onChange={(e) => edit(key, "price", e.target.value)}/></td>
        <td className="px-2 py-3"><input type="number" min="0.01" step="0.01" placeholder="По желание" aria-label={`Стара цена за ${color} ${size}`} className="field-input min-w-[105px]" value={item?.compareAt ?? ""} onChange={(e) => edit(key, "compareAt", e.target.value)}/></td>
        <td className="px-2 py-3"><input type="number" min="0" max="100000" step="1" aria-label={`Наличност за ${color} ${size}`} className="field-input w-[91px]" value={item?.stock ?? initialStock} onChange={(e) => edit(key, "stock", e.target.value)}/></td>
        <td className="px-2 py-3"><input aria-label={`SKU за ${color} ${size}`} placeholder="SKU" maxLength={80} className="field-input min-w-[120px]" value={item?.sku ?? ""} onChange={(e) => edit(key, "sku", e.target.value)}/></td>
        <td className="px-2 py-3"><input type="url" aria-label={`Снимка за ${color} ${size}`} placeholder="https://..." className="field-input min-w-[170px]" value={item?.image ?? ""} onChange={(e) => edit(key, "image", e.target.value)}/></td>
      </tr>;
    })}</tbody></table></div>}
    <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-neutral-500"><Info size={16} className="mt-1 shrink-0"/>При покупка цената на избрания вариант се проверява отново на сървъра. Старата цена е само за визуализация.</p>
  </section>;
}
