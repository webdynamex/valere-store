import Link from "next/link";
import { Check } from "lucide-react";

export default function SuccessPage() {
  return <section className="section-wrap flex min-h-[65vh] flex-col items-center justify-center py-24 text-center"><span className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#79766e]"><Check size={34} strokeWidth={1.2}/></span><p className="eyebrow">THANK YOU FOR CHOOSING VALÉRE</p><h1 className="display-serif mt-5 text-[45px] sm:text-[72px]">Thank <em>you.</em></h1><p className="mt-7 max-w-[470px] text-sm leading-8 text-neutral-600">Поръчката беше изпратена успешно. Екипът ще се свърже с вас за потвърждение и уточняване на доставката.</p><Link href="/shop" className="btn-dark mt-9">ОБРАТНО КЪМ МАГАЗИНА</Link></section>;
}
