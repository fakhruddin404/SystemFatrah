// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  SeedValidationError,
  seedProducts,
  seedReadyStock,
  seedSizes,
  toInsertRows,
  validateRows,
  parseCsv,
} from '../../scripts/seed-products';

const read = (name: string) =>
  readFileSync(path.join(__dirname, '..', '..', 'scripts', 'seed-data', name), 'utf8');

describe('product rows', () => {
  it('writes the numeric price and never the legacy price text', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    await seedProducts(read('products.csv'), upsert);
    const rows = upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows.map((r) => r.price_myr)).toEqual([480, 350, 220, 620, 150]);
    for (const row of rows) expect(row).not.toHaveProperty('price');
  });

  it('keeps fractional prices exact', () => {
    const validation = validateRows(parseCsv(read('products.csv')));
    if (!validation.ok) throw new Error('fixture invalid');
    const rows = toInsertRows([{ ...validation.rows[0], price: 'RM 480.50' }]);
    expect(rows[0].price_myr).toBe(480.5);
  });
});

describe('seedSizes', () => {
  it('maps the bundled CSV, with empty overrides as null', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    const count = await seedSizes(read('product-sizes.csv'), upsert);
    expect(count).toBe(5);
    const rows = upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows[0]).toEqual({ product_id: 'p1', label: 'Medium', sort_order: 0, price_override_myr: null });
    expect(rows[4]).toEqual({ product_id: 'p4', label: 'Large', sort_order: 2, price_override_myr: 680 });
  });

  it('aborts before writing when a row is invalid', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    const bad = 'productId,label,sortOrder,priceOverrideMyr\np1,,0,\n';
    const err = await seedSizes(bad, upsert).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SeedValidationError);
    expect((err as SeedValidationError).issue.field).toBe('label');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects a malformed price override', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    const bad = 'productId,label,sortOrder,priceOverrideMyr\np1,Large,1,abc\n';
    await expect(seedSizes(bad, upsert)).rejects.toBeInstanceOf(SeedValidationError);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('seedReadyStock', () => {
  it('maps the bundled sample bags, with empty size as null', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    const count = await seedReadyStock(read('ready-stock.csv'), upsert);
    expect(count).toBe(3);
    const rows = upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows.map((r) => r.code)).toEqual(['RS-SAMPLE-1', 'RS-SAMPLE-2', 'RS-SAMPLE-3']);
    expect(rows[0]).toMatchObject({ price_myr: 180, size_label: 'Medium' });
    expect(rows[1]).toMatchObject({ price_myr: 120, size_label: null });
  });

  it('uses sample codes that can never collide with generated RS-#### codes', () => {
    for (const code of ['RS-SAMPLE-1', 'RS-SAMPLE-2', 'RS-SAMPLE-3']) {
      expect(code).not.toMatch(/^RS-\d{4,}$/);
    }
  });

  it('rejects non-https images before writing', async () => {
    const upsert = vi.fn(async (rows: unknown[]) => rows.length);
    const bad = 'code,name,descriptionEn,descriptionMs,priceMyr,sizeLabel,imageUrl\nRS-X,Bag,,,100,,http://x.com/a.jpg\n';
    const err = await seedReadyStock(bad, upsert).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SeedValidationError);
    expect((err as SeedValidationError).issue.field).toBe('imageUrl');
    expect(upsert).not.toHaveBeenCalled();
  });
});
