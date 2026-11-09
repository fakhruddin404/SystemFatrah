import { describe, it, expect } from 'vitest';
import { mapRowToReadyStockItem, normalizeReadyStockCode } from '@/lib/ready-stock';
import type { ReadyStockRow } from '@/lib/supabase/database.types';

function makeRow(overrides: Partial<ReadyStockRow> = {}): ReadyStockRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'RS-0042',
    name: 'Pesisir Sling',
    description_en: 'English',
    description_ms: 'Melayu',
    price_myr: 180,
    size_label: 'Medium',
    image_url: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
    cloudinary_public_id: 'fat-rahz/production/a',
    status: 'available',
    sold_at: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapRowToReadyStockItem', () => {
  it('maps the public fields and derives the display price', () => {
    expect(mapRowToReadyStockItem(makeRow())).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      code: 'RS-0042',
      name: 'Pesisir Sling',
      descriptionEn: 'English',
      descriptionMs: 'Melayu',
      price: 'RM 180',
      priceMyr: 180,
      sizeLabel: 'Medium',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
    });
  });

  it('treats a blank or missing size as one size', () => {
    expect(mapRowToReadyStockItem(makeRow({ size_label: null })).sizeLabel).toBeNull();
    expect(mapRowToReadyStockItem(makeRow({ size_label: '   ' })).sizeLabel).toBeNull();
    expect(mapRowToReadyStockItem(makeRow({ size_label: ' Large ' })).sizeLabel).toBe('Large');
  });

  it('does not leak admin-only columns to the public shape', () => {
    const item = mapRowToReadyStockItem(makeRow());
    expect(item).not.toHaveProperty('cloudinary_public_id');
    expect(item).not.toHaveProperty('cloudinaryPublicId');
    expect(item).not.toHaveProperty('status');
    expect(item).not.toHaveProperty('soldAt');
  });

  it('accepts price_myr delivered as a numeric string', () => {
    expect(mapRowToReadyStockItem(makeRow({ price_myr: '90.50' as unknown as number })).price).toBe('RM 90.50');
  });
});

describe('normalizeReadyStockCode', () => {
  it('uppercases, trims and decodes URL segments', () => {
    expect(normalizeReadyStockCode('rs-0042')).toBe('RS-0042');
    expect(normalizeReadyStockCode('%20rs-0042%20')).toBe('RS-0042');
  });
});
