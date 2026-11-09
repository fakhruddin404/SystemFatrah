import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatMyr, fromSen, parseMyr, toSen } from '@/lib/money';

describe('formatMyr', () => {
  it('omits decimals for whole amounts', () => {
    expect(formatMyr(480)).toBe('RM 480');
    expect(formatMyr(0)).toBe('RM 0');
  });

  it('shows two decimals for fractional amounts', () => {
    expect(formatMyr(480.5)).toBe('RM 480.50');
    expect(formatMyr(0.07)).toBe('RM 0.07');
  });

  it('always shows two decimals when fixed', () => {
    expect(formatMyr(960, { fixed: true })).toBe('RM 960.00');
    expect(formatMyr(960.5, { fixed: true })).toBe('RM 960.50');
  });

  it('treats non-finite values as zero', () => {
    expect(formatMyr(Number.NaN)).toBe('RM 0');
    expect(formatMyr(Number.POSITIVE_INFINITY)).toBe('RM 0');
  });
});

describe('parseMyr', () => {
  it.each([
    ['RM 480', 480],
    ['RM480.50', 480.5],
    ['480', 480],
    ['', 0],
    ['free', 0],
  ])('parses %j as %d', (input, expected) => {
    expect(parseMyr(input)).toBe(expected);
  });

  it('round-trips with formatMyr', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 99_999_999 }), (sen) => {
        const amount = sen / 100;
        expect(parseMyr(formatMyr(amount))).toBe(amount);
      })
    );
  });
});

describe('sen conversion', () => {
  it('avoids floating-point drift', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(fromSen(toSen(0.1) + toSen(0.2))).toBe(0.3);
  });

  it('round-trips whole sen', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 99_999_999 }), (sen) => {
        expect(toSen(fromSen(sen))).toBe(sen);
      })
    );
  });
});
