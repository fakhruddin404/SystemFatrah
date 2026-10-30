import { describe, it, expect } from 'vitest';
import { mapRowToProduct } from '@/lib/products';
import type { ProductRow } from '@/lib/supabase/database.types';

/** Validates: Requirements 14.1, 3.3, 3.4, 3.5 */
function makeRow(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'songket-clutch',
    name: 'Songket Clutch',
    description_en: 'English description',
    description_ms: 'Penerangan Bahasa Melayu',
    price: 'RM 480',
    bg: 'bg-sand',
    grid_class: 'md:col-span-2',
    aspect_class: 'aspect-[4/5]',
    image_url: 'https://images.unsplash.com/photo-1?w=800&q=80',
    sort_order: 3,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('mapRowToProduct', () => {
  it('maps snake_case fields to camelCase for every field', () => {
    const row = makeRow();
    expect(mapRowToProduct(row)).toEqual({
      id: 'songket-clutch',
      name: 'Songket Clutch',
      descriptionEn: 'English description',
      descriptionMs: 'Penerangan Bahasa Melayu',
      price: 'RM 480',
      bg: 'bg-sand',
      gridClass: 'md:col-span-2',
      aspectClass: 'aspect-[4/5]',
      imageUrl: 'https://images.unsplash.com/photo-1?w=800&q=80',
    });
  });

  it('passes price through exactly, without trimming or coercion', () => {
    const result = mapRowToProduct(makeRow({ price: ' RM 480 ' }));
    expect(result.price).toBe(' RM 480 ');
    expect(mapRowToProduct(makeRow({ price: '480' })).price).toBe('480');
    expect(mapRowToProduct(makeRow({ price: '' })).price).toBe('');
  });

  it('passes imageUrl through exactly, including query strings and whitespace', () => {
    const url = ' https://images.unsplash.com/photo-9?w=800&q=80&fit=crop#x ';
    expect(mapRowToProduct(makeRow({ image_url: url })).imageUrl).toBe(url);
    expect(mapRowToProduct(makeRow({ image_url: '' })).imageUrl).toBe('');
  });

  it('returns exactly the 9 Product keys with no extra row columns', () => {
    const result = mapRowToProduct(makeRow());
    expect(Object.keys(result).sort()).toEqual(
      [
        'aspectClass',
        'bg',
        'descriptionEn',
        'descriptionMs',
        'gridClass',
        'id',
        'imageUrl',
        'name',
        'price',
      ].sort()
    );
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
    expect(result).not.toHaveProperty('sort_order');
  });

  it('does not mutate the input row', () => {
    const row = makeRow({ price: ' RM 480 ' });
    const snapshot = structuredClone(row);
    Object.freeze(row);
    expect(() => mapRowToProduct(row)).not.toThrow();
    expect(row).toEqual(snapshot);
  });

  it('returns a new object each call', () => {
    const row = makeRow();
    expect(mapRowToProduct(row)).not.toBe(mapRowToProduct(row));
  });
});
