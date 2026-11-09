import { describe, it, expect } from 'vitest';
import {
  ProductInput,
  ReadyStockInput,
  detailsToText,
  formDataToObject,
  parseDetailsText,
  parseInput,
} from '@/lib/admin/schemas';

const IMG = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg';

const validBag = {
  name: ' Pesisir Sling ',
  priceMyr: '180',
  imageUrl: IMG,
};

describe('ReadyStockInput', () => {
  it('accepts a minimal bag and applies defaults', () => {
    const result = parseInput(ReadyStockInput, validBag);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      name: 'Pesisir Sling',
      descriptionEn: null,
      descriptionMs: null,
      priceMyr: 180,
      sizeLabel: null,
      imageUrl: IMG,
      cloudinaryPublicId: null,
      status: 'available',
    });
  });

  it('keeps optional fields when present', () => {
    const result = parseInput(ReadyStockInput, {
      ...validBag,
      descriptionEn: ' Nice ',
      sizeLabel: ' Medium ',
      priceMyr: '180.50',
      status: 'sold',
    });
    expect(result.ok && result.data).toMatchObject({
      descriptionEn: 'Nice',
      sizeLabel: 'Medium',
      priceMyr: 180.5,
      status: 'sold',
    });
  });

  it('accepts any https image host (pasted links)', () => {
    expect(parseInput(ReadyStockInput, { ...validBag, imageUrl: 'https://example.com/pic.jpg' }).ok).toBe(true);
  });

  it.each([
    ['name', { name: '   ' }],
    ['name', { name: 'x'.repeat(121) }],
    ['priceMyr', { priceMyr: '' }],
    ['priceMyr', { priceMyr: '-5' }],
    ['priceMyr', { priceMyr: '12.345' }],
    ['priceMyr', { priceMyr: 'abc' }],
    ['priceMyr', { priceMyr: '1e3' }],
    ['imageUrl', { imageUrl: '' }],
    ['imageUrl', { imageUrl: 'http://example.com/a.jpg' }],
    ['imageUrl', { imageUrl: 'javascript:alert(1)' }],
    ['imageUrl', { imageUrl: 'not a url' }],
    ['status', { status: 'reserved' }],
    ['sizeLabel', { sizeLabel: 'x'.repeat(41) }],
  ])('rejects invalid %s', (field, override) => {
    const result = parseInput(ReadyStockInput, { ...validBag, ...override });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors)).toContain(field);
  });

  it('requires an uploaded image to be a Cloudinary URL', () => {
    const bad = parseInput(ReadyStockInput, {
      ...validBag,
      imageUrl: 'https://example.com/a.jpg',
      cloudinaryPublicId: 'fat-rahz/production/abc',
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.fieldErrors.imageUrl).toMatch(/Cloudinary/);

    const good = parseInput(ReadyStockInput, { ...validBag, cloudinaryPublicId: 'fat-rahz/production/abc' });
    expect(good.ok).toBe(true);
  });
});

describe('ProductInput', () => {
  const validProduct = {
    id: 'senja-tote',
    name: 'Senja Tote',
    descriptionEn: 'English',
    descriptionMs: 'Melayu',
    priceMyr: '480',
    imageUrl: IMG,
  };

  it('accepts a minimal product and applies defaults', () => {
    const result = parseInput(ProductInput, validProduct);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      id: 'senja-tote',
      priceMyr: 480,
      bg: '#8B3A3A',
      gridClass: 'col-span-1 lg:col-span-2',
      aspectClass: 'aspect-[4/5]',
      sortOrder: 0,
      isPublished: false,
      details: null,
      sizes: [],
      cloudinaryPublicId: null,
    });
  });

  it('maps the published checkbox', () => {
    const on = parseInput(ProductInput, { ...validProduct, isPublished: 'on' });
    expect(on.ok && on.data.isPublished).toBe(true);
  });

  it.each([['p1'], ['senja-tote'], ['a1-b2-c3']])('accepts id %s', (id) => {
    expect(parseInput(ProductInput, { ...validProduct, id }).ok).toBe(true);
  });

  it.each([[''], ['Senja Tote'], ['UPPER'], ['-lead'], ['trail-'], ['dou--ble'], ['under_score'], ['a/b']])(
    'rejects id %j',
    (id) => {
      const result = parseInput(ProductInput, { ...validProduct, id });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.id).toBeDefined();
    }
  );

  it('requires both descriptions', () => {
    const result = parseInput(ProductInput, { ...validProduct, descriptionMs: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.descriptionMs).toMatch(/required/);
  });

  it('rejects layout values outside the allowed options', () => {
    expect(parseInput(ProductInput, { ...validProduct, gridClass: 'hidden' }).ok).toBe(false);
    expect(parseInput(ProductInput, { ...validProduct, aspectClass: 'aspect-[9/1]' }).ok).toBe(false);
  });

  it('rejects an invalid accent colour and sort order', () => {
    expect(parseInput(ProductInput, { ...validProduct, bg: 'red' }).ok).toBe(false);
    expect(parseInput(ProductInput, { ...validProduct, sortOrder: '-1' }).ok).toBe(false);
    expect(parseInput(ProductInput, { ...validProduct, sortOrder: '2' }).ok).toBe(true);
  });

  describe('sizes', () => {
    const sizes = (value: unknown) => ({ ...validProduct, sizes: JSON.stringify(value) });

    it('parses sizes with and without a price override', () => {
      const result = parseInput(
        ProductInput,
        sizes([
          { label: 'Small', priceOverrideMyr: null, sortOrder: 0 },
          { id: '00000000-0000-4000-8000-000000000001', label: 'Large', priceOverrideMyr: 680, sortOrder: 1 },
        ])
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.sizes).toHaveLength(2);
        expect(result.data.sizes[1].priceOverrideMyr).toBe(680);
      }
    });

    it('treats a missing or empty value as one-size', () => {
      expect(parseInput(ProductInput, { ...validProduct, sizes: '' }).ok).toBe(true);
      expect(parseInput(ProductInput, validProduct).ok).toBe(true);
    });

    it('rejects malformed JSON', () => {
      const result = parseInput(ProductInput, { ...validProduct, sizes: '{nope' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.sizes).toMatch(/invalid/i);
    });

    it('rejects blank labels, negative prices and duplicate labels', () => {
      expect(parseInput(ProductInput, sizes([{ label: ' ', priceOverrideMyr: null, sortOrder: 0 }])).ok).toBe(false);
      expect(parseInput(ProductInput, sizes([{ label: 'S', priceOverrideMyr: -1, sortOrder: 0 }])).ok).toBe(false);
      const dup = parseInput(
        ProductInput,
        sizes([
          { label: 'Small', priceOverrideMyr: null, sortOrder: 0 },
          { label: 'small', priceOverrideMyr: null, sortOrder: 1 },
        ])
      );
      expect(dup.ok).toBe(false);
      if (!dup.ok) expect(dup.fieldErrors.sizes).toMatch(/different/);
    });
  });
});

describe('details helpers', () => {
  it('parses "Label: value" lines and ignores the rest', () => {
    expect(parseDetailsText('Material: Terengganu batik\nno colon here\n: missing label\nLining:  Cotton ')).toEqual({
      Material: 'Terengganu batik',
      Lining: 'Cotton',
    });
  });

  it('keeps colons inside values', () => {
    expect(parseDetailsText('Size: 30 x 20 cm (w:h)')).toEqual({ Size: '30 x 20 cm (w:h)' });
  });

  it('returns null when nothing usable is entered', () => {
    expect(parseDetailsText('')).toBeNull();
    expect(parseDetailsText('just words')).toBeNull();
  });

  it('round-trips through detailsToText', () => {
    const details = { Material: 'Batik', Lining: 'Cotton' };
    expect(parseDetailsText(detailsToText(details))).toEqual(details);
    expect(detailsToText(null)).toBe('');
  });
});

describe('form helpers', () => {
  it('drops file entries when converting FormData', () => {
    const fd = new FormData();
    fd.append('name', 'x');
    fd.append('file', new Blob(['a']), 'a.txt');
    expect(formDataToObject(fd)).toEqual({ name: 'x' });
  });

  it('reports the first message and the first issue per field', () => {
    const result = parseInput(ReadyStockInput, { name: '', priceMyr: '', imageUrl: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
      expect(Object.keys(result.fieldErrors).sort()).toEqual(['imageUrl', 'name', 'priceMyr']);
    }
  });
});
