-- Migration: create public.products table
--
-- Authoritative product data source for the FATRAH catalog (replaces the
-- Google Sheets CSV + hardcoded fallback). Columns mirror the existing CSV
-- fields so the five seed rows (p1..p5) migrate 1:1 while preserving their
-- original text identifiers as the primary key.
--
-- `price` is intentionally kept as a display string (e.g. "RM 480") to preserve
-- the existing Product contract; `image_url` holds a Cloudinary (res.cloudinary.com)
-- delivery URL pasted in manually. `sort_order` provides deterministic ordering.
--
-- RLS policies for this table are added by migration task 2.2 (appended below).

create table public.products (
  id             text primary key,            -- preserve existing "p1".."p5"
  name           text not null,
  description_en text not null,
  description_ms text not null,
  price          text not null,               -- display string e.g. "RM 480"
  bg             text not null,               -- hex accent used by UI
  grid_class     text not null,               -- Tailwind layout classes
  aspect_class   text not null,
  image_url      text not null,               -- Cloudinary delivery URL (manual)
  sort_order     integer not null default 0,  -- deterministic ordering
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS policies (task 2.2)
--
-- Defense-in-depth: the anon key is shipped to the browser
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY) and must be assumed public. Enabling RLS with
-- only a SELECT policy guarantees that key can read but never write. No
-- INSERT/UPDATE/DELETE policy is defined, so those operations are denied by
-- default even with a leaked anon key. The only writer is the seed script using
-- the service-role key, which bypasses RLS and runs locally -- never in the
-- deployed runtime.

alter table public.products enable row level security;

-- Public (anon) may read everything.
create policy "public_read_products"
  on public.products for select
  using (true);
