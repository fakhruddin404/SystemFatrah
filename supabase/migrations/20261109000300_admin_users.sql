-- Migration: admin allowlist and admin write policies.
--
-- Admins sign in with Supabase Auth; `admin_users` lists which auth users may manage
-- content. All writes go through the signed-in user's JWT and are enforced by RLS, so
-- the service-role key is never needed in the deployed runtime.
--
-- First admin (run in the SQL editor of EACH project after creating the user in
-- Authentication > Users, and disable public sign-ups in Authentication settings):
--   insert into public.admin_users (user_id) values ('<auth user uuid>');
--
-- Apply to fatrah-staging first, verify, then fatrah-prod.

create table public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A signed-in user may see only their own allowlist row. No write policies exist.
create policy "admin_users_read_self"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- Security definer so policies on other tables can consult the allowlist.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Admin full access (read including unpublished/sold, insert, update, delete).
create policy "admin_all_products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_all_product_sizes"
  on public.product_sizes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_all_ready_stock_items"
  on public.ready_stock_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
