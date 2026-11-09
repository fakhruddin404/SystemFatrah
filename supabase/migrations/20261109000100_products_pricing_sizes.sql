-- Migration: numeric pricing, publish flag, details and sizes for pre-order products.
--
-- Additive and reversible: the legacy text column `products.price` is kept (made
-- nullable) so a deployment running the previous code keeps working. It is dropped
-- by supabase/deferred/20261109000400_drop_products_price.sql AFTER the new code is live.
--
-- Apply to fatrah-staging first, verify, then fatrah-prod.

-- Shared trigger function: keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- products ----------------------------------------------------------------
alter table public.products
  add column if not exists price_myr numeric(10,2),
  add column if not exists is_published boolean not null default true,
  add column if not exists details jsonb,
  -- Set only for images uploaded through the admin, so the asset can be deleted with the row.
  add column if not exists cloudinary_public_id text;

-- Backfill price_myr from the display string ("RM 480" -> 480.00).
update public.products
set price_myr = nullif(regexp_replace(price, '[^0-9.]', '', 'g'), '')::numeric(10,2)
where price_myr is null;

alter table public.products
  alter column price_myr set not null,
  add constraint products_price_myr_nonneg check (price_myr >= 0),
  alter column price drop not null;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Public may only read published products (replaces the earlier "using (true)").
drop policy if exists "public_read_products" on public.products;
create policy "public_read_published_products"
  on public.products for select
  using (is_published);

-- product_sizes -----------------------------------------------------------
-- Zero rows for a product means it is sold in one size only.
create table public.product_sizes (
  id                 uuid primary key default gen_random_uuid(),
  product_id         text not null references public.products(id) on delete cascade,
  label              text not null check (length(btrim(label)) > 0),
  sort_order         integer not null default 0,
  price_override_myr numeric(10,2) check (price_override_myr is null or price_override_myr >= 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (product_id, label)
);

create index product_sizes_product_id_idx on public.product_sizes (product_id, sort_order);

create trigger product_sizes_set_updated_at
  before update on public.product_sizes
  for each row execute function public.set_updated_at();

alter table public.product_sizes enable row level security;

-- Public may read active sizes of published products only.
create policy "public_read_active_sizes"
  on public.product_sizes for select
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_sizes.product_id and p.is_published
    )
  );
