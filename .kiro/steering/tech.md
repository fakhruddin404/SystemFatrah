# Tech Stack

## Core

- **Next.js 14** (App Router) with React 18
- **TypeScript 5** in `strict` mode
- **Tailwind CSS 3** for all styling (no CSS modules; global tokens in `tailwind.config.ts`)
- **Supabase** (PostgreSQL + Auth) for data and admin sign-in; **Cloudinary** for images
- **Zod 4** for validating admin input and seed data
- **Vitest** (unit, integration), **Playwright** (e2e), **fast-check** (property tests)

## Conventions

- Path alias `@/*` maps to the project root (e.g. `@/components/Header`, `@/lib/products`).
- **Server Components by default.** Only add `'use client'` when a file uses hooks, state, context, or browser APIs.
- Public data comes from `lib/products.ts` (pre-order) and `lib/ready-stock.ts`, which use the **anon** Supabase client (`lib/supabase/anon.ts`) with Next.js cache tags and fail soft (return `[]` / `undefined` and log, never throw). Ready-stock reads revalidate every 60 s; admin actions also call `revalidateTag`.
- **No service-role key in the deployed runtime.** Admin writes use the signed-in user's JWT (`lib/supabase/server.ts`, `@supabase/ssr`) and are enforced by RLS via the `admin_users` allowlist and `is_admin()`. Server Actions re-check `getAdmin()` and validate input with Zod (`lib/admin/schemas.ts`).
- Global state uses React Context providers (`LanguageContext`, `CartContext`), each exposing a typed hook (`useLanguage`, `useCart`) that throws if used outside its provider.
- Cart and message logic is pure and unit tested: `lib/cart-lines.ts`, `lib/whatsapp.ts`, `lib/money.ts`, `lib/pricing.ts`.
- Images: use `components/MediaImage.tsx` (not `next/image` directly). Only `res.cloudinary.com/<NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME>/…` is optimized (`next.config.mjs`, `lib/media.ts`); other https URLs render `unoptimized`.
- `CLOUDINARY_URL` holds an API secret: read it only in `lib/cloudinary-server.ts` (imports `server-only`). Uploads go browser → Cloudinary using a server-issued signature (`lib/cloudinary-signing.ts` is the pure, tested part).
- Brand name and contact links come from `lib/site.ts` (`SITE_NAME`, `whatsappUrl()`, `SOCIAL_LINKS`). Never hardcode them.
- Fonts via `next/font/google` (Fraunces `--font-serif`, Work Sans `--font-sans`) in `app/layout.tsx`.
- Design tokens (`sand`, `warm-white`, `ink`, `ink-soft`, `maroon`, `maroon-deep`, `gold`, `ready`, `ready-deep`, `line`; `serif`/`sans`) live in `tailwind.config.ts`. Prefer these over arbitrary hex values. Cards are square-cornered with a hairline `ink` border; badges are `StatusBadge` (solid green "Ready Stock", outlined "Pre-Order").
- The language-toggle e2e test parses `context/LanguageContext.tsx` by regex: keep every dictionary entry a plain `{ en: '…', ms: '…' }` literal.

## Environment

See `.env.example` and `docs/deployment.md`. Two Supabase projects: `fatrah-staging` (previews, tests, sample data) and `fatrah-prod`. `SUPABASE_TARGET` (`staging` | `production`) must be set locally for `npm run seed` and `npm run test:integration`, which refuse to run without it.

- Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_WHATSAPP_NUMBER`
- Server-only: `CLOUDINARY_URL`, `CLOUDINARY_UPLOAD_FOLDER` (optional)
- Local only, never in Vercel or GitHub: `SUPABASE_SERVICE_ROLE_KEY`

## Common Commands

```bash
npm install                # install dependencies
npm run dev                # dev server at http://localhost:3000 (run manually)
npm run build              # production build
npm run lint               # next lint
npm run typecheck          # tsc --noEmit
npm run test:unit          # Vitest, offline
npm run test:integration   # Vitest against fatrah-staging (needs SUPABASE_TARGET=staging)
npm run test:e2e           # Playwright (PLAYWRIGHT_BASE_URL selects the target)
npm run seed               # seed products (+ sizes and sample bags on staging)
```

Database changes are SQL files in `supabase/migrations/` (apply to staging first, then prod). Migrations that would break the previous deployment live in `supabase/deferred/` until rollout is verified.
