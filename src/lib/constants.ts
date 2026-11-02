import type { Category } from "@/types/store";

export const STORE_NAME = "VALÉRE";
export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "clothing", label: "Дрехи" },
  { id: "corsets", label: "Корсети" },
  { id: "accessories", label: "Аксесоари" },
  { id: "eyewear", label: "Очила" },
];

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(cents / 100);
}

export function productTotalStock(variants: { stock: number }[]) {
  return variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0);
}
