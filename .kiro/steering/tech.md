# Tech Stack

## Core

- **Next.js 14** (App Router) with React 18
- **TypeScript 5** in `strict` mode
- **Tailwind CSS 3** for all styling (no CSS modules; global tokens in `app/globals.css`)
- **PapaParse** for parsing product CSV data

## Conventions

- Path alias `@/*` maps to the project root (e.g. `@/components/Header`, `@/lib/csv-parser`).
- **Server Components by default.** Only add `'use client'` when a file uses hooks, state, context, or browser APIs (Header, CartDrawer, ProductActions, both context providers).
- Data fetching happens in async Server Components via `fetchProducts()` / `fetchProductById()` from `lib/csv-parser.ts`. Remote CSV is fetched with `next: { revalidate: 3600 }`.
- Global state uses React Context providers (`LanguageContext`, `CartContext`), each exposing a typed hook (`useLanguage`, `useCart`) that throws if used outside its provider. Follow this pattern for new shared state.
- Images use `next/image`. Remote image hosts must be whitelisted in `next.config.mjs` (`images.remotePatterns`) — currently `images.unsplash.com`.
- Fonts are loaded via `next/font/google` (Fraunces for `--font-serif`, Work Sans for `--font-sans`) in `app/layout.tsx`.
- Design tokens (colors `sand`, `warm-white`, `ink`, `ink-soft`, `maroon`, `maroon-deep`, `gold`, `line`; font families `serif`/`sans`) are defined in `tailwind.config.ts`. Prefer these named utilities over arbitrary hex values.

## Environment

- `GOOGLE_SHEETS_CSV_URL` — optional. When set, product data is fetched from this published Google Sheet CSV; otherwise the hardcoded fallback in `lib/csv-parser.ts` is used.

## Common Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:3000 (run manually)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # run next lint
```

There is no test suite configured.
