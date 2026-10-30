# Implementation Plan: Production Stack Migration

## Overview

This plan migrates the FATRAH catalog from its CSV/hardcoded-fallback data source onto Supabase (PostgreSQL) + Cloudinary delivery URLs + Vercel/GitHub CI/CD, while preserving all visible behavior (WhatsApp ordering, EN/MS UI, made-to-order messaging, homepage composition).

Tasks are ordered into seven phases so each phase is independently testable and builds on the previous one: (1) tooling/test harness + env scaffolding, (2) Supabase schema + RLS + generated types, (3) seed script + its unit tests, (4) data-access layer + unit/integration tests, (5) wiring pages and image host config, (6) preserve-behavior regression + Playwright e2e, (7) CI/CD. Test tasks are written explicitly and co-located with the code they cover. Property-based tests and on-demand revalidation are marked optional. Tasks that require a manual/external action (creating cloud projects, pasting keys, uploading images, enabling branch protection) are flagged **[USER ACTION REQUIRED]**.

## Tasks

- [ ] 1. Tooling, dependencies, and test-harness setup
  - [x] 1.1 Install and configure runtime and dev dependencies
    - Add `@supabase/supabase-js` (runtime), and dev deps `vitest`, `@testing-library/react`, `@playwright/test`, `zod`, `supabase` CLI, plus `papaparse`/`@types/papaparse` for the seed script
    - Add npm scripts: `test:unit` (vitest run), `test:integration` (vitest run, integration config), `test:e2e` (playwright test), `typecheck` (`tsc --noEmit`), `seed` (run seed script via tsx/ts-node)
    - Ensure `tsconfig.json` remains strict; confirm `tsc --noEmit` passes on the current tree
    - _Requirements: 13.2, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 1.2 Configure Vitest and Playwright harnesses
    - Create `vitest.config.ts` (jsdom/node environments) and separate project/config split so unit tests run without network and integration tests run against a real Supabase test project
    - Create `playwright.config.ts` targeting a configurable preview/base URL (read from env), with a chromium project
    - Add a placeholder smoke test for each runner to prove the harness executes
    - _Requirements: 14.1, 14.4, 14.7_

  - [x] 1.3 Create environment scaffolding and secret hygiene
    - Create committed `.env.example` listing names only (no values): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SHEETS_CSV_URL`
    - Add `.env.local` to `.gitignore` so real secret values are never committed
    - _Requirements: 9.4, 9.5, 9.6_

  - [ ] 1.4 Checkpoint - Ensure harness and typecheck pass
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 2. Supabase schema, RLS, and generated types
  - [x] 2.1 Author the products table migration
    - Create a SQL migration defining `public.products` with columns `id text primary key`, `name`, `description_en`, `description_ms`, `price`, `bg`, `grid_class`, `aspect_class`, `image_url` (all `NOT NULL`), `sort_order integer not null default 0`, `created_at`, `updated_at`
    - Preserve text ids `p1`-`p5` as primary key
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1_

  - [x] 2.2 Author RLS policies in the migration
    - Enable Row Level Security on `public.products`
    - Add a `SELECT` policy for `anon` (`using (true)`); define no `INSERT`/`UPDATE`/`DELETE` policy so writes are denied by default
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.3 **[USER ACTION REQUIRED]** Create Supabase project and apply the migration
    - User creates a Supabase project (and a separate test project/branch for integration/preview use), applies the migration, and pastes `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`
    - _Requirements: 1.1, 13.6_

  - [x] 2.4 Generate the Database/ProductRow types
    - Run `supabase gen types typescript` and commit the generated `Database` type (e.g. `lib/supabase/database.types.ts`); define/export the `ProductRow` snake_case shape used by the data layer and seed script
    - _Requirements: 2.3, 3.1, 4.1_

  - [ ] 2.5 Checkpoint - Verify schema and types compile
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. One-time seed script with validation
  - [x] 3.1 Implement the service-role client and SeedRowInput validator (seed-only)
    - Create a seed-only service-role client factory that reads `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` and fails loudly (non-zero exit, names the missing var) if absent, before any write
    - Define the Zod `SeedRowInput` schema: non-empty trimmed `id`/`name`/`descriptionEn`/`descriptionMs`/`gridClass`/`aspectClass`; `price` matching `^RM\s?\d+(\.\d{2})?$`; `bg` matching `^#([0-9a-fA-F]{6})$`; `imageUrl` an `https` URL
    - _Requirements: 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 9.8_

  - [x] 3.2 Implement scripts/seed-products.ts parse-validate-upsert flow
    - Parse CSV with `papaparse` (`header: true`); validate every row with `SeedRowInput` before any write; on failure abort before writing, leave the table unchanged, and report the offending row `id` and field
    - Map validated rows to the snake_case row shape preserving `id` (`p1`-`p5`); upsert with `onConflict: 'id'` so re-runs are idempotent
    - Print a summary (count upserted); ensure the script is not importable by any deployed runtime module
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

  - [x] 3.3 Write unit tests for SeedRowInput
    - Table-driven: accept valid input; reject bad `price` format, bad `bg` hex, non-URL/non-https `imageUrl`, whitespace-only/empty required fields, and surface the field error
    - _Requirements: 14.2, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 3.4 Write unit tests for seed validation/abort behavior
    - Verify that an invalid row causes the validation pass to abort before any upsert is attempted (mock the upsert and assert it is never called), and that the missing-service-role-key guard exits non-zero
    - _Requirements: 14.2, 6.3, 9.8_

  - [x] 3.5 **[USER ACTION REQUIRED]** Upload images to Cloudinary and run the seed
    - User uploads product images in the Cloudinary dashboard, pastes each `res.cloudinary.com` delivery URL into the CSV/source rows, then runs `npm run seed` locally to populate the five `p1`-`p5` rows
    - _Requirements: 1.2, 8.1_

  - [ ] 3.6 Checkpoint - Ensure seed tests pass
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Data-access layer replacing csv-parser
  - [x] 4.1 Implement the Supabase anon client factory
    - Create `lib/supabase/anon.ts` exporting `createAnonClient(): SupabaseClient<Database>` built from `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`; throw a clear error naming the missing variable (and return no client) if either is absent
    - _Requirements: 1.3, 9.1, 9.7_

  - [x] 4.2 Implement mapRowToProduct pure mapping and re-export the Product type
    - In `lib/products.ts`, re-export the `Product` interface (exact fields, all `string`, no extras) and implement `mapRowToProduct(row: ProductRow): Product` setting each camelCase field from its snake_case source; pass `price` and `image_url` through unchanged; no I/O, no mutation of the input row
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x]* 4.3 Write unit tests for mapRowToProduct
    - Assert snake_case to camelCase mapping for all fields and exact `price`/`imageUrl` passthrough (no trimming/coercion); assert the input row is not mutated
    - _Requirements: 14.1, 3.3, 3.4, 3.5_

  - [x]* 4.4 Write property-based test for mapRowToProduct (optional, fast-check)
    - **Property 1: Contract stability**
    - **Validates: Requirements 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5**
    - For arbitrary valid `ProductRow` inputs, assert the result always satisfies the `Product` contract and preserves field values

  - [x] 4.5 Implement fetchProducts and fetchProductById with caching and fail-soft
    - Implement `fetchProducts()` querying `products` ordered by `sort_order` ascending with deterministic secondary order by `id` ascending; on error log and return `[]`
    - Implement `fetchProductById(id)` using a single lookup; return the mapped `Product` on hit, `undefined` on miss or error; never throw to the page layer
    - Apply Next.js caching with a 3600-second revalidation matching the old `csv-parser.ts`; remove any hardcoded fallback CSV from this runtime module
    - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 10.1, 10.2, 10.4_

  - [x]* 4.6 Write integration tests for fetchProducts / fetchProductById ordering and hit/miss
    - Against the Supabase test project: `fetchProducts` returns rows ordered by `sort_order` (and by `id` on ties); `fetchProductById` returns a `Product` for an existing id and `undefined` for a missing id
    - _Requirements: 14.4, 14.5, 2.4, 2.5, 2.6, 2.7_

  - [x]* 4.7 Write integration test for fail-soft reads
    - Simulate a read error (e.g. invalid client/table) and assert `fetchProducts` returns `[]` and `fetchProductById` returns `undefined` without throwing
    - **Property 4: Fail-soft reads**
    - **Validates: Requirements 10.1, 10.2, 10.4**

  - [x]* 4.8 Write integration test for RLS anon read/write boundary
    - With an anon client against the test project: assert `SELECT` succeeds and that each of `INSERT`, `UPDATE`, `DELETE` is individually denied and leaves the table unchanged
    - **Property 2: Read-only anon**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 14.6**

  - [ ] 4.9 Checkpoint - Ensure data-layer tests pass
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Wire pages to the new data layer and configure image host
  - [x] 5.1 Repoint page imports to lib/products and remove csv-parser fallback
    - Update `app/page.tsx` and `app/products/[id]/page.tsx` to import `fetchProducts`/`fetchProductById`/`Product` from `@/lib/products`; keep `generateStaticParams` (one path per id) and `generateMetadata` (per-product title/description); keep `notFound()` when `fetchProductById` returns `undefined`
    - Delete `lib/csv-parser.ts` (and its `GOOGLE_SHEETS_CSV_URL` runtime fetch path and hardcoded fallback) once nothing imports it
    - _Requirements: 1.4, 1.5, 10.3, 12.4, 12.5_

  - [x] 5.2 Whitelist res.cloudinary.com in next.config.mjs
    - Add `{ protocol: 'https', hostname: 'res.cloudinary.com' }` to `images.remotePatterns` alongside the existing `images.unsplash.com`; confirm products render through `next/image` using the stored delivery URL
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [ ] 5.3 Checkpoint - Verify build and typecheck after wiring
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Preserve-behavior regression and end-to-end tests
  - [x] 6.1 Write unit tests for WhatsApp message formatting (EN and MS)
    - Assert the generated `wa.me` URL targets the configured number and the URL-encoded text contains the product name and selected quantity in both English and Malay; assert an empty cart does not open a `wa.me` URL
    - _Requirements: 14.3, 11.1, 11.2, 11.3, 11.5_

  - [x]* 6.2 Write Playwright e2e: homepage grid and composition
    - Verify the homepage renders the product grid from Supabase data and composes Header, Hero, Showcase, Collection, Banner, Footer
    - _Requirements: 14.7, 12.4_

  - [x]* 6.3 Write Playwright e2e: product detail bilingual + made-to-order note
    - Verify the detail page shows both EN and MS descriptions and the made-to-order 2-4 week note
    - _Requirements: 14.7, 12.3_

  - [x]* 6.4 Write Playwright e2e: language toggle
    - Verify toggling language switches every visible string EN <-> MS with nothing left in the prior language
    - _Requirements: 14.7, 12.1, 12.2_

  - [x]* 6.5 Write Playwright e2e: add-to-cart and WhatsApp URL contents
    - Verify add-to-cart updates the cart drawer count and total (price x quantity), and that "Order via WhatsApp" builds a `wa.me` URL containing the configured number, product name, and quantity (assert the URL; do not navigate to WhatsApp); verify no checkout/payment surface exists
    - **Property 5: Preserved behavior**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.6, 12.1, 12.2, 12.3, 14.7**

  - [ ] 6.6 Checkpoint - Ensure regression and e2e tests pass
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. CI/CD pipeline and deployment wiring
  - [x] 7.1 Author the GitHub Actions workflow
    - Create a workflow that runs on pull requests: `lint`, `tsc --noEmit` (strict), unit tests, and integration tests; wire integration tests to the separate Supabase test project via repository secrets (anon-only for app reads)
    - Add a job that runs Playwright e2e against the Vercel preview URL once the preview is available
    - _Requirements: 13.2, 13.4_

  - [x] 7.2 Add CI/CD configuration and contributor documentation notes
    - Document in-repo (README/docs): required status checks and branch-protection setup; Vercel preview wiring to a separate Supabase project/branch; the rule that every deployment environment uses anon-only credentials and never `SUPABASE_SERVICE_ROLE_KEY`; production deploy on merge to `main`
    - Add any config files (e.g. lint config) the workflow depends on if missing
    - _Requirements: 13.5, 13.6, 13.7, 9.2, 9.3_

  - [ ] 7.3 **[USER ACTION REQUIRED]** Connect Vercel/GitHub, set env vars, enable branch protection
    - User connects the GitHub repo to Vercel; sets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only in Production/Preview/Development (no service-role key in any Vercel env); points Preview at the separate Supabase project/branch; enables branch protection requiring the CI checks to pass before merge
    - _Requirements: 13.1, 13.3, 13.5, 13.6, 13.7, 9.1, 9.2_

  - [ ] 7.4 Final checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP (property-based mapping test, integration tests, and Playwright e2e). Core implementation and the explicit unit/validation tests are not optional.
- Property-based tests (fast-check) and on-demand revalidation are stretch items; the baseline uses 3600-second time-based revalidation per Requirement 2.8.
- Tasks tagged **[USER ACTION REQUIRED]** need a manual/external step (create Supabase project, upload Cloudinary images and run the seed, connect Vercel/GitHub, set env vars, enable branch protection) and are not pure in-repo coding tasks.
- Each task references specific requirement sub-clauses for traceability; property sub-tasks are annotated with their design property number.
- Checkpoints provide incremental validation so the user can execute and verify one phase at a time.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "4.1", "4.2"] },
    { "id": 5, "tasks": ["3.3", "3.4", "4.3", "4.4", "4.5"] },
    { "id": 6, "tasks": ["3.5", "4.6", "4.7", "4.8"] },
    { "id": 7, "tasks": ["5.1", "5.2"] },
    { "id": 8, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 9, "tasks": ["7.1", "7.2"] },
    { "id": 10, "tasks": ["7.3"] }
  ]
}
```
