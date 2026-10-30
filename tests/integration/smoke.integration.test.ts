import { describe, it, expect } from 'vitest';

/**
 * Placeholder smoke test for the Vitest integration runner.
 *
 * Its only job is to prove the integration harness executes under the separate
 * `vitest.integration.config.ts` (node environment, `*.integration.test.ts`
 * pattern) without pulling in the unit suite. It is intentionally self-contained
 * and does NOT connect to Supabase, so it passes before any cloud project
 * exists. Real integration tests (fetchProducts ordering, fetchProductById
 * hit/miss, RLS boundary) against the Supabase test project arrive in later
 * tasks and replace this placeholder.
 */
describe('vitest integration harness smoke test', () => {
  it('runs the integration runner in a node environment', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.env).toBe('object');
  });
});
