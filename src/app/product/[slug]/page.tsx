import type { Metadata } from "next";
import { ProductDetails } from "@/components/product-details";

export const metadata: Metadata = { title: "Продукт" };
export default function ProductPage() { return <ProductDetails/>; }
