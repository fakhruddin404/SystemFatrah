# FATRAH

Bilingual (EN / BM) catalog for handcrafted Terengganu batik bags, built with Next.js 14 (App Router). Product data lives in Supabase; orders go through WhatsApp.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (local only, for seeding; never deploy it)
3. Apply the migration in `supabase/migrations/` to your Supabase project (SQL editor or `supabase db push`).
4. Put Cloudinary image URLs in `scripts/seed-data/products.csv`, then run `npm run seed`.
5. `npm run dev` and open http://localhost:3000.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, serve build |
| `npm run lint` | `next lint` (config in `.eslintrc.json`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:integration` | Vitest integration tests against a test Supabase project |
| `npm run test:e2e` | Playwright end-to-end tests (`PLAYWRIGHT_BASE_URL` selects the target) |
| `npm run seed` | One-time seed of products from the CSV (needs service-role key) |

## CI/CD & Deployment

GitHub Actions runs `lint`, `typecheck`, `unit` and `integration` as required checks on `main`; Vercel deploys previews per PR and production on merge to `main`. Branch protection, secrets, Vercel env wiring, the anon-only credentials rule and troubleshooting are documented in [docs/deployment.md](docs/deployment.md).

Quick troubleshooting for seeding:

- `new row violates row-level security policy`: you used the anon key instead of the `service_role` key.
- `Could not find the table 'public.products' in the schema cache`: apply the migration, then run `notify pgrst, 'reload schema';`.
