# VALÉRE — Custom Fashion Store

Custom Bulgarian fashion boutique using **Next.js 16 App Router, TypeScript, Tailwind CSS v4, Vercel and Firebase**.

## Included in this first version

- Responsive editorial home page and navigation
- Product catalog, search, categories, sorting, new arrivals and favorites
- Product details, sizes, colors, stock indicator
- Cart and checkout UI
- Firebase Firestore product read with protected admin editor
- Firebase Storage photo upload from admin
- Firebase Auth email/password admin login
- Admin product editing, per-variant stock changes and order status management
- Server-side COD order endpoint that **rechecks prices and stock** and decrements stock in a Firestore transaction
- Secure-by-default configuration: checkout is disabled until explicitly enabled

**Not ready for a real public launch**: shipping API integration, shipping-rate calculation, payment processing, customer transactional emails, legal/policy pages, antifraud/rate limiting, final stock/product photos, SEO activation, production QA. Only the COD flow is scaffolded. Do not enable live orders until these are addressed.

## 1. Start locally

Required: Node.js 20.9+ (Node 22 LTS recommended).

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env.local`.

Open <http://localhost:3000>.

With no Firebase config, the storefront uses **explicit demo products** and checkout cannot submit orders. All example images/prices are placeholders, not products from VALÉRE inventory.

## 2. Firebase project

1. Firebase Console → Add project → create a Web app.
2. Enable **Firestore** (production mode), **Authentication → Email/Password**, and **Storage**.
3. Copy the Web app configuration to `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local` and Vercel environment variables.
4. Deploy Firestore and Storage rules from `firestore.rules` and `storage.rules`. You can paste them in the Firebase Console Rules tabs, or deploy with Firebase CLI (`firebase deploy --only firestore:rules,storage`). Check your Storage bucket name matches Firebase settings.
5. Firebase Auth → Users → create an admin Email/Password user.
6. Copy that user's `UID`. In Firestore Console create collection **`admins`** and a document whose ID is **exactly this UID**, e.g. `{ "role": "owner" }`. Never allow users to add themselves as admins.
7. Sign in at `/admin`; add real products and photos there. Set their status to `published`.

### Product document schema

`products/{productId}`

```json
{
  "name": "Sample shirt",
  "slug": "sample-shirt",
  "description": "Sample description",
  "subtitle": "Minimal essential",
  "category": "clothing",
  "priceCents": 4500,
  "images": ["https://example.com/photo.jpg"],
  "variants": [{"key":"Black|M", "color":"Black", "size":"M", "stock":3}],
  "status": "published",
  "featured": true
}
```

Supported categories: `clothing`, `corsets`, `accessories`, `eyewear`. **Prices are stored as integer euro cents**.

### Firebase Admin SDK (server only)

For order creation, generate a **service account key** in Firebase Console → Project Settings → Service Accounts. Copy project ID, client email, and private key into:

```text
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Add these ONLY to local `.env.local` and the Vercel dashboard, **never to Git or variables prefixed with NEXT_PUBLIC**.

## 3. GitHub + Vercel

1. Create an empty GitHub repository, e.g. `valere-store`.
2. Unpack this project into the repo folder (keep `package.json` in the repo root).
3. Commit and push:

```bash
git init
git add .
git commit -m "Initial VALÉRE store"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin main
```

4. Vercel → Add New Project → import GitHub repo; framework auto-detects Next.js.
5. Set Firebase variables in Vercel → Project → Settings → Environment Variables.
6. Redeploy after environment variable changes.
7. Do NOT set live-order flags to `true` until the checklist below is complete.

## 4. Pre-launch checklist

- [ ] Replace every demo image and demo item with real VALÉRE product material.
- [ ] Confirm product prices, colors, sizes and stock.
- [ ] Add real business identity and contact details.
- [ ] Publish verified delivery, return, Terms and Privacy/Cookies pages compliant with applicable laws.
- [ ] Integrate Econt/Speedy APIs and calculate actual shipping prices; validate addresses.
- [ ] Enable customer emails and admin notifications.
- [ ] Add payment processor when chosen and validate server-side payment webhooks.
- [ ] Add abuse prevention (rate limiting, bot protection), logging, backups and admin audit trail.
- [ ] Test all flows including sold-out stock, simultaneous purchases, delivery failure, cancellations and stock restoration.
- [ ] Add analytics/cookie-consent as needed.
- [ ] Turn on indexing by removing the `robots: { index: false }` directive in `src/app/layout.tsx`.
- [ ] Only then set **BOTH** `NEXT_PUBLIC_ENABLE_LIVE_ORDERS=true` and `ENABLE_LIVE_ORDERS=true` in Vercel and redeploy.

## Notes

`/api/orders` ignores customer-supplied price. It loads each real product and variant in a Firebase Admin Firestore transaction, checks published status and stock, recomputes the total and updates stock atomically. It does not collect money, quote shipping costs, send emails or automatically restore stock when cancelling an order. It requires a real operational process before enabling.

The checkout page includes a checkbox but the final legal documents have not yet been supplied. Keep live checkout disabled until legal review and publication.

### Development scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Backoffice phase 1 (categories, collections, storefront, customers)

The admin at `/admin` now includes Overview, Products, Categories, Collections, Orders, Customers, Homepage, Shipping and Analytics. Existing admin login and product management are retained. Public shop categories, editorial sections and homepage product selections subscribe to Firestore.

**Important: after deploying this update, publish the latest `firestore.rules` AND `storage.rules` in the VALÉRE Firebase project.** The Vercel/GitHub deployment cannot deploy these Firebase rules by itself. Until you publish them, new collections, customer profiles, homepage settings and editorial photo uploads will fail with permission errors. The Storage rules require the Firebase Storage service account to have the cross-service IAM permission for Firestore `exists()` checks.

New Firestore paths:
- `categories/{slug}` – configurable category names/order/visibility; built-in categories appear until overridden
- `collections/{slug}` – editable title, image, products and published status
- `storefront/home` – homepage hero, story, curated product IDs and selected collections
- `settings/shipping` – admin-defined display rates for Econt/Speedy and free-shipping threshold, initially not enabled
- `customers/{uid}` – customer profile created on registration; read/update restricted to owner and admins
- `customerPrivate/{uid}` – private staff notes, accessible only to admins
- `orders/{orderId}` – server-created orders; authenticated customers may read only orders linked to their verified UID; admins see all

Customers can register and sign in at `/account`, edit their own contact information and review **new orders associated with a verified Firebase Auth ID token**. Guest checkouts and historical guest purchases cannot be automatically claimed by email. Email addresses cannot be used to impersonate customers. Order creation is still DISABLED until legal pages, shipping fulfilment and payments/notifications are operational. The admin can record manual shipping rates but these are informational previews, not carrier API quotes.

Set up Firebase Authentication → Email/Password and add `valere-store.vercel.app` in **Authentication → Settings → Authorized domains** if it is not already present. For any new admin, add `admins/{authUid}` manually via Firebase Console; users cannot grant themselves admin access. Never put Firebase service account private keys in the browser or GitHub repository.

Not yet implemented in this phase: staff invitations/multiple admin roles, discount redemption, carrier-label integrations and live delivery quotes, refunds, transactional emails, legal-policy content and publishing, card payments, verified payment reports, customer data export/deletion workflow, audit logs and production-grade fraud controls. The customer login and admin tabs are a functional foundation, not a promise that live checkout is ready.
