export type CommerceCategory = {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  sortOrder: number;
};

export type CommerceCollection = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  productIds: string[];
  published: boolean;
  sortOrder: number;
};

export type HomepageConfig = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  heroButton: string;
  heroLink: string;
  collectionHeading: string;
  featuredCollectionIds: string[];
  featuredProductIds: string[];
  storyEyebrow: string;
  storyTitle: string;
  storyDescription: string;
  storyImage: string;
};

export type ShippingConfig = {
  econtCents: number;
  speedyCents: number;
  freeAboveCents: number;
  notice: string;
  enabled: boolean;
};

export const DEFAULT_CATEGORIES: CommerceCategory[] = [
  { id: 'clothing', name: 'Дрехи', description: '', image: '', active: true, sortOrder: 1 },
  { id: 'corsets', name: 'Корсети', description: '', image: '', active: true, sortOrder: 2 },
  { id: 'accessories', name: 'Аксесоари', description: '', image: '', active: true, sortOrder: 3 },
  { id: 'eyewear', name: 'Очила', description: '', image: '', active: true, sortOrder: 4 },
];

export const DEFAULT_COLLECTIONS: CommerceCollection[] = [
  { id: 'corset-edit', name: 'The corset edit', subtitle: 'CORSETS', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1100&q=85', productIds: [], published: true, sortOrder: 1 },
  { id: 'little-details', name: 'The little details', subtitle: 'ACCESSORIES', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1100&q=85', productIds: [], published: true, sortOrder: 2 },
];

export const DEFAULT_HOMEPAGE: HomepageConfig = {
  heroEyebrow: 'VALÉRE / NEW PERSPECTIVES',
  heroTitle: 'Wear your own\nstory.',
  heroDescription: 'Модата е лично изявление. Открий своя силует, настроение и увереност.',
  heroImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=90',
  heroButton: 'ОТКРИЙ КОЛЕКЦИЯТА',
  heroLink: '/shop',
  collectionHeading: 'Find your signature',
  featuredCollectionIds: ['corset-edit', 'little-details'],
  featuredProductIds: [],
  storyEyebrow: 'THE VALÉRE PHILOSOPHY',
  storyTitle: 'Not just clothes.\nA feeling.',
  storyDescription: 'VALÉRE е пространство за личен стил. За дрехите, които носиш по твоя начин. За детайлите, които те правят различна. За увереността да бъдеш себе си.',
  storyImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
};

export const DEFAULT_SHIPPING: ShippingConfig = {
  econtCents: 0,
  speedyCents: 0,
  freeAboveCents: 0,
  notice: 'Доставката ще бъде уточнена при потвърждение. Посочените тарифи са ориентировъчни, докато няма интеграция с куриерите.',
  enabled: false,
};

const translit: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: '', ю: 'yu', я: 'ya', ы: 'i', э: 'e', ё: 'yo',
};
export const slugifyCommerce = (value: string) => value.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').split('').map((ch) => translit[ch] ?? ch).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function mergedCategories(saved: CommerceCategory[]) {
  const map = new Map(DEFAULT_CATEGORIES.map((item) => [item.id, item]));
  for (const item of saved) map.set(item.id, item);
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function mergedCollections(saved: CommerceCollection[]) {
  const map = new Map(DEFAULT_COLLECTIONS.map((item) => [item.id, item]));
  for (const item of saved) map.set(item.id, item);
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
