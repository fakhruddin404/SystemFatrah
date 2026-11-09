# Project Structure

```
app/                         # Next.js App Router routes
├── layout.tsx               # root layout: fonts, metadata template, LanguageProvider + CartProvider, CartDrawer
├── page.tsx                 # homepage: hero, showcase, "Ready now" strip, pre-order preview, banner
├── pre-order/page.tsx       # all pre-order designs
├── products/[id]/page.tsx   # pre-order detail (sizes, quantity, lead-time note)
├── ready-stock/page.tsx     # grid of available one-of-a-kind bags
├── ready-stock/[code]/      # bag detail (page.tsx) + friendly not-found.tsx
├── about/page.tsx           # Our Story (/craft redirects here via next.config.mjs)
├── actions/                 # public Server Actions (verify-ready-stock.ts)
└── admin/                   # protected admin (never indexed)
    ├── login/               # sign-in page + actions
    └── (protected)/         # layout calls requireAdmin(); dashboard, ready-stock/, products/, media/
components/                  # UI components (default export, PascalCase file name)
├── admin/                   # admin-only forms and lists (ReadyStockForm, ProductForm, MediaInput, ...)
├── ProductCard / PreorderCard / ReadyStockCard / StatusBadge / MediaImage
├── ProductPurchasePanel / ReadyStockActions / SizeSelector / QuantityStepper
└── Header / Hero / Showcase / Collection / ReadyNow / Banner / Footer / CartDrawer / AboutContent
content/about.ts             # typed EN/MS copy for the Our Story page
context/                     # LanguageContext (EN/BM dictionary) and CartContext
hooks/                       # useScrollReveal, useWhatsAppCheckout
lib/                         # framework-agnostic code
├── site.ts                  # brand name, WhatsApp number, social links, lead time
├── products.ts / ready-stock.ts   # data access (anon client, cached, fail-soft) + row mappers
├── cart-lines.ts / whatsapp.ts / money.ts / pricing.ts   # pure, unit-tested logic
├── media.ts / cloudinary-signing.ts / cloudinary-server.ts
├── admin/                   # auth.ts, schemas.ts (Zod), revalidate.ts, action-state.ts
└── supabase/                # anon.ts, server.ts (user session), database.types.ts
middleware.ts                # guards /admin/* and refreshes the session
supabase/migrations/         # additive SQL migrations; supabase/deferred/ holds post-rollout ones
scripts/                     # seed script, CSV seed data, target guard (local tooling only)
tests/{unit,integration,e2e}/
docs/deployment.md           # environments, secrets, rollout checklist
```

## Where things go

- **Routes / pages** → `app/`. Keep public pages as async Server Components that fetch data and pass it down as props.
- **UI components** → `components/`; admin-only ones in `components/admin/`.
- **Business logic** (pricing, cart, message building, validation) → pure functions in `lib/` with unit tests; keep components thin.
- **Copy** → short UI strings in the `LanguageContext` dictionary; long-form pages in `content/`; product text in the database (`description_en` / `description_ms`).
- **Admin writes** → Server Actions next to their pages (`actions.ts`): `getAdmin()` first, Zod validation, then the Supabase call, then `revalidateReadyStock()` / `revalidateProducts()`.

## Data flow

Public pages call `lib/products.ts` / `lib/ready-stock.ts`, then pass data to components as props. Client components read interactive state via `useCart` / `useLanguage`. Checkout builds the message in `lib/whatsapp.ts`; before opening WhatsApp, `useWhatsAppCheckout` calls `verifyReadyStock` so a bag that just sold is dropped. Admin changes go through Server Actions under the user's session, are enforced by RLS, and invalidate the cache tags the public pages use.
