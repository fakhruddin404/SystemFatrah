import type { ProductRow } from '@/lib/supabase/database.types';
import { createAnonClient } from '@/lib/supabase/anon';

/** UI contract for a product. Stable shape consumed by all components/pages. */
export interface Product {
  id: string;
  name: string;
  descriptionEn: string;
  descriptionMs: string;
  price: string;
  bg: string;
  gridClass: string;
  aspectClass: string;
  imageUrl: string;
}

/** Pure mapping from a snake_case DB row to the camelCase Product. No I/O, no mutation. */
export function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    descriptionEn: row.description_en,
    descriptionMs: row.description_ms,
    price: row.price,
    bg: row.bg,
    gridClass: row.grid_class,
    aspectClass: row.aspect_class,
    imageUrl: row.image_url,
  };
}

const REVALIDATE_SECONDS = 3600;

/** fetch wrapper adding Next.js ISR revalidation hints (Next 14 App Router). */
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    next: { revalidate: REVALIDATE_SECONDS },
  } as RequestInit);

function logError(context: string, err: unknown): void {
  // Log message only; never include env values or keys.
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[products] ${context}: ${message}`);
}

/** All products ordered by sort_order asc, then id asc. Returns [] on any failure. */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const supabase = createAnonClient({ fetch: cachedFetch });
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) {
      logError('fetchProducts failed', error);
      return [];
    }
    return (data ?? []).map(mapRowToProduct);
  } catch (err) {
    logError('fetchProducts failed', err);
    return [];
  }
}

/** Single product by id. Returns undefined on miss or any failure. */
export async function fetchProductById(
  id: string
): Promise<Product | undefined> {
  try {
    const supabase = createAnonClient({ fetch: cachedFetch });
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      logError('fetchProductById failed', error);
      return undefined;
    }
    return data ? mapRowToProduct(data) : undefined;
  } catch (err) {
    logError('fetchProductById failed', err);
    return undefined;
  }
}
