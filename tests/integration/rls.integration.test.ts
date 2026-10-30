import { describe, it, expect, beforeAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAnonClient } from '@/lib/supabase/anon';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Integration test: RLS anon read/write boundary.
 *
 * Feature: production-stack-migration, Property 2: Read-only anon
 * **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 14.6**
 *
 * Uses ONLY the anon key. With RLS enabled and only a SELECT policy, the anon
 * client must be able to read, while INSERT / UPDATE / DELETE are each denied
 * and leave the table unchanged.
 *
 * Postgres/PostgREST nuance: INSERT without a policy raises an RLS error
 * (42501); UPDATE/DELETE without a policy usually return no error but touch 0
 * rows. "Denied" is therefore: an error, OR zero rows returned. In every case a
 * full-table snapshot comparison is the authoritative check.
 *
 * SAFETY: this may run against a real project. If RLS were broken, a write
 * could succeed; every write uses a clearly marked sentinel and the test fails
 * loudly, printing the affected row(s) so they can be restored.
 */

const hasEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type Row = Database['public']['Tables']['products']['Row'];

const SENTINEL = 'RLS-TEST-SENTINEL-DO-NOT-KEEP';

function breach(op: string, detail: unknown, snapshot: unknown): string {
  return (
    `RLS BREACH: anon ${op} appears to have SUCCEEDED. Check RLS on public.products ` +
    `immediately (only a SELECT policy should exist) and restore data from this snapshot.\n` +
    `Detail: ${JSON.stringify(detail)}\nSnapshot before the operation: ${JSON.stringify(snapshot)}`
  );
}

describe.skipIf(!hasEnv)('RLS anon read/write boundary (Property 2: Read-only anon)', () => {
  let anon: SupabaseClient<Database>;

  async function snapshot(): Promise<Row[]> {
    const { data, error } = await anon
      .from('products')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw new Error(`Snapshot SELECT failed: ${error.message}`);
    return (data ?? []) as Row[];
  }

  beforeAll(() => {
    anon = createAnonClient();
  });

  it('allows SELECT and returns rows', async () => {
    const rows = await snapshot();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('denies INSERT and leaves the table unchanged', async () => {
    const before = await snapshot();
    const id = `rls-test-${Math.random().toString(36).slice(2, 10)}`;

    const { data, error } = await anon
      .from('products')
      .insert({
        id,
        name: SENTINEL,
        description_en: SENTINEL,
        description_ms: SENTINEL,
        price: 'RM 0',
        bg: '#000000',
        grid_class: SENTINEL,
        aspect_class: SENTINEL,
        image_url: 'https://res.cloudinary.com/rls-test/sentinel.jpg',
        sort_order: 9999,
      })
      .select();

    const after = await snapshot();
    if (after.some((r) => r.id === id) || (!error && data && data.length > 0)) {
      throw new Error(breach('INSERT', { id, data }, before));
    }
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
    expect(after).toEqual(before);
  });

  it('denies UPDATE on a nonexistent sentinel id and on an existing row', async () => {
    const before = await snapshot();
    expect(before.length).toBeGreaterThan(0);

    // 1) Nonexistent sentinel row: safe even if RLS were broken.
    const missing = await anon
      .from('products')
      .update({ name: SENTINEL })
      .eq('id', `rls-test-${Math.random().toString(36).slice(2, 10)}`)
      .select();
    expect(missing.error !== null || (missing.data ?? []).length === 0).toBe(true);

    // 2) Existing row, sentinel value, snapshot compared afterwards.
    const target = before[0];
    const res = await anon
      .from('products')
      .update({ name: SENTINEL })
      .eq('id', target.id)
      .select();

    const after = await snapshot();
    if ((!res.error && (res.data ?? []).length > 0) || JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error(breach('UPDATE', { id: target.id, data: res.data }, target));
    }
    expect(res.error !== null || (res.data ?? []).length === 0).toBe(true);
    expect(after).toEqual(before);
  });

  it('denies DELETE on a nonexistent sentinel id and on an existing row', async () => {
    const before = await snapshot();
    expect(before.length).toBeGreaterThan(0);

    // 1) Nonexistent sentinel row first.
    const missing = await anon
      .from('products')
      .delete()
      .eq('id', `rls-test-${Math.random().toString(36).slice(2, 10)}`)
      .select();
    expect(missing.error !== null || (missing.data ?? []).length === 0).toBe(true);

    // 2) Existing row, snapshot compared afterwards.
    const target = before[before.length - 1];
    const res = await anon.from('products').delete().eq('id', target.id).select();

    const after = await snapshot();
    if ((!res.error && (res.data ?? []).length > 0) || JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error(breach('DELETE', { id: target.id, data: res.data }, target));
    }
    expect(res.error !== null || (res.data ?? []).length === 0).toBe(true);
    expect(after).toEqual(before);
  });
});
