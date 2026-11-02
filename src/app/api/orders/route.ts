import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import type { Product, Variant } from "@/types/store";
import { variantPriceCents } from "@/lib/pricing";

export const runtime = "nodejs";

const failed = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const str = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
const validQty = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 1 && Number(v) <= 20;

type RawLine = { productId: string; variantKey: string; quantity: number };

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_LIVE_ORDERS !== "true") return failed("Приемането на поръчки все още не е активирано.", 503);
  const db = getAdminDb();
  if (!db) return failed("Магазинът не е конфигуриран за поръчки.", 503);
  if (!request.headers.get("content-type")?.includes("application/json")) return failed("Невалиден формат.", 415);

  let payload: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 15000) return failed("Твърде голяма поръчка.", 413);
    payload = JSON.parse(raw) as Record<string, unknown>;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return failed("Невалидна поръчка.");
  } catch { return failed("Невалидни данни за поръчка."); }

  const customerInput = payload.customer as Record<string, unknown> | undefined;
  if (!customerInput || typeof customerInput !== "object" || Array.isArray(customerInput)) return failed("Липсват данни за контакт.");
  const customer = {
    firstName: str(customerInput.firstName, 70), lastName: str(customerInput.lastName, 70),
    email: str(customerInput.email, 150).toLowerCase(), phone: str(customerInput.phone, 30),
    city: str(customerInput.city, 100), address: str(customerInput.address, 250),
    postalCode: str(customerInput.postalCode, 15), comment: str(customerInput.comment, 500),
  };
  if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone || !customer.city || !customer.address) return failed("Попълнете задължителните полета.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return failed("Невалиден имейл.");
  if (!/^[+\d()\-\s]{7,30}$/.test(customer.phone)) return failed("Невалиден телефон.");
  const delivery = payload.delivery === "speedy" ? "speedy" : payload.delivery === "econt" ? "econt" : null;
  if (!delivery || payload.payment !== "cod") return failed("Невалидна доставка или плащане.");
  // Link history only after verifying Firebase Auth identity, never by an email supplied in JSON.
  let customerUid: string | null = null;
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const bearer = /^Bearer ([\w.-]+)$/.exec(authorization);
    if (!bearer) return failed("Невалидна сесия на клиента.", 401);
    try {
      const decoded = await getAdminAuth()?.verifyIdToken(bearer[1], true);
      if (!decoded || !decoded.email || decoded.email.toLowerCase() !== customer.email) return failed("Имейлът на поръчката трябва да съвпада с клиентския профил.", 403);
      customerUid = decoded.uid;
    } catch { return failed("Клиентската сесия е изтекла. Влезте отново.", 401); }
  }
  if (!Array.isArray(payload.lines) || payload.lines.length < 1 || payload.lines.length > 15) return failed("Добавете валидни продукти.");
  const rawLines: RawLine[] = [];
  const used = new Set<string>();
  for (const value of payload.lines) {
    if (!value || typeof value !== "object") return failed("Невалиден продукт.");
    const line = value as Record<string, unknown>;
    const productId = str(line.productId, 150);
    const variantKey = str(line.variantKey, 150);
    if (!productId || !variantKey || !validQty(line.quantity) || productId.startsWith("demo-")) return failed("Продуктът не може да се поръча.");
    const key = `${productId}::${variantKey}`;
    if (used.has(key)) return failed("Повтарящ се продукт в поръчката.");
    used.add(key);
    rawLines.push({ productId, variantKey, quantity: Number(line.quantity) });
  }

  try {
    const orderRef = db.collection("orders").doc();
    const result = await db.runTransaction(async (tx) => {
      const byProduct = new Map<string, RawLine[]>();
      for (const line of rawLines) byProduct.set(line.productId, [...(byProduct.get(line.productId) ?? []), line]);
      const refs = [...byProduct.keys()].map((id) => db.collection("products").doc(id));
      // ALL reads happen before any transaction writes.
      const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
      const shippingSnap = await tx.get(db.collection("settings").doc("shipping"));
      const updates: Array<{ ref: (typeof refs)[number]; variants: Variant[] }> = [];
      const orderLines: Array<Record<string, string | number>> = [];
      let subtotalCents = 0;
      for (let i = 0; i < refs.length; i++) {
        const snapshot = snapshots[i];
        if (!snapshot.exists) throw new Error("Продуктът вече не е наличен.");
        const product = snapshot.data() as Product;
        if (product.status !== "published" || !Number.isSafeInteger(product.priceCents) || product.priceCents < 0) throw new Error("Продуктът не може да се поръча.");
        const variants = (product.variants ?? []).map((variant) => ({ ...variant }));
        for (const line of byProduct.get(snapshot.id) ?? []) {
          const matching = variants.find((variant) => variant.key === line.variantKey);
          if (!matching || matching.stock < line.quantity) throw new Error(`Недостатъчна наличност за ${product.name}.`);
          const unitPrice = variantPriceCents(product, matching);
          if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0 || unitPrice > 100000000) throw new Error("Невалидна цена за избрания вариант.");
          matching.stock -= line.quantity;
          subtotalCents += unitPrice * line.quantity;
          orderLines.push({ productId: snapshot.id, variantKey: matching.key, name: product.name, color: matching.color, size: matching.size, quantity: line.quantity, priceCents: unitPrice });
        }
        updates.push({ ref: refs[i], variants });
      }
      if (subtotalCents > 1_000_000_00) throw new Error("Твърде голяма поръчка.");
      const shipping = shippingSnap.exists ? shippingSnap.data() : null;
      const price = delivery === "speedy" ? shipping?.speedyCents : shipping?.econtCents;
      const freeAbove = shipping?.freeAboveCents;
      const shippingCents = shipping?.enabled && Number.isSafeInteger(price) && price >= 0
        ? (Number.isSafeInteger(freeAbove) && freeAbove > 0 && subtotalCents >= freeAbove ? 0 : price as number)
        : null;
      for (const update of updates) tx.update(update.ref, { variants: update.variants, updatedAt: FieldValue.serverTimestamp() });
      tx.create(orderRef, {
        customer, ...(customerUid ? { customerUid } : {}), delivery, payment: "cod", lines: orderLines,
        subtotalCents, shippingCents, status: "new",
        createdAt: FieldValue.serverTimestamp(), source: "web",
      });
      return { orderId: orderRef.id };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Грешка при запазване на поръчката.";
    // Avoid exposing unexpected infrastructure errors to buyers.
    if (message.includes("Продукт") || message.includes("наличност") || message.includes("поръчка")) return failed(message, 409);
    console.error("Order error", error);
    return failed("Не успяхме да запазим поръчката. Опитайте отново.", 500);
  }
}
