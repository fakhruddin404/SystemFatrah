// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeedValidationError, seedProducts } from '../../scripts/seed-products';
import {
  MissingEnvError,
  createServiceRoleClient,
  exitOnStartupError,
} from '../../scripts/service-role-client';

const validCsv = readFileSync(
  path.join(__dirname, '..', '..', 'scripts', 'seed-data', 'products.csv'),
  'utf8',
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('seedProducts', () => {
  it('upserts once with 5 snake_case rows for the valid bundled CSV', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    const count = await seedProducts(validCsv, upsert);

    expect(count).toBe(5);
    expect(upsert).toHaveBeenCalledTimes(1);
    const rows = upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    expect(rows[0]).toHaveProperty('description_en');
    expect(rows[0]).toHaveProperty('grid_class');
    expect(rows[0]).toHaveProperty('image_url');
    expect(rows[0]).not.toHaveProperty('descriptionEn');
  });

  it('aborts before any upsert when a middle row (p3) has a bad price', async () => {
    const lines = validCsv.trim().split(/\r?\n/);
    // lines[0] is header; p3 is lines[3]
    lines[3] = lines[3].replace('RM 220', 'free');
    const badCsv = lines.join('\n');
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);

    const err = await seedProducts(badCsv, upsert).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(SeedValidationError);
    expect((err as SeedValidationError).issue.id).toBe('p3');
    expect((err as SeedValidationError).issue.field).toBe('price');
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('service-role startup guard', () => {
  const fakeKey = 'fake-service-role-key-value-123';

  it('throws MissingEnvError naming SUPABASE_SERVICE_ROLE_KEY when the key is absent', () => {
    let caught: unknown;
    try {
      createServiceRoleClient({
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(MissingEnvError);
    expect((caught as MissingEnvError).varName).toBe('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('exitOnStartupError exits with code 1 and does not leak key values', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    exitOnStartupError(new MissingEnvError('SUPABASE_SERVICE_ROLE_KEY'));

    expect(exit).toHaveBeenCalledWith(1);
    const logged = errorLog.mock.calls.flat().join(' ');
    expect(logged).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(logged).not.toContain(fakeKey);
  });
});
