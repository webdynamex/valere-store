"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Truck } from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatPrice } from "@/lib/constants";

const liveOrdersEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVE_ORDERS === "true";
const inputClass = "field-input";

export default function CheckoutPage() {
  const { cart, subtotalCents, clearCart } = useStore();
  const router = useRouter();
  const [customer, setCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "", city: "", address: "", postalCode: "", comment: "" });
  const [delivery, setDelivery] = useState<"econt" | "speedy">("econt");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const demoInCart = cart.some((line) => line.isDemo);
  const ready = liveOrdersEnabled && !demoInCart && cart.length > 0;
  const change = (field: keyof typeof customer, value: string) => setCustomer((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending || !acceptTerms) return;
    setPending(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, delivery, payment: "cod", lines: cart.map(({ productId, variantKey, quantity }) => ({ productId, variantKey, quantity })) }) });
      const json = await response.json() as { orderId?: string; error?: string };
      if (!response.ok || !json.orderId) throw new Error(json.error || "Грешка при поръчката.");
      clearCart();
      router.replace(`/order/success?ref=${encodeURIComponent(json.orderId)}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Грешка при поръчката."); }
    finally { setPending(false); }
  }

  return <div className="section-wrap pb-28 pt-12 sm:pt-20"><Link href="/cart" className="mb-10 inline-flex items-center gap-2 text-xs tracking-wide"><ArrowLeft size={15}/> ОБРАТНО КЪМ КОЛИЧКАТА</Link><p className="eyebrow">FINAL STEP</p><h1 className="display-serif mb-11 mt-3 text-[45px] sm:text-[62px]">Checkout<span className="italic">.</span></h1><div className="grid gap-14 lg:grid-cols-[1.4fr_.8fr] lg:gap-24"><form onSubmit={submit} className="space-y-10">
    {!ready && <div role="status" className="border border-[#c6b7a9] bg-[#f9f3eb] p-5 text-sm leading-7 text-[#645345]">{demoInCart ? "В количката има демонстрационни артикули. Те не могат да бъдат поръчани. Публикувайте реални продукти във Firebase." : "Магазинът е в режим на разработка. Приемането на реални поръчки ще бъде активирано след финалните настройки."}</div>}
    <section><h2 className="mb-6 font-serif text-2xl">Контактни данни</h2><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Име *<input required className={inputClass} value={customer.firstName} onChange={(e) => change("firstName", e.target.value)} autoComplete="given-name"/></label><label className="field-label">Фамилия *<input required className={inputClass} value={customer.lastName} onChange={(e) => change("lastName", e.target.value)} autoComplete="family-name"/></label><label className="field-label">Имейл *<input required type="email" className={inputClass} value={customer.email} onChange={(e) => change("email", e.target.value)} autoComplete="email"/></label><label className="field-label">Телефон *<input required type="tel" className={inputClass} value={customer.phone} onChange={(e) => change("phone", e.target.value)} autoComplete="tel"/></label></div></section>
    <section><h2 className="mb-6 font-serif text-2xl">Доставка</h2><div className="mb-5 grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer border p-4 text-sm ${delivery === "econt" ? "border-black" : "border-black/15"}`}><input type="radio" className="mr-3 accent-black" checked={delivery === "econt"} onChange={() => setDelivery("econt")}/>Еконт</label><label className={`cursor-pointer border p-4 text-sm ${delivery === "speedy" ? "border-black" : "border-black/15"}`}><input type="radio" className="mr-3 accent-black" checked={delivery === "speedy"} onChange={() => setDelivery("speedy")}/>Спиди</label></div><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Град *<input required className={inputClass} value={customer.city} onChange={(e) => change("city", e.target.value)} autoComplete="address-level2"/></label><label className="field-label">Пощенски код<input className={inputClass} value={customer.postalCode} onChange={(e) => change("postalCode", e.target.value)} autoComplete="postal-code"/></label><label className="field-label sm:col-span-2">Адрес или офис на куриера *<input required className={inputClass} value={customer.address} onChange={(e) => change("address", e.target.value)} autoComplete="street-address"/></label><label className="field-label sm:col-span-2">Коментар към поръчката<textarea rows={3} className={`${inputClass} resize-y`} value={customer.comment} onChange={(e) => change("comment", e.target.value)}/></label></div><p className="mt-4 flex items-center gap-2 text-xs leading-6 text-neutral-500"><Truck size={17}/> Доставката ще се уточни при потвърждение. Автоматичните тарифи още не са интегрирани.</p></section>
    <section><h2 className="mb-6 font-serif text-2xl">Плащане</h2><div className="flex items-center gap-3 border border-black p-5 text-sm"><span className="flex h-4 w-4 items-center justify-center rounded-full border border-black"><span className="h-2 w-2 rounded-full bg-black"/></span>Наложен платеж</div><p className="mt-3 text-xs text-neutral-500">Онлайн картовите плащания ще бъдат добавени в следващ етап.</p></section>
    <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-neutral-600"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1.5 accent-black"/>Потвърждавам, че съм запознат/а с условията на магазина и обработката на лични данни (документите предстои да бъдат публикувани преди старта).</label>
    {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <button disabled={!ready || !acceptTerms || pending} className="btn-dark w-full justify-center disabled:cursor-not-allowed disabled:bg-neutral-400">{pending ? "ИЗПРАЩАНЕ..." : "ПОТВЪРДИ ПОРЪЧКАТА"} <ArrowRight size={16}/></button>
    <p className="flex items-center justify-center gap-2 text-xs text-neutral-500"><LockKeyhole size={15}/> Данните се обработват през защитена връзка.</p>
    </form><aside className="h-fit bg-[#f2eee9] p-7 sm:p-9"><h2 className="font-serif text-3xl">Your selection</h2><div className="mt-7 space-y-4 border-b border-black/10 pb-6">{cart.length ? cart.map((line) => <div key={line.key} className="flex justify-between gap-4 text-xs"><span className="flex-1">{line.name} <span className="text-neutral-500">({line.size}, {line.color}) × {line.quantity}</span></span><span>{formatPrice(line.priceCents * line.quantity)}</span></div>) : <p className="text-sm text-neutral-500">Количката е празна.</p>}</div><div className="mt-7 flex justify-between text-sm"><span>Междинна сума</span><strong>{formatPrice(subtotalCents)}</strong></div><p className="mt-4 text-xs leading-6 text-neutral-500">+ доставка (след уточняване с куриера)</p></aside></div></div>;
}
