# CI/CD & Deployment

## Environments

| | Supabase project | Vercel environment | Cloudinary folder |
| --- | --- | --- | --- |
| Production | `fatrah-prod` | Production | `fat-rahz/production` |
| Staging / previews / tests | `fatrah-staging` | Preview and Development | `fat-rahz/preview`, `fat-rahz/development` |

Both Supabase projects use the same generic variable names; only the values differ per Vercel environment. Staging and production share one Cloudinary account and are kept apart by upload folder.

## Pipeline overview

| Workflow | File | Trigger | Jobs |
| --- | --- | --- | --- |
| `CI` | `.github/workflows/ci.yml` | pull requests and push to `main` | `lint`, `typecheck`, `unit`, `integration` |
| `E2E Preview` | `.github/workflows/e2e-preview.yml` | Vercel `deployment_status` (successful Preview deployments) | `e2e` |

`E2E Preview` runs Playwright against the Vercel preview URL (`PLAYWRIGHT_BASE_URL`), which is backed by `fatrah-staging`.

## Branch protection on `main`

In GitHub: Settings → Branches → add a rule for `main`:

- Require a pull request before merging.
- Require status checks to pass: `lint`, `typecheck`, `unit`, `integration`.
- Require branches to be up to date before merging.
- Block force pushes.

## GitHub repository secrets

| Secret | Purpose |
| --- | --- |
| `TEST_SUPABASE_URL` | URL of **`fatrah-staging`** (used by `integration`) |
| `TEST_SUPABASE_ANON_KEY` | Anon key of `fatrah-staging` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Optional. Only if Vercel Deployment Protection is on, so `E2E Preview` can reach the preview URL |

Never add `SUPABASE_SERVICE_ROLE_KEY` or `CLOUDINARY_URL` as a GitHub secret. The integration job sets `SUPABASE_TARGET=staging`; the tests refuse to run otherwise.

The admin-RLS integration test (`admin-rls.integration.test.ts`) needs the service-role key to create throwaway users, so it skips itself in CI. Run it locally against staging with `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Vercel environment variables

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `fatrah-prod` URL | `fatrah-staging` URL | `fatrah-staging` URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `fatrah-prod` anon key | `fatrah-staging` anon key | `fatrah-staging` anon key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | cloud name | cloud name | cloud name |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | digits only, e.g. `60132577325` | same | same |
| `CLOUDINARY_URL` (**secret**, not `NEXT_PUBLIC_`) | set | set | set (or use `.env.local`) |
| `CLOUDINARY_UPLOAD_FOLDER` | optional | optional | optional |

`NEXT_PUBLIC_*` values are compiled into the browser bundle and must be treated as public. `CLOUDINARY_URL` contains the Cloudinary API secret: it is read only by server code (`lib/cloudinary-server.ts` imports `server-only`) and must never be given a `NEXT_PUBLIC_` prefix.

## Credentials rules

- The deployed app uses the **anon key plus the signed-in admin's session**. Row-level security allows public reads of published products and **available** ready-stock bags, and allows writes only to users on the `admin_users` list.
- `SUPABASE_SERVICE_ROLE_KEY` must never be set in any Vercel environment or GitHub secret. It lives only in a developer's local `.env.local` and is used by `npm run seed` and the admin-RLS integration test.
- Local scripts read `SUPABASE_TARGET` (`staging` or `production`) and refuse to run without it. Seeding production also needs `--confirm-production`, and sample ready-stock bags and sizes are never seeded to production.

## Rollout checklist

Do staging first, verify, then repeat for production.

**1. Database (additive migrations)**

- [ ] Back up the project (Dashboard → Database → Backups).
- [ ] Apply, in order, the files in `supabase/migrations/`:
  `20261109000100_products_pricing_sizes.sql`, `20261109000200_ready_stock_items.sql`, `20261109000300_admin_users.sql`.
- [ ] Run `notify pgrst, 'reload schema';` in the SQL editor.
- [ ] Spot-check: `select id, price, price_myr from products;` (every `price_myr` is filled in).
- [ ] Regenerate types if the schema changed: `supabase gen types typescript --linked > lib/supabase/database.types.ts`.

**2. Admin access (in each project)**

- [ ] Authentication → Providers → Email: **disable** "Allow new users to sign up".
- [ ] Create the admin user and insert their id into `public.admin_users` (see README).

**3. Configuration**

- [ ] Vercel environment variables set per the table above (Production → prod values, Preview/Development → staging values).
- [ ] `CLOUDINARY_URL` set as a non-public variable in Production and Preview.
- [ ] GitHub `TEST_SUPABASE_*` secrets point at `fatrah-staging`.

**4. Deploy and verify**

- [ ] Deploy the new code (merge to `main` for production; open a PR for a preview).
- [ ] Check the homepage, `/pre-order`, `/ready-stock`, `/about`, a product page, and `/craft` redirecting to `/about`.
- [ ] Sign in at `/admin/login`, add a ready-stock bag, see it on `/ready-stock`, mark it sold, confirm it disappears, delete it.
- [ ] Upload an image from the admin and confirm it appears under the right Cloudinary folder (`fat-rahz/production` on prod).

**5. Final cleanup migration (only after step 4 passes on that project)**

- [ ] Move `supabase/deferred/20261109000400_drop_products_price.sql` into `supabase/migrations/` and apply it. It drops the legacy `products.price` text column; the new code reads only `price_myr`. Applying it *before* the new code is live would break the old deployment, which is why it is kept out of `migrations/`.
- [ ] Remove the now-unused `price` field from `lib/supabase/database.types.ts` (regenerate types).

## Production deploy

Merging to `main` (after the required checks pass) triggers the Vercel Production deployment automatically. Pull requests get Preview deployments, which then trigger `E2E Preview`.

## Node version

Node 22+ is required (`@supabase/*` packages declare `engines: node >=22`). The version is set by `.nvmrc` (used by GitHub Actions via `node-version-file`) and `engines` in `package.json` (read by Vercel). In Vercel, confirm Project Settings → Build and Deployment → Node.js Version is 22.x.

## Troubleshooting

- `Node.js detected but native WebSocket not found`: the code is running on Node < 22. Check `.nvmrc`, the workflow `setup-node` step, and the Vercel Node.js Version setting.
- `new row violates row-level security policy` during `npm run seed`: the wrong key is in use. `.env.local` has the anon key where the `service_role` key is needed for `SUPABASE_SERVICE_ROLE_KEY`.
- `Could not find the table ... in the schema cache` or `column ... does not exist`: a migration has not been applied, or PostgREST has not reloaded. Apply the files in `supabase/migrations/`, then run `notify pgrst, 'reload schema';`. Until then the public pages fail soft and render empty.
- `SUPABASE_TARGET is not set`: add `SUPABASE_TARGET=staging` (or `production`) to `.env.local`.
- Admin shows "This account does not have admin access": the user exists but is not in `public.admin_users` in *this* project. Insert their id.
- Admin image upload says it is not configured: `CLOUDINARY_URL` is missing or malformed (expected `cloudinary://<api_key>:<api_secret>@<cloud_name>`). Pasting an image link still works.
- A pasted image from another host looks unoptimized: expected. Only `res.cloudinary.com/<your cloud>/…` images are optimized; other https links are shown as-is.
