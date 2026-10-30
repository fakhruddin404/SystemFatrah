# Project Structure

```
app/                     # Next.js App Router routes
├── layout.tsx           # root layout: loads fonts, wraps app in LanguageProvider + CartProvider, mounts CartDrawer
├── page.tsx             # homepage; async Server Component that fetches products and composes sections
├── globals.css          # global styles / design tokens
├── craft/page.tsx       # "Our Craft" page
└── products/[id]/page.tsx  # dynamic product detail page (uses generateStaticParams + generateMetadata)
components/              # presentational + interactive UI components
├── Header.tsx           # nav, language toggle, cart button ('use client')
├── Hero.tsx
├── Showcase.tsx         # auto-advancing product slider (receives slides as props)
├── Collection.tsx       # product grid (receives products as props)
├── Banner.tsx
├── Footer.tsx
├── ProductActions.tsx   # qty selector + add-to-cart + WhatsApp order ('use client')
└── CartDrawer.tsx       # slide-out cart + WhatsApp checkout ('use client')
context/                 # React Context providers for global state
├── LanguageContext.tsx  # EN/BM state + translation dictionary + useLanguage hook
└── CartContext.tsx      # cart state + useCart hook
hooks/                   # reusable React hooks
└── useScrollReveal.ts   # IntersectionObserver-based scroll reveal
lib/                     # framework-agnostic utilities / data access
└── csv-parser.ts        # Product type + fetchProducts/fetchProductById
```

## Where things go

- **Routes / pages** → `app/`. Keep pages as async Server Components that fetch data and pass it down as props.
- **UI components** → `components/`. Default export, PascalCase filename matching the component name.
- **Shared state** → `context/`, exposed through a typed hook.
- **Reusable hooks** → `hooks/`.
- **Data access & pure utilities** → `lib/`. The `Product` interface is the canonical data shape and lives in `lib/csv-parser.ts`.

## Data flow

Server Components in `app/` call `lib/csv-parser.ts` to load products, then pass data down to components as props. Client components read interactive state through `useCart` / `useLanguage` rather than prop drilling.
