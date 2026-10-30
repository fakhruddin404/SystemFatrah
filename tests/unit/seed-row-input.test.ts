import { describe, expect, it } from 'vitest';
import { SeedRowInput } from '@/scripts/seed-row-input';

const valid = {
  id: 'p1',
  name: 'Batik Tote',
  descriptionEn: 'A handcrafted tote',
  descriptionMs: 'Beg tote buatan tangan',
  price: 'RM 480',
  bg: '#aabbcc',
  gridClass: 'col-span-1',
  aspectClass: 'aspect-square',
  imageUrl: 'https://images.unsplash.com/photo-1',
};

describe('SeedRowInput', () => {
  it.each([
    ['base row', {}],
    ['price without space', { price: 'RM480' }],
    ['price with decimals', { price: 'RM 480.50' }],
    ['uppercase hex bg', { bg: '#AABB09' }],
  ])('accepts valid input: %s', (_label, override) => {
    expect(SeedRowInput.safeParse({ ...valid, ...override }).success).toBe(true);
  });

  it('trims required text fields', () => {
    const result = SeedRowInput.parse({ ...valid, name: '  Tote  ' });
    expect(result.name).toBe('Tote');
  });

  it.each([
    ['price', 'USD 480'],
    ['price', '480'],
    ['price', 'RM 480.5'],
    ['price', 'rm 480'],
    ['price', 'RM'],
    ['bg', '#abc'],
    ['bg', 'aabbcc'],
    ['bg', '#gggggg'],
    ['bg', '#aabbccdd'],
    ['imageUrl', 'not a url'],
    ['imageUrl', 'http://example.com/a.jpg'],
    ['imageUrl', 'ftp://example.com/a.jpg'],
    ['imageUrl', '/images/a.jpg'],
    ['imageUrl', ''],
    ['id', ''],
    ['id', '   '],
    ['name', ''],
    ['name', '   '],
    ['descriptionEn', ''],
    ['descriptionEn', ' \t '],
    ['descriptionMs', ''],
    ['descriptionMs', '   '],
    ['gridClass', ''],
    ['gridClass', '  '],
    ['aspectClass', ''],
    ['aspectClass', '  '],
  ])('rejects invalid %s = %j and names the field', (field, value) => {
    const result = SeedRowInput.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path[0])).toContain(field);
    }
  });

  it('rejects a missing required field and names it', () => {
    const { name: _name, ...rest } = valid;
    const result = SeedRowInput.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });
});
