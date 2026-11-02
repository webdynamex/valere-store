import type { Product, Variant } from '@/types/store';

/** The product price is the fallback for legacy products and non-overridden variants. */
export function variantPriceCents(product: Product, variant: Variant): number {
  return Number.isSafeInteger(variant.priceCents) && (variant.priceCents ?? 0) > 0
    ? variant.priceCents! : product.priceCents;
}

export function variantCompareAtCents(product: Product, variant: Variant): number | undefined {
  const effective = variantPriceCents(product, variant);
  const compare = variant.compareAtCents ?? product.compareAtCents;
  return Number.isSafeInteger(compare) && (compare ?? 0) > effective ? compare : undefined;
}

export function productPriceSummary(product: Product) {
  const available = product.variants.filter((variant) => variant.stock > 0);
  const candidates = available.length ? available : product.variants;
  if (!candidates.length) return { from: product.priceCents, to: product.priceCents, compareAt: product.compareAtCents, discounted: !!(product.compareAtCents && product.compareAtCents > product.priceCents) };
  const prices = candidates.map((v) => variantPriceCents(product, v));
  const from = Math.min(...prices);
  const to = Math.max(...prices);
  const cheapest = candidates.find((v) => variantPriceCents(product, v) === from)!;
  return { from, to, compareAt: variantCompareAtCents(product, cheapest), discounted: candidates.some((v) => !!variantCompareAtCents(product, v)) };
}
