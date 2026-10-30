import { describe, it, expect } from 'vitest';
import { createAnonClient } from '@/lib/supabase/anon';
import { fetchProducts, fetchProductById } from '@/lib/products';

/**
 * Read-only integration tests against the Supabase project.
 * Validates: Requirements 14.4, 14.5, 2.4, 2.5, 2.6, 2.7
 */
const hasEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!hasEnv) {
  console.warn(
    '[products.integration] Skipping: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set.'
  );
}

describe.skipIf(!hasEnv)('products data access (Supabase)', () => {
  async function directOrdered() {
    const { data, error } = await createAnonClient()
      .from('products')
      .select('id, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw new Error(`direct query failed: ${error.message}`);
    return data ?? [];
  }

  it('fetchProducts returns rows ordered by sort_order then id', async () => {
    const [products, direct] = await Promise.all([
      fetchProducts(),
      directOrdered(),
    ]);
    expect(direct.length).toBeGreaterThan(0);
    expect(products.map((p) => p.id)).toEqual(direct.map((r) => r.id));

    // Direct data is non-decreasing by sort_order, with id ascending on ties.
    for (let i = 1; i < direct.length; i++) {
      const a = direct[i - 1];
      const b = direct[i];
      expect(b.sort_order).toBeGreaterThanOrEqual(a.sort_order);
      if (a.sort_order === b.sort_order) {
        expect(a.id < b.id).toBe(true);
      }
    }
  });

  it('fetchProductById returns a matching Product for an existing id', async () => {
    const products = await fetchProducts();
    expect(products.length).toBeGreaterThan(0);
    const expected = products[0];
    const found = await fetchProductById(expected.id);
    expect(found).toEqual(expected);
  });

  it('fetchProductById returns undefined for a missing id', async () => {
    const id = `does-not-exist-${Math.random().toString(36).slice(2)}`;
    expect(await fetchProductById(id)).toBeUndefined();
  });
});
