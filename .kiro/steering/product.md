# Product

FATRAH is a bilingual (English / Bahasa Melayu) e-commerce catalog for handcrafted Terengganu batik bags. Each piece is made to order by Malaysian artisans, with a 2–4 week lead time.

## What it does

- Showcases a product collection on a marketing-style homepage (hero, auto-advancing showcase slider, product grid, banner, footer).
- Provides individual product detail pages with related-product suggestions.
- Lets shoppers add items to a client-side cart and place orders through WhatsApp (no checkout/payment backend). The cart compiles a formatted message and opens a `wa.me` link.
- Supports a site-wide EN / BM language toggle.

## Key conventions

- Ordering is WhatsApp-based, not a traditional checkout. The business WhatsApp number lives in component constants (`WHATSAPP_NUMBER`).
- All user-facing copy must be available in both English (`en`) and Bahasa Melayu (`ms`). Static UI strings go in the translation dictionary; product descriptions carry both `descriptionEn` and `descriptionMs`.
- Prices are strings formatted like `RM 480` (Malaysian Ringgit).
- Product data is sourced from a Google Sheets CSV (with a hardcoded fallback), not a database.
