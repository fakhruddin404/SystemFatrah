import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapRowToProduct } from '@/lib/products';
import type { ProductRow } from '@/lib/supabase/database.types';

const text = fc.oneof(fc.string(), fc.fullUnicodeString(), fc.constantFrom('', ' ', '\t\n', '  x  ', 'é中😀'));

const rowArb: fc.Arbitrary<ProductRow> = fc.record({
  id: text,
  name: text,
  description_en: text,
  description_ms: text,
  price: text,
  bg: text,
  grid_class: text,
  aspect_class: text,
  image_url: text,
  sort_order: fc.integer(),
  created_at: text,
  updated_at: text,
});

const PRODUCT_KEYS = [
  'aspectClass',
  'bg',
  'descriptionEn',
  'descriptionMs',
  'gridClass',
  'id',
  'imageUrl',
  'name',
  'price',
];

describe('Property 1: mapRowToProduct contract stability', () => {
  // **Validates: Requirements 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5**
  it('always yields the 9-key Product contract, preserving values without mutating input', () => {
    fc.assert(
      fc.property(rowArb, (row) => {
        const snapshot = structuredClone(row);
        const p = mapRowToProduct(row);

        expect(Object.keys(p).sort()).toEqual(PRODUCT_KEYS);
        for (const v of Object.values(p)) expect(typeof v).toBe('string');

        expect(p.id).toBe(row.id);
        expect(p.name).toBe(row.name);
        expect(p.descriptionEn).toBe(row.description_en);
        expect(p.descriptionMs).toBe(row.description_ms);
        expect(p.price).toBe(row.price);
        expect(p.bg).toBe(row.bg);
        expect(p.gridClass).toBe(row.grid_class);
        expect(p.aspectClass).toBe(row.aspect_class);
        expect(p.imageUrl).toBe(row.image_url);

        expect(row).toEqual(snapshot);
      }),
      { numRuns: 200 }
    );
  });
});
