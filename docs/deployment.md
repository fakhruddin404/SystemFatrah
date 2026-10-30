# CI/CD & Deployment

## Pipeline overview

| Workflow | File | Trigger | Jobs |
| --- | --- | --- | --- |
| `CI` | `.github/workflows/ci.yml` | pull requests and push to `main` | `lint`, `typecheck`, `unit`, `integration` |
| `E2E Preview` | `.github/workflows/e2e-preview.yml` | Vercel `deployment_status` (successful Preview deployments) | `e2e` |

`E2E Preview` runs Playwright against the Vercel preview URL (`PLAYWRIGHT_BASE_URL`).

## Branch protection on `main`

In GitHub: Settings → Branches → add a rule for `main`:

- Require a pull request before merging.
- Require status checks to pass: `lint`, `typecheck`, `unit`, `integration`.
- Require branches to be up to date before merging.
- Block force pushes.

## GitHub repository secrets

| Secret | Purpose |
| --- | --- |
| `TEST_SUPABASE_URL` | URL of the separate **test** Supabase project/branch (used by `integration`) |
| `TEST_SUPABASE_ANON_KEY` | Anon key of the test project/branch |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Optional. Only if Vercel Deployment Protection is on, so `E2E Preview` can reach the preview URL |

Never add `SUPABASE_SERVICE_ROLE_KEY` as a GitHub secret.

## Vercel environment variables

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | production project | test project/branch | test project/branch |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key | test anon key | test anon key |

Previews are wired to a **separate** Supabase project (or Supabase branch) so preview and test traffic never touches production data. Apply the migration in `supabase/migrations/` and seed it to that project too.

## Anon-only credentials rule

Every deployment environment (Vercel Production/Preview/Development and GitHub Actions) uses the **anon key only**. `SUPABASE_SERVICE_ROLE_KEY` must never be set in any Vercel environment or GitHub secret. It lives only in a developer's local `.env.local` and is used solely by `npm run seed`. Row-level security allows public read access with the anon key; writes require the service role.

## Production deploy

Merging to `main` (after the required checks pass) triggers the Vercel Production deployment automatically. Pull requests get Preview deployments, which then trigger `E2E Preview`.

## Troubleshooting

- `new row violates row-level security policy` during `npm run seed`: the wrong key is in use. `.env.local` has the anon key where the `service_role` key is needed for `SUPABASE_SERVICE_ROLE_KEY`.
- `Could not find the table 'public.products' in the schema cache`: the migration has not been applied, or PostgREST has not reloaded. Apply `supabase/migrations/20250101000000_create_products.sql`, then run `notify pgrst, 'reload schema';` in the SQL editor.
