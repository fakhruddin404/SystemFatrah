# Fat_Rahz Batik

Bilingual (EN / BM) store for modern, elegant bags sewn from authentic Terengganu batik, 100% handmade in Terengganu since 2014. Built with Next.js 14 (App Router), Supabase (data and admin sign-in) and Cloudinary (images). Orders go through WhatsApp; there is no payment gateway and no delivery fee on the site (it is confirmed in the chat).

Two ways to buy:

- **Pre-order** (`/pre-order`): designs sewn to order, with optional sizes. Allow 2–4 weeks.
- **Ready Stock** (`/ready-stock`): one-of-a-kind bags, each with its own batik pattern and code (for example `RS-0042`). A bag disappears from the site as soon as the admin marks it sold.

The repository and database keep the internal name `fatrah`; the brand name shown to customers is **Fat_Rahz Batik** (defined once in `lib/site.ts`).

## Local setup

1. Use Node 22+ (required by supabase-js; set by `.nvmrc` / `engines`), then `npm install`.
2. Copy `.env.example` to `.env.local` and fill it in. Point it at **fatrah-staging** unless you are deliberately working on production. Set `SUPABASE_TARGET=staging`.
3. Apply the migrations in `supabase/migrations/` to the project (SQL editor or `supabase db push`). Staging first, then prod.
4. Seed the sample data: `npm run seed` (products everywhere; sizes and sample ready-stock bags on staging only).
5. `npm run dev` and open http://localhost:3000.

## Admin

The admin lives at `/admin` (not linked from the site, not indexed). Content is managed with full create, edit and delete for pre-order products (with sizes) and ready-stock bags. Images can be a pasted link or an upload to Cloudinary.

Set up the first admin **in each Supabase project** (staging and prod):

1. In the Supabase dashboard, Authentication → Providers → Email: turn **off** "Allow new users to sign up".
2. Authentication → Users → Add user (email and password, confirm the email).
3. In the SQL editor: `insert into public.admin_users (user_id) values ('<that user id>');`
4. Sign in at `/admin/login`.

Only users on the `admin_users` list can write; every write is enforced by row-level security, so the deployed app never needs the service-role key.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, serve build |
| `npm run lint` | `next lint` (config in `.eslintrc.json`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Vitest unit tests (offline) |
| `npm run test:integration` | Vitest integration tests against **fatrah-staging** (needs `SUPABASE_TARGET=staging`) |
| `npm run test:e2e` | Playwright end-to-end tests (`PLAYWRIGHT_BASE_URL` selects the target) |
| `npm run seed` | Seed products (and, on staging, sizes and sample bags). Needs the service-role key and `SUPABASE_TARGET` |

## CI/CD & Deployment

GitHub Actions runs `lint`, `typecheck`, `unit` and `integration` as required checks on `main`; Vercel deploys previews per PR and production on merge to `main`. Branch protection, secrets, the two-project environment wiring, the rollout checklist and troubleshooting are in [docs/deployment.md](docs/deployment.md).

Quick troubleshooting:

- `Node.js detected but native WebSocket not found`: you are running on Node < 22.
- `Could not find the table ... in the schema cache`: apply the migrations, then run `notify pgrst, 'reload schema';`.
- `SUPABASE_TARGET is not set`: add `SUPABASE_TARGET=staging` to `.env.local`.
