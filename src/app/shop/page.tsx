import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopContent } from "@/components/shop-content";

export const metadata: Metadata = { title: "Колекция" };

export default function ShopPage() {
  return <Suspense fallback={<div className="section-wrap py-24 text-center">Зареждане на колекцията...</div>}><ShopContent/></Suspense>;
}
