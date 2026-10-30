import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchProductById, fetchProducts } from '@/lib/products';

/**
 * Property 4: Fail-soft reads
 * **Validates: Requirements 10.1, 10.2, 10.4**
 *
 * Read failures must never throw: fetchProducts -> [], fetchProductById -> undefined,
 * with a `[products]` console.error that never contains key values. Read-only; no DB writes.
 */

// Captured at import time (after setup-env has run), before any stubbing.
const REAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const FAKE_KEY = 'fake-anon-key-for-fail-soft-test';
const BOGUS_KEY = 'not-a-real-key';

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function loggedText(): string {
  return errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
}

async function assertFailSoft(keys: string[]) {
  await expect(fetchProducts()).resolves.toEqual([]);
  await expect(fetchProductById('any-id')).resolves.toBeUndefined();

  expect(errorSpy).toHaveBeenCalled();
  const text = loggedText();
  expect(text).toContain('[products]');
  for (const key of keys.filter(Boolean)) {
    expect(text).not.toContain(key);
  }
}

describe('fail-soft reads (Property 4)', () => {
  it('returns [] / undefined when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    await assertFailSoft([]);
  });

  it('returns [] / undefined when the host is unreachable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://invalid.invalid');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', FAKE_KEY);
    await assertFailSoft([FAKE_KEY]);
  }, 30000);

  it.skipIf(!REAL_URL)(
    'returns [] / undefined when the server rejects a bogus key (401)',
    async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', REAL_URL as string);
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', BOGUS_KEY);
      await assertFailSoft([BOGUS_KEY]);
    },
    30000
  );
});
