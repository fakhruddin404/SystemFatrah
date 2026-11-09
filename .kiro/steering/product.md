# Product

**Fat_Rahz Batik** is a bilingual (English / Bahasa Melayu) store for modern, elegant bags sewn from authentic Terengganu batik. We are craft-sewers, operating since 2014 with a workshop rooted in Terengganu. Bags are 100% handmade, with close attention to detail, and suit all ages (casual daily wear to classic elegance).

**Positioning rule:** we do **not** make the batik fabric. We choose authentic Terengganu batik and sew it into bags. Never claim that we draw wax, dye or boil cloth, and do not invent named artisans, locations, hardware or stitch details. The old "artisan / wax / dye" story was retired.

The user-facing brand name is exactly **Fat_Rahz Batik** (`SITE_NAME` in `lib/site.ts`). The repository and database keep the internal name `fatrah`.

## Two ways to buy

- **Ready Stock** (`/ready-stock`): each physical bag is one-of-a-kind with its own pattern and code (e.g. `RS-0042`). Quantity is always 1. Sold bags disappear from the public site immediately (RLS only exposes `status = 'available'`). Nothing is reserved when a customer taps WhatsApp; the admin marks the bag sold after confirming in chat.
- **Pre-order** (`/pre-order`, `/products/[id]`): designs sewn to order, with optional sizes and a quantity. Lead time is 2–4 weeks and is mentioned only for pre-order items.

## What it does

- Marketing homepage (hero, showcase, "Ready now" strip, pre-order preview, banner), pre-order and ready-stock catalogs, detail pages, and an Our Story page.
- Client-side cart with two line types (pre-order with size and quantity, ready-stock bag with code). The cart builds a message and opens a `wa.me` link. There is no payment gateway and **no delivery fee on the site**; the cart and message say the delivery fee is confirmed on WhatsApp.
- Site-wide EN / BM toggle.
- Protected admin (`/admin`) with full create, edit and delete for pre-order products (with sizes) and ready-stock bags, quick Available/Sold toggle, and images by pasted link or Cloudinary upload.

## Key conventions

- All user-facing copy must exist in both `en` and `ms`. Short strings go in the `LanguageContext` dictionary; the Our Story copy is in `content/about.ts`; product descriptions carry `descriptionEn` and `descriptionMs`.
- Prices are stored as `numeric(10,2)` ringgit (`price_myr`) and shown as `RM 480` / `RM 480.50` via `formatMyr`.
- Status badges: solid green **Ready Stock**, outlined **Pre-Order**.
- Look and feel: modern minimalist craft boutique, warm neutral tones, sharp high-contrast cards.
- Social links: Instagram `@beg_batik`, Threads `@beg_batik`, Shopee shop 162336477 (see `SOCIAL_LINKS`).
