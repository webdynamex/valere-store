import type { Product } from "@/types/store";

// DEMO ONLY. Replace with the actual VALÉRE photos, product information and prices
// via the Admin panel before launching. Demo products CANNOT be ordered.
const photo = (id: string, width = 920) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const demoProducts: Product[] = [
  {
    id: "demo-atelier-blazer", slug: "atelier-blazer", name: "ATELIER BLAZER",
    subtitle: "Structure & softness", description: "Демо продукт. Класическо сако с изчистен силует и елегантно присъствие. Реалните снимки, описания и цени ще бъдат добавени от VALÉRE.",
    category: "clothing", priceCents: 7900, compareAtCents: 9800,
    images: [photo("photo-1483985988355-763728e1935b"), photo("photo-1539109136881-3be0616acf4b")],
    variants: [{ key: "Black|S", color: "Black", size: "S", stock: 4 }, { key: "Black|M", color: "Black", size: "M", stock: 3 }, { key: "Black|L", color: "Black", size: "L", stock: 2 }],
    status: "published", featured: true, isNew: true,
  },
  {
    id: "demo-amour-corset", slug: "amour-corset", name: "AMOUR CORSET",
    subtitle: "Made to be seen", description: "Демо продукт. Корсет с модерен и женствен силует. Сменете примерните данни с действителните налични корсети на VALÉRE.",
    category: "corsets", priceCents: 4900,
    images: [photo("photo-1525507119028-ed4c629a60a3"), photo("photo-1483985988355-763728e1935b")],
    variants: [{ key: "Cream|S", color: "Cream", size: "S", stock: 3 }, { key: "Cream|M", color: "Cream", size: "M", stock: 2 }],
    status: "published", featured: true, isNew: true,
  },
  {
    id: "demo-noir-shirt", slug: "noir-shirt", name: "NOIR SHIRT",
    subtitle: "The effortless edit", description: "Демо продукт. Ефектна риза с изчистени линии. Примерните цени и изображения не са реална търговска оферта.",
    category: "clothing", priceCents: 4500,
    images: [photo("photo-1591047139829-d91aecb6caea"), photo("photo-1551488831-00ddcb6c6bd3")],
    variants: [{ key: "Black|S", color: "Black", size: "S", stock: 3 }, { key: "Black|M", color: "Black", size: "M", stock: 5 }],
    status: "published", featured: true,
  },
  {
    id: "demo-sculpt-trousers", slug: "sculpt-trousers", name: "SCULPT TROUSERS",
    subtitle: "Modern essentials", description: "Демо продукт. Прав панталон за небрежно елегантен силует.",
    category: "clothing", priceCents: 5900,
    images: [photo("photo-1509631179647-0177331693ae")],
    variants: [{ key: "Beige|S", color: "Beige", size: "S", stock: 2 }, { key: "Beige|M", color: "Beige", size: "M", stock: 3 }],
    status: "published", featured: true,
  },
  {
    id: "demo-icon-sunglasses", slug: "icon-sunglasses", name: "ICON SUNGLASSES",
    subtitle: "The finishing touch", description: "Демо продукт. Слънчеви очила с модерен силует.",
    category: "eyewear", priceCents: 2400,
    images: [photo("photo-1511499767150-a48a237f0083")],
    variants: [{ key: "Black|One Size", color: "Black", size: "One Size", stock: 5 }],
    status: "published", isNew: true,
  },
  {
    id: "demo-everyday-bag", slug: "everyday-bag", name: "EVERYDAY BAG",
    subtitle: "Carry your story", description: "Демо продукт. Чанта за всекидневна употреба.",
    category: "accessories", priceCents: 3900,
    images: [photo("photo-1548036328-c9fa89d128fa")],
    variants: [{ key: "Brown|One Size", color: "Brown", size: "One Size", stock: 2 }],
    status: "published",
  },
];

export const isDemoProduct = (productId: string) => productId.startsWith("demo-");
