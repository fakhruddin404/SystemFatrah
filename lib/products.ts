import type { Json, ProductRow, ProductSizeRow } from '@/lib/supabase/database.types';
import { createAnonClient } from '@/lib/supabase/anon';
import { CACHE_TAGS, createCachedFetch } from '@/lib/cached-fetch';
import { formatMyr } from '@/lib/money';
import { errorMessage } from '@/lib/log';

/** A selectable size of a pre-order product. Products with no sizes are one-size. */
export interface ProductSize {
  id: string;
  label: string;
  /** Overrides the product price for this size when not null. */
  priceMyr: number | null;
  sortOrder: number;
}

/** UI contract for a pre-order product. Stable shape consumed by all components/pages. */
export interface Product {
  id: string;
  name: string;
  descriptionEn: string;
  descriptionMs: string;
  /** Display string derived from priceMyr, e.g. "RM 480". */
  price: string;
  priceMyr: number;
  bg: string;
  gridClass: string;
  aspectClass: string;
  imageUrl: string;
  /** Optional spec list (material, lining, dimensions...). */
  details: Record<string, string> | null;
  sizes: ProductSize[];
}

/** Row as returned by `select('*, product_sizes(*)')`. */
export type ProductRowWithSizes = ProductRow & {
  product_sizes?: ProductSizeRow[] | null;
};

function parseDetails(value: Json | null | undefined): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== ''
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export function mapSizeRow(row: ProductSizeRow): ProductSize {
  return {
    id: row.id,
    label: row.label,
    priceMyr: row.price_override_myr === null ? null : Number(row.price_override_myr),
    sortOrder: row.sort_order,
  };
}

/** Pure mapping from a snake_case DB row to the camelCase Product. No I/O, no mutation. */
export function mapRowToProduct(row: ProductRowWithSizes): Product {
  const priceMyr = Number(row.price_myr);
  const sizes = (row.product_sizes ?? [])
    .filter((s) => s.is_active)
    .map(mapSizeRow)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  return {
    id: row.id,
    name: row.name,
    descriptionEn: row.description_en,
    descriptionMs: row.description_ms,
    price: formatMyr(priceMyr),
    priceMyr,
    bg: row.bg,
    gridClass: row.grid_class,
    aspectClass: row.aspect_class,
    imageUrl: row.image_url,
    details: parseDetails(row.details),
    sizes,
  };
}

const REVALIDATE_SECONDS = 3600;
const cachedFetch = createCachedFetch({
  tags: [CACHE_TAGS.products],
  revalidate: REVALIDATE_SECONDS,
});

function logError(context: string, err: unknown): void {
  // Log message only; never include env values or keys.
  console.error(`[products] ${context}: ${errorMessage(err)}`);
}

/** All published products ordered by sort_order asc, then id asc. Returns [] on any failure. */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const supabase = createAnonClient({ fetch: cachedFetch });
    const { data, error } = await supabase
      .from('products')
      .select('*, product_sizes(*)')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) {
      logError('fetchProducts failed', error);
      return [];
    }
    return ((data ?? []) as ProductRowWithSizes[]).map(mapRowToProduct);
  } catch (err) {
    logError('fetchProducts failed', err);
    return [];
  }
}

/** Single published product by id. Returns undefined on miss or any failure. */
export async function fetchProductById(
  id: string
): Promise<Product | undefined> {
  try {
    const supabase = createAnonClient({ fetch: cachedFetch });
    const { data, error } = await supabase
      .from('products')
      .select('*, product_sizes(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      logError('fetchProductById failed', error);
      return undefined;
    }
    return data ? mapRowToProduct(data as ProductRowWithSizes) : undefined;
  } catch (err) {
    logError('fetchProductById failed', err);
    return undefined;
  }
}
