import { describe, it, expect } from 'vitest';
import { mapRowToProduct, type ProductRowWithSizes } from '@/lib/products';
import type { ProductSizeRow } from '@/lib/supabase/database.types';

function makeRow(overrides: Partial<ProductRowWithSizes> = {}): ProductRowWithSizes {
  return {
    id: 'songket-clutch',
    name: 'Songket Clutch',
    description_en: 'English description',
    description_ms: 'Penerangan Bahasa Melayu',
    price: 'RM 480',
    price_myr: 480,
    bg: '#8B3A3A',
    grid_class: 'col-span-1 lg:col-span-2',
    aspect_class: 'aspect-[4/5]',
    image_url: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
    is_published: true,
    details: null,
    cloudinary_public_id: null,
    sort_order: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    product_sizes: [],
    ...overrides,
  };
}

function makeSize(overrides: Partial<ProductSizeRow> = {}): ProductSizeRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    product_id: 'songket-clutch',
    label: 'Small',
    sort_order: 0,
    price_override_myr: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapRowToProduct', () => {
  it('maps snake_case fields to camelCase and derives the display price', () => {
    expect(mapRowToProduct(makeRow())).toEqual({
      id: 'songket-clutch',
      name: 'Songket Clutch',
      descriptionEn: 'English description',
      descriptionMs: 'Penerangan Bahasa Melayu',
      price: 'RM 480',
      priceMyr: 480,
      bg: '#8B3A3A',
      gridClass: 'col-span-1 lg:col-span-2',
      aspectClass: 'aspect-[4/5]',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
      details: null,
      sizes: [],
    });
  });

  it('derives the display price from price_myr, ignoring the legacy price text', () => {
    expect(mapRowToProduct(makeRow({ price: 'stale', price_myr: 350 })).price).toBe('RM 350');
    expect(mapRowToProduct(makeRow({ price: null, price_myr: 350 })).price).toBe('RM 350');
    expect(mapRowToProduct(makeRow({ price_myr: 480.5 })).price).toBe('RM 480.50');
  });

  it('accepts price_myr delivered as a numeric string', () => {
    const result = mapRowToProduct(makeRow({ price_myr: '220.00' as unknown as number }));
    expect(result.priceMyr).toBe(220);
    expect(result.price).toBe('RM 220');
  });

  it('passes imageUrl through exactly', () => {
    const url = ' https://res.cloudinary.com/demo/a.jpg?x=1&y=2#z ';
    expect(mapRowToProduct(makeRow({ image_url: url })).imageUrl).toBe(url);
  });

  describe('sizes', () => {
    it('returns no sizes for a one-size product', () => {
      expect(mapRowToProduct(makeRow({ product_sizes: null })).sizes).toEqual([]);
      expect(mapRowToProduct(makeRow({ product_sizes: undefined })).sizes).toEqual([]);
    });

    it('maps, sorts by sort_order then label, and keeps null overrides', () => {
      const sizes = [
        makeSize({ id: 'c', label: 'Large', sort_order: 2, price_override_myr: 680 }),
        makeSize({ id: 'b', label: 'Medium', sort_order: 1 }),
        makeSize({ id: 'a2', label: 'Beta', sort_order: 0 }),
        makeSize({ id: 'a1', label: 'Alpha', sort_order: 0 }),
      ];
      const result = mapRowToProduct(makeRow({ product_sizes: sizes })).sizes;
      expect(result.map((s) => s.label)).toEqual(['Alpha', 'Beta', 'Medium', 'Large']);
      expect(result.find((s) => s.label === 'Large')?.priceMyr).toBe(680);
      expect(result.find((s) => s.label === 'Medium')?.priceMyr).toBeNull();
    });

    it('drops inactive sizes', () => {
      const sizes = [makeSize({ label: 'Hidden', is_active: false }), makeSize({ id: 'x', label: 'Shown' })];
      expect(mapRowToProduct(makeRow({ product_sizes: sizes })).sizes.map((s) => s.label)).toEqual(['Shown']);
    });
  });

  describe('details', () => {
    it('keeps non-empty string values only', () => {
      const details = { Material: 'Terengganu batik', Empty: '  ', Count: 3 as unknown as string };
      expect(mapRowToProduct(makeRow({ details })).details).toEqual({ Material: 'Terengganu batik' });
    });

    it.each([[null], [[]], ['text'], [42], [{}]])('returns null for %j', (details) => {
      expect(mapRowToProduct(makeRow({ details: details as never })).details).toBeNull();
    });
  });

  it('does not mutate the input row and returns a new object each call', () => {
    const row = makeRow({ product_sizes: [makeSize()] });
    const snapshot = structuredClone(row);
    Object.freeze(row);
    expect(() => mapRowToProduct(row)).not.toThrow();
    expect(row).toEqual(snapshot);
    expect(mapRowToProduct(row)).not.toBe(mapRowToProduct(row));
  });
});
