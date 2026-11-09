-- Migration: ready_stock_items, one row per physical one-of-a-kind bag.
--
-- Standalone from `products` (the pre-order catalog). Sold bags are hidden from the
-- public by RLS; the admin sees every row (admin policies are added in the
-- admin_users migration). Images are Cloudinary assets or pasted https URLs.
--
-- Apply to fatrah-staging first, verify, then fatrah-prod.

create sequence public.ready_stock_code_seq start 1;

create table public.ready_stock_items (
  id                   uuid primary key default gen_random_uuid(),
  -- Short human-friendly code shown to customers and used in WhatsApp messages.
  code                 text not null unique
                         default ('RS-' || lpad(nextval('public.ready_stock_code_seq')::text, 4, '0')),
  name                 text not null check (length(btrim(name)) > 0),
  description_en       text,
  description_ms       text,
  price_myr            numeric(10,2) not null check (price_myr >= 0),
  size_label           text,                      -- null = one size
  image_url            text not null check (image_url ~ '^https://'),
  cloudinary_public_id text,                      -- set only for files uploaded through the admin
  status               text not null default 'available'
                         check (status in ('available', 'sold')),
  sold_at              timestamptz,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index ready_stock_items_status_idx
  on public.ready_stock_items (status, created_at desc);

-- Keep sold_at consistent with status so the application never has to.
create or replace function public.ready_stock_sync_sold_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'sold' then
    if tg_op = 'INSERT' or old.status is distinct from 'sold' then
      new.sold_at = coalesce(new.sold_at, now());
    end if;
  else
    new.sold_at = null;
  end if;
  return new;
end;
$$;

create trigger ready_stock_items_sync_sold_at
  before insert or update on public.ready_stock_items
  for each row execute function public.ready_stock_sync_sold_at();

create trigger ready_stock_items_set_updated_at
  before update on public.ready_stock_items
  for each row execute function public.set_updated_at();

alter table public.ready_stock_items enable row level security;

-- Sold bags disappear from the public site immediately.
create policy "public_read_available_ready_stock"
  on public.ready_stock_items for select
  using (status = 'available');
