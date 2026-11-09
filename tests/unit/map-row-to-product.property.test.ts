import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapRowToProduct, type ProductRowWithSizes } from '@/lib/products';
import { formatMyr } from '@/lib/money';

const text = fc.oneof(fc.string(), fc.fullUnicodeString(), fc.constantFrom('', ' ', '\t\n', '  x  ', 'é中😀'));

/** Whole sen, so prices are always valid numeric(10,2) values. */
const priceArb = fc.integer({ min: 0, max: 99_999_999 }).map((sen) => sen / 100);

const sizeArb = fc.record({
  id: fc.uuid(),
  product_id: text,
  label: text,
  sort_order: fc.integer({ min: 0, max: 50 }),
  price_override_myr: fc.option(priceArb, { nil: null }),
  is_active: fc.boolean(),
  created_at: text,
  updated_at: text,
});

const rowArb: fc.Arbitrary<ProductRowWithSizes> = fc.record({
  id: text,
  name: text,
  description_en: text,
  description_ms: text,
  price: fc.option(text, { nil: null }),
  price_myr: priceArb,
  bg: text,
  grid_class: text,
  aspect_class: text,
  image_url: text,
  is_published: fc.boolean(),
  details: fc.constant(null),
  cloudinary_public_id: fc.option(text, { nil: null }),
  sort_order: fc.integer(),
  created_at: text,
  updated_at: text,
  product_sizes: fc.array(sizeArb, { maxLength: 6 }),
});

const PRODUCT_KEYS = [
  'aspectClass',
  'bg',
  'descriptionEn',
  'descriptionMs',
  'details',
  'gridClass',
  'id',
  'imageUrl',
  'name',
  'price',
  'priceMyr',
  'sizes',
];

describe('Property 1: mapRowToProduct contract stability', () => {
  it('always yields the Product contract, preserving values without mutating input', () => {
    fc.assert(
      fc.property(rowArb, (row) => {
        const snapshot = structuredClone(row);
        const p = mapRowToProduct(row);

        expect(Object.keys(p).sort()).toEqual(PRODUCT_KEYS);
        expect(p.id).toBe(row.id);
        expect(p.name).toBe(row.name);
        expect(p.descriptionEn).toBe(row.description_en);
        expect(p.descriptionMs).toBe(row.description_ms);
        expect(p.priceMyr).toBe(row.price_myr);
        expect(p.price).toBe(formatMyr(row.price_myr));
        expect(p.bg).toBe(row.bg);
        expect(p.gridClass).toBe(row.grid_class);
        expect(p.aspectClass).toBe(row.aspect_class);
        expect(p.imageUrl).toBe(row.image_url);

        // Sizes: only active ones, ordered by sort_order.
        const active = (row.product_sizes ?? []).filter((s) => s.is_active);
        expect(p.sizes).toHaveLength(active.length);
        for (let i = 1; i < p.sizes.length; i++) {
          expect(p.sizes[i].sortOrder).toBeGreaterThanOrEqual(p.sizes[i - 1].sortOrder);
        }

        expect(row).toEqual(snapshot);
      }),
      { numRuns: 200 }
    );
  });
});
