-- DEFERRED migration. Intentionally NOT in supabase/migrations so `supabase db push`
-- cannot apply it together with the additive migrations.
--
-- Run order (see docs/deployment.md, "Rollout checklist"):
--   1. Apply the additive migrations to the target project.
--   2. Deploy the new application code (it reads only price_myr).
--   3. Verify the site, then move this file into supabase/migrations and push.
--
-- Back up first (Supabase dashboard > Database > Backups, or `supabase db dump`).

alter table public.products drop column if exists price;
