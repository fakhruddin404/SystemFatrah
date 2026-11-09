import { describe, it, expect } from 'vitest';
import { createAnonClient } from '@/lib/supabase/anon';
import {
  fetchAvailableIds,
  fetchReadyStock,
  fetchReadyStockByCode,
} from '@/lib/ready-stock';

/**
 * Read-only integration tests for ready stock and sizes, run against fatrah-staging.
 * Requires the ready_stock_items and pricing/sizes migrations to be applied.
 *
 * Sold bags must be invisible to the public: RLS only exposes status = 'available'.
 */
const hasEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe.skipIf(!hasEnv)('ready stock data access (Supabase)', () => {
  it('fetchReadyStock returns only available bags with unique codes', async () => {
    const items = await fetchReadyStock();
    const codes = items.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);

    // Cross-check with a direct anon query: every row the public can see is available.
    const { data, error } = await createAnonClient().from('ready_stock_items').select('id, status');
    expect(error).toBeNull();
    for (const row of data ?? []) expect(row.status).toBe('available');
    expect(items.map((i) => i.id).sort()).toEqual((data ?? []).map((r) => r.id).sort());
  });

  it('the public cannot see sold bags at all', async () => {
    const { data, error } = await createAnonClient()
      .from('ready_stock_items')
      .select('id')
      .eq('status', 'sold');
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('fetchReadyStockByCode finds an available bag and misses unknown codes', async () => {
    const items = await fetchReadyStock();
    if (items.length > 0) {
      const found = await fetchReadyStockByCode(items[0].code.toLowerCase());
      expect(found).toEqual(items[0]);
    }
    expect(await fetchReadyStockByCode('RS-DOES-NOT-EXIST')).toBeUndefined();
  });

  it('fetchAvailableIds keeps available ids and drops unknown ones', async () => {
    const items = await fetchReadyStock();
    const result = await fetchAvailableIds([MISSING_ID, ...items.map((i) => i.id)]);
    expect(result).not.toBeNull();
    expect((result ?? []).sort()).toEqual(items.map((i) => i.id).sort());
    expect(await fetchAvailableIds([])).toEqual([]);
  });

  it('anon can read product sizes', async () => {
    const { error } = await createAnonClient().from('product_sizes').select('id, product_id, label');
    expect(error).toBeNull();
  });
});

describe.skipIf(!hasEnv)('anon writes are denied on new tables', () => {
  const denied = (res: { error: unknown; data: unknown[] | null }) =>
    res.error !== null || (res.data ?? []).length === 0;

  it('cannot insert ready stock', async () => {
    const res = await createAnonClient()
      .from('ready_stock_items')
      .insert({
        name: 'RLS-TEST-SENTINEL-DO-NOT-KEEP',
        price_myr: 1,
        image_url: 'https://res.cloudinary.com/rls-test/sentinel.jpg',
      })
      .select();
    expect(res.error).not.toBeNull();
    expect(res.data ?? []).toEqual([]);
  });

  it('cannot update or delete ready stock', async () => {
    const anon = createAnonClient();
    const items = await fetchReadyStock();
    const targetId = items[0]?.id ?? MISSING_ID;

    const update = await anon
      .from('ready_stock_items')
      .update({ status: 'sold' })
      .eq('id', targetId)
      .select();
    expect(denied(update)).toBe(true);

    const del = await anon.from('ready_stock_items').delete().eq('id', targetId).select();
    expect(denied(del)).toBe(true);

    // Nothing changed.
    expect((await fetchReadyStock()).map((i) => i.id).sort()).toEqual(items.map((i) => i.id).sort());
  });

  it('cannot write product sizes', async () => {
    const anon = createAnonClient();
    const insert = await anon
      .from('product_sizes')
      .insert({ product_id: 'p1', label: 'RLS-TEST-SENTINEL' })
      .select();
    expect(insert.error).not.toBeNull();

    const update = await anon.from('product_sizes').update({ label: 'RLS-TEST-SENTINEL' }).eq('product_id', 'p1').select();
    expect(denied(update)).toBe(true);

    const del = await anon.from('product_sizes').delete().eq('product_id', 'p1').select();
    expect(denied(del)).toBe(true);
  });

  it('cannot read the admin allowlist or call it as an admin', async () => {
    const anon = createAnonClient();
    const { data } = await anon.from('admin_users').select('user_id');
    expect(data ?? []).toEqual([]);

    const { data: isAdmin, error } = await anon.rpc('is_admin');
    expect(error).toBeNull();
    expect(isAdmin).toBe(false);
  });
});
