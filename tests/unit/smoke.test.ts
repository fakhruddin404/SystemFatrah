import { describe, it, expect } from 'vitest';

/**
 * Placeholder smoke test for the Vitest unit runner.
 *
 * Its only job is to prove the unit harness executes (jsdom environment,
 * globals, path alias resolution) with no network access. Real unit tests for
 * `mapRowToProduct`, the seed validator, and WhatsApp formatting arrive in
 * later tasks and replace the need for this placeholder.
 */
describe('vitest unit harness smoke test', () => {
  it('runs the unit runner', () => {
    expect(1 + 1).toBe(2);
  });

  it('exposes a jsdom document', () => {
    expect(typeof document).toBe('object');
    expect(document).not.toBeNull();
  });
});
