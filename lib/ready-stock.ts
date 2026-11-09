import type { ReadyStockRow } from '@/lib/supabase/database.types';
import { createAnonClient } from '@/lib/supabase/anon';
import { CACHE_TAGS, createCachedFetch, uncachedFetch } from '@/lib/cached-fetch';
import { formatMyr } from '@/lib/money';
import { errorMessage } from '@/lib/log';

/** One physical, one-of-a-kind bag. The public site only ever sees available items. */
export interface ReadyStockItem {
  id: string;
  /** Short unique code shown to customers, e.g. "RS-0042". */
  code: string;
  name: string;
  descriptionEn: string | null;
  descriptionMs: string | null;
  price: string;
  priceMyr: number;
  /** null means one size. */
  sizeLabel: string | null;
  imageUrl: string;
}

/** Pure mapping from a snake_case DB row to the camelCase ReadyStockItem. */
export function mapRowToReadyStockItem(row: ReadyStockRow): ReadyStockItem {
  const priceMyr = Number(row.price_myr);
  const sizeLabel = row.size_label?.trim() ? row.size_label.trim() : null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    descriptionEn: row.description_en,
    descriptionMs: row.description_ms,
    price: formatMyr(priceMyr),
    priceMyr,
    sizeLabel,
    imageUrl: row.image_url,
  };
}

/** Short revalidate as a backstop; admin actions also invalidate the tag on every change. */
const REVALIDATE_SECONDS = 60;
const cachedFetch = createCachedFetch({
  tags: [CACHE_TAGS.readyStock],
  revalidate: REVALIDATE_SECONDS,
});

function logError(context: string, err: unknown): void {
  console.error(`[ready-stock] ${context}: ${errorMessage(err)}`);
}

/** Available bags, newest first (then by sort_order). Returns [] on any failure. */
export async function fetchReadyStock(limit?: number): Promise<ReadyStockItem[]> {
  try {
    const supabase = createAnonClient({ fetch: cachedFetch });
    let query = supabase
      .from('ready_stock_items')
      .select('*')
      .eq('status', 'available')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (limit !== undefined) query = query.limit(limit);
    const { data, error } = await query;
    if (error) {
      logError('fetchReadyStock failed', error);
      return [];
    }
    return (data ?? []).map(mapRowToReadyStockItem);
  } catch (err) {
    logError('fetchReadyStock failed', err);
    return [];
  }
}

/** Latest `n` available bags for the homepage strip. */
export function fetchLatestAvailable(n: number): Promise<ReadyStockItem[]> {
  return fetchReadyStock(n);
}

/** Normalises a code from a URL segment ("rs-0042" -> "RS-0042"). */
export function normalizeReadyStockCode(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase();
}

/** Available bag by code. Returns undefined when sold, unknown or on any failure. */
export async function fetchReadyStockByCode(
  code: string
): Promise<ReadyStockItem | undefined> {
  try {
    const supabase = createAnonClient({ fetch: cachedFetch });
    const { data, error } = await supabase
      .from('ready_stock_items')
      .select('*')
      .eq('code', normalizeReadyStockCode(code))
      .eq('status', 'available')
      .maybeSingle();
    if (error) {
      logError('fetchReadyStockByCode failed', error);
      return undefined;
    }
    return data ? mapRowToReadyStockItem(data) : undefined;
  } catch (err) {
    logError('fetchReadyStockByCode failed', err);
    return undefined;
  }
}

/**
 * Returns the subset of `ids` that are still publicly visible (available).
 * Always reads fresh data. Resolves to null when the check itself failed,
 * so callers can decide not to block the customer on a database hiccup.
 */
export async function fetchAvailableIds(ids: string[]): Promise<string[] | null> {
  if (ids.length === 0) return [];
  try {
    const supabase = createAnonClient({ fetch: uncachedFetch });
    const { data, error } = await supabase
      .from('ready_stock_items')
      .select('id')
      .in('id', ids)
      .eq('status', 'available');
    if (error) {
      logError('fetchAvailableIds failed', error);
      return null;
    }
    return (data ?? []).map((r) => r.id);
  } catch (err) {
    logError('fetchAvailableIds failed', err);
    return null;
  }
}
