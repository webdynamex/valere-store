import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";

const displayFont = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-valere-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-valere-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "VALÉRE — Curated Fashion", template: "%s | VALÉRE" },
  description: "VALÉRE — внимателно подбрани дрехи, корсети и аксесоари за индивидуален стил.",
  robots: { index: false, follow: false }, // Remove after the store is ready for public launch.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bg"><body className={`${displayFont.variable} ${bodyFont.variable}`}><StoreProvider><Header/><main className="min-h-[50vh]">{children}</main><Footer/><CartDrawer/></StoreProvider></body></html>;
}
