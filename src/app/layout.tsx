import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";

const siteFont = Montserrat({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-valere",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "VALÉRE — Curated Fashion", template: "%s | VALÉRE" },
  description: "VALÉRE — внимателно подбрани дрехи, корсети и аксесоари за индивидуален стил.",
  robots: { index: false, follow: false }, // Remove after the store is ready for public launch.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bg"><body className={siteFont.variable}><StoreProvider><Header/><main className="min-h-[50vh]">{children}</main><Footer/><CartDrawer/></StoreProvider></body></html>;
}
