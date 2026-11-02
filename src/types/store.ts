export type Category = string;
export type ProductStatus = "draft" | "published";

export type Variant = {
  key: string;
  color: string;
  size: string;
  stock: number;
  sku?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  category: Category;
  priceCents: number;
  compareAtCents?: number;
  images: string[];
  variants: Variant[];
  status: ProductStatus;
  featured?: boolean;
  isNew?: boolean;
  createdAt?: unknown;
};

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  color: string;
  size: string;
  variantKey: string;
  quantity: number;
  isDemo: boolean;
};

export type OrderStatus = "new" | "confirmed" | "shipped" | "completed" | "cancelled";

export type Order = {
  id?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    postalCode: string;
    comment?: string;
  };
  delivery: "econt" | "speedy";
  payment: "cod";
  lines: Array<Pick<CartLine, "productId" | "variantKey" | "name" | "color" | "size" | "quantity" | "priceCents">>;
  subtotalCents: number;
  shippingCents: number | null;
  status: OrderStatus;
  customerUid?: string;
  createdAt?: unknown;
};
