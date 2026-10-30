# Requirements Document

## Introduction

This feature migrates the FATRAH batik-bag catalog from its current static architecture (Google Sheets CSV with a hardcoded fallback in `lib/csv-parser.ts`, no database, no media pipeline) onto a production-grade stack: Supabase (PostgreSQL) for data, Cloudinary for media delivery, and Vercel + GitHub for CI/CD with preview deployments.

The site remains a catalog-only, read-only public site with manual content updates. There is no admin UI, no Supabase Auth, and no runtime mutations. Product rows are edited by hand in the Supabase dashboard; product images are uploaded by hand in the Cloudinary dashboard and their delivery URL is pasted into the product row. The only automated write path in the whole system is a one-time seed script run locally (or during migration) that never runs in the deployed Vercel runtime.

These requirements are derived from the approved design document and are written so that each acceptance criterion maps cleanly onto the design's correctness properties (P1 contract stability, P2 read-only anon, P3 secret containment, P4 fail-soft reads, P5 preserved behavior) and the layered testing strategy. The migration deliberately preserves all visible product behavior: the WhatsApp (`wa.me`) ordering flow, the bilingual EN/MS UI, the made-to-order 2-4 week messaging, and the homepage section composition.

## Glossary

- **Catalog_Site**: The deployed, read-only FATRAH Next.js 14 application running on Vercel.
- **Data_Access_Layer**: The module `lib/products.ts` that reads products from Supabase behind the `fetchProducts()` / `fetchProductById()` / `mapRowToProduct()` functions.
- **Anon_Client**: The Supabase client created in `lib/supabase/anon.ts` using the public anon key, used for read-only queries in the deployed runtime.
- **Seed_Script**: The one-time migration script `scripts/seed-products.ts` that parses the existing CSV, validates rows, and upserts them into Supabase using the service-role key. Runs locally/at migration time only.
- **Product**: The TypeScript interface (`id`, `name`, `descriptionEn`, `descriptionMs`, `price`, `bg`, `gridClass`, `aspectClass`, `imageUrl`) that existing UI components consume. `price` is a display string such as `"RM 480"`.
- **ProductRow**: The snake_case shape of a row in the Supabase `products` table.
- **Products_Table**: The `public.products` table in Supabase PostgreSQL.
- **RLS**: Row Level Security policies on the `Products_Table`.
- **CI_CD_Pipeline**: The GitHub Actions + Vercel integration that builds, tests, previews, and deploys the application.
- **Mapping_Function**: `mapRowToProduct`, the pure function that converts a `ProductRow` into a `Product`.
- **Seed_Validator**: The Zod schema `SeedRowInput` that validates each parsed CSV row before upsert.

## Requirements

### Requirement 1: Supabase as authoritative product data source

**User Story:** As a maintainer, I want product data stored in Supabase PostgreSQL as the single source of truth, so that content is managed in a durable database instead of a Google Sheet and a hardcoded fallback.

#### Acceptance Criteria

1. THE Catalog_Site SHALL read all product data from the Products_Table in Supabase PostgreSQL.
2. THE Products_Table SHALL contain exactly five product rows with their original identifiers `p1`, `p2`, `p3`, `p4`, and `p5`.
3. WHEN the Data_Access_Layer reads products, THE Data_Access_Layer SHALL query the Products_Table through the Anon_Client.
4. THE Catalog_Site SHALL NOT read product data from `GOOGLE_SHEETS_CSV_URL` or from a hardcoded fallback CSV at runtime.
5. THE Data_Access_Layer SHALL NOT contain a hardcoded fallback CSV in its runtime module.

### Requirement 2: Data-access layer with preserved signatures

**User Story:** As a developer, I want `lib/products.ts` to replace `lib/csv-parser.ts` behind identical function signatures, so that existing call sites in pages do not change.

#### Acceptance Criteria

1. THE Data_Access_Layer SHALL expose a function `fetchProducts()` that returns a `Promise<Product[]>`.
2. THE Data_Access_Layer SHALL expose a function `fetchProductById(id)` that accepts a `string` id argument and returns a `Promise<Product | undefined>`.
3. THE Data_Access_Layer SHALL expose a pure function `mapRowToProduct(row)` that returns a `Product`.
4. WHEN `fetchProducts` reads the Products_Table, THE Data_Access_Layer SHALL return products ordered by `sort_order` in ascending order.
5. WHEN two or more products share the same `sort_order` value, THE Data_Access_Layer SHALL apply a deterministic secondary ordering by `id` in ascending order.
6. WHEN `fetchProductById` is called with an identifier that matches an existing row, THE Data_Access_Layer SHALL return the corresponding `Product`.
7. WHEN `fetchProductById` is called with an identifier that matches no row, THE Data_Access_Layer SHALL return `undefined`.
8. WHEN the Data_Access_Layer reads the Products_Table, THE Data_Access_Layer SHALL apply Next.js caching with a 3600-second revalidation interval matching the existing `csv-parser.ts` `revalidate` value, so repeated reads within that window are served without querying the database.

### Requirement 3: Stable Product contract

**User Story:** As a developer, I want the `Product` TypeScript contract preserved exactly, so that existing components render unchanged after the migration.

#### Acceptance Criteria

1. THE Product interface SHALL define exactly the fields `id`, `name`, `descriptionEn`, `descriptionMs`, `price`, `bg`, `gridClass`, `aspectClass`, and `imageUrl` with `string` types and no additional fields.
2. THE Product field `price` SHALL be a display string matching the pattern `^RM\s?\d+(\.\d{2})?$` (for example `"RM 480"`), consistent with Requirement 7.
3. WHEN the Mapping_Function converts a `ProductRow`, THE Mapping_Function SHALL set each camelCase `Product` field to the value of its corresponding snake_case `ProductRow` field.
4. WHEN the Mapping_Function converts a `ProductRow`, THE Mapping_Function SHALL copy the `price` and `image_url` values through to `price` and `imageUrl` with no trimming, reformatting, or coercion.
5. THE Mapping_Function SHALL NOT perform input or output side effects and SHALL NOT mutate its input row.

### Requirement 4: Products table schema and ordering

**User Story:** As a maintainer, I want a well-constrained `products` table with deterministic ordering, so that content is validated at the database level and displays in a predictable order.

#### Acceptance Criteria

1. THE Products_Table SHALL define the columns `id` of text type, `name`, `description_en`, `description_ms`, `price`, `bg`, `grid_class`, `aspect_class`, `image_url`, and `sort_order` of integer type.
2. THE Products_Table SHALL enforce a `NOT NULL` constraint on each of the nine columns `id`, `name`, `description_en`, `description_ms`, `price`, `bg`, `grid_class`, `aspect_class`, and `image_url`.
3. THE Products_Table SHALL use `id` as its primary key, preserving the text identifiers `p1` through `p5`.
4. THE Products_Table SHALL define a `sort_order` integer column with a default value that provides deterministic ordering of products.

### Requirement 5: Row Level Security for read-only anon access

**User Story:** As a security-conscious maintainer, I want Row Level Security to allow public reads and deny all writes through the anon key, so that a leaked anon key cannot mutate data.

#### Acceptance Criteria

1. THE Products_Table SHALL have Row Level Security enabled.
2. THE RLS SHALL include a policy that permits the `anon` role to `SELECT` on all rows of the Products_Table.
3. THE RLS SHALL NOT define any `INSERT`, `UPDATE`, or `DELETE` policy for the `anon` role.
4. WHEN a request authenticated by the `anon` role attempts to insert, update, or delete a row in the Products_Table, THE RLS SHALL deny the operation and the Products_Table contents SHALL remain unchanged.
5. WHEN a request authenticated by the `anon` role issues a `SELECT` against the Products_Table, THE RLS SHALL allow the read and return the matching rows.

### Requirement 6: One-time idempotent seed script

**User Story:** As a maintainer, I want a one-time seed script that parses the existing CSV, validates each row, and upserts by id, so that the migration is safe, repeatable, and local-only.

#### Acceptance Criteria

1. THE Seed_Script SHALL parse the existing CSV content using `papaparse`.
2. WHEN the Seed_Script processes a parsed CSV row, THE Seed_Script SHALL validate that row with the Seed_Validator before any write occurs.
3. IF a parsed CSV row fails Seed_Validator validation, THEN THE Seed_Script SHALL abort before writing any row, leave the Products_Table unchanged, and report the offending row `id` and field.
4. WHEN the Seed_Script writes validated rows, THE Seed_Script SHALL upsert them into the Products_Table using `id` as the conflict target so that non-key columns are inserted or overwritten.
5. WHEN the Seed_Script is executed two or more times with the same input, THE Seed_Script SHALL produce an identical Products_Table row count and identical row values with no duplicate rows.
6. THE Seed_Script SHALL be the only component that uses the `SUPABASE_SERVICE_ROLE_KEY`.
7. THE Seed_Script SHALL run locally or at migration time only and SHALL NOT execute in the deployed Vercel runtime.

### Requirement 7: Seed input validation schema

**User Story:** As a maintainer, I want each CSV row validated against a strict Zod schema before upsert, so that malformed content fails loudly instead of writing garbage rows.

#### Acceptance Criteria

1. THE Seed_Validator SHALL require `id`, `name`, `descriptionEn`, `descriptionMs`, `gridClass`, and `aspectClass` to each be a non-empty string with a trimmed length of at least 1, rejecting whitespace-only values.
2. THE Seed_Validator SHALL require `price` to match the pattern `^RM\s?\d+(\.\d{2})?$`.
3. THE Seed_Validator SHALL require `bg` to match the pattern `^#([0-9a-fA-F]{6})$`.
4. THE Seed_Validator SHALL require `imageUrl` to be a valid URL using the `https` scheme, aligning with the stored `https` URL in Requirement 8.
5. WHEN the Seed_Validator receives a row with an invalid `price`, invalid `bg` hex, non-URL `imageUrl`, or a missing required field, THE Seed_Validator SHALL reject the row and surface the field error.

### Requirement 8: Cloudinary media via delivery URL only

**User Story:** As a maintainer, I want product images delivered through Cloudinary URLs pasted into product rows, so that media is served from a CDN without any Cloudinary SDK or credentials in the application.

#### Acceptance Criteria

1. THE Products_Table SHALL store each product image as an `https://` delivery URL in the `image_url` column.
2. THE Catalog_Site configuration `next.config.mjs` SHALL whitelist the host `res.cloudinary.com` for remote images alongside `images.unsplash.com`.
3. WHEN a product detail or listing is rendered, THE Catalog_Site SHALL display the product image through `next/image` using the stored delivery URL.
4. THE Catalog_Site SHALL NOT include a Cloudinary SDK or any Cloudinary credential in its runtime.
5. IF a stored image URL uses a host that is not whitelisted in `next.config.mjs`, THEN THE Catalog_Site SHALL raise a `next/image` render error for the unconfigured host rather than serving the image.

### Requirement 9: Environment variable security and containment

**User Story:** As a security-conscious maintainer, I want a hard boundary between the browser-exposed anon key and the seed-only service-role key, so that no privileged secret ever reaches the browser bundle or the Vercel runtime.

#### Acceptance Criteria

1. THE Vercel runtime environment SHALL contain only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. THE Vercel runtime environment SHALL NOT contain `SUPABASE_SERVICE_ROLE_KEY` in any of the Production, Preview, and Development Vercel environments.
3. THE browser bundle shipped to clients SHALL NOT contain the service-role key or any Cloudinary secret.
4. THE `SUPABASE_SERVICE_ROLE_KEY` and the optional `GOOGLE_SHEETS_CSV_URL` SHALL be present only in `.env.local` for local and seed use.
5. THE repository SHALL include a committed `.env.example` that lists the required environment variable names without their values.
6. THE repository SHALL git-ignore `.env.local` so real secret values are never committed.
7. IF either `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is absent when the Anon_Client is created, THEN THE Anon_Client factory SHALL throw an error naming the missing variable and SHALL NOT return a client.
8. IF the `SUPABASE_SERVICE_ROLE_KEY` is absent when the Seed_Script runs, THEN THE Seed_Script SHALL fail loudly with an error naming the missing variable and SHALL exit with a non-zero status before performing any write.

### Requirement 10: Fail-soft reads

**User Story:** As a site visitor, I want the catalog to keep rendering even when the database read fails, so that transient backend issues never produce a broken page.

#### Acceptance Criteria

1. IF the read returns an error or the query rejects while `fetchProducts` queries the Products_Table, THEN THE Data_Access_Layer SHALL log the error and return an empty array.
2. IF a read error occurs while `fetchProductById` queries the Products_Table, THEN THE Data_Access_Layer SHALL log the error server-side and return `undefined`.
3. WHEN `fetchProductById` returns `undefined`, THE product detail page SHALL call `notFound()`.
4. THE Data_Access_Layer SHALL NOT throw to the page layer for an empty result or a transient read error.

### Requirement 11: Preserved WhatsApp ordering flow

**User Story:** As a site visitor, I want to place orders by being redirected to WhatsApp with a prefilled message, so that the existing conversion flow is unchanged by the migration.

#### Acceptance Criteria

1. WHEN a visitor selects "Order via WhatsApp", THE Catalog_Site SHALL build a `wa.me` URL that targets the configured WhatsApp number and whose URL-encoded prefilled text contains the product name and the selected quantity.
2. WHILE English is the selected language, THE Catalog_Site SHALL format the WhatsApp order message in English.
3. WHILE Malay is the selected language, THE Catalog_Site SHALL format the WhatsApp order message in Malay.
4. WHEN a visitor adds a product to the cart, THE Catalog_Site SHALL increase the cart drawer count by the added quantity and set the total equal to the sum of price multiplied by quantity across cart items.
5. IF the cart is empty WHEN a visitor selects "Order via WhatsApp", THEN THE Catalog_Site SHALL NOT open a `wa.me` URL.
6. THE Catalog_Site SHALL NOT introduce any checkout, payment entry, or payment processing.

### Requirement 12: Preserved bilingual and made-to-order presentation

**User Story:** As a bilingual site visitor, I want the full EN/MS experience and the made-to-order lead-time messaging preserved, so that the product presentation is identical to before the migration.

#### Acceptance Criteria

1. THE Catalog_Site SHALL leave no user-facing string untranslated in either English or Malay.
2. WHEN a visitor toggles the language, THE Catalog_Site SHALL switch every visible string between English and Malay, leaving no string in the previously selected language.
3. WHEN a product detail page is rendered, THE Catalog_Site SHALL display both the English and Malay descriptions and the made-to-order 2-4 week note.
4. THE Catalog_Site homepage SHALL compose the same marketing sections as before the migration, specifically the Header, Hero, Showcase, Collection, Banner, and Footer sections.
5. THE product detail page SHALL retain its `generateStaticParams` behavior by generating one static path per product `id` at build time and its `generateMetadata` behavior by producing a per-product title and description.

### Requirement 13: CI/CD pipeline with preview deployments

**User Story:** As a developer, I want GitHub-driven CI/CD with Vercel previews and gated merges, so that every change is built, tested, and reviewable on a real URL before reaching production.

#### Acceptance Criteria

1. WHEN a pull request is opened, THE CI_CD_Pipeline SHALL create a Vercel preview deployment with its own URL.
2. WHEN a pull request is opened or updated, THE CI_CD_Pipeline SHALL run the required checks, defined as lint, `tsc --noEmit` in strict mode, unit tests, and integration tests, through GitHub Actions.
3. IF any required check fails, THEN THE CI_CD_Pipeline SHALL block the merge through branch protection.
4. WHEN a pull request preview is available, THE CI_CD_Pipeline SHALL run Playwright end-to-end tests against the preview URL.
5. WHEN a pull request is merged to `main` AND all required checks have passed, THE CI_CD_Pipeline SHALL deploy to the Vercel production environment.
6. THE CI_CD_Pipeline SHALL configure preview deployments to use a separate Supabase project or branch so previews never read from or write to production data.
7. THE CI_CD_Pipeline SHALL provision every deployment environment with anon-only credentials so the service-role key is never exposed to any deployment environment.

### Requirement 14: Automated test coverage

**User Story:** As a QA engineer, I want layered automated tests covering the data-access logic, security invariants, and preserved behavior, so that regressions and security gaps are caught before release.

#### Acceptance Criteria

1. THE test suite SHALL include unit tests (Vitest) for `mapRowToProduct` covering snake_case to camelCase mapping and `price` / `imageUrl` passthrough.
2. THE test suite SHALL include unit tests for Seed_Validator that accept valid input and reject bad `price` format, bad `bg` hex, non-URL `imageUrl`, and empty required fields.
3. THE test suite SHALL include unit tests for the WhatsApp message formatting in both English and Malay.
4. THE test suite SHALL include integration tests against a Supabase test project that verify `fetchProducts` returns rows ordered by `sort_order`.
5. THE test suite SHALL include integration tests that verify `fetchProductById` returns a `Product` for an existing id and `undefined` for a missing id.
6. THE test suite SHALL include integration tests that verify an anon client can `SELECT` from the Products_Table and that each of `INSERT`, `UPDATE`, and `DELETE` is individually denied for the anon client.
7. THE test suite SHALL include end-to-end tests (Playwright) that verify the homepage renders the product grid from Supabase data, the product detail page shows EN and MS descriptions and the made-to-order 2-4 week note, the language toggle switches all visible strings, add-to-cart updates the cart drawer, and "Order via WhatsApp" produces a `wa.me` URL whose contents match Requirement 11, namely the configured WhatsApp number, the product name, and the selected quantity.
8. WHERE property-based testing is enabled, THE test suite SHALL assert that `mapRowToProduct` yields a `Product` satisfying the contract for arbitrary valid `ProductRow` inputs.
