import { describe, it, expect } from 'vitest';
import { dictionary } from '@/context/LanguageContext';
import { aboutContent } from '@/content/about';

/** Collects every string in a nested structure. */
function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

/** Finds every { en, ms } pair in a nested structure. */
function bilingualPairs(value: unknown, path = 'root'): { path: string; en: string; ms: string }[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => bilingualPairs(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.en === 'string' && typeof obj.ms === 'string') {
      return [{ path, en: obj.en, ms: obj.ms }];
    }
    return Object.entries(obj).flatMap(([k, v]) => bilingualPairs(v, `${path}.${k}`));
  }
  return [];
}

// Claims from the previous brand story that are not true for Fat_Rahz Batik.
const RETIRED_CLAIMS = /hamzah|mek weh|banggol|natural dye|dye bath|\bboil|generations|artisans?\b|wax|canting|head artisan/i;

describe('dictionary', () => {
  const entries = Object.entries(dictionary);

  it('has both languages for every key', () => {
    expect(entries.length).toBeGreaterThan(10);
    for (const [key, pair] of entries) {
      expect(pair.en.trim(), `${key} (en)`).not.toBe('');
      expect(pair.ms.trim(), `${key} (ms)`).not.toBe('');
    }
  });

  it('translates every sentence-length string (en differs from ms)', () => {
    for (const [key, pair] of entries) {
      if (pair.en.length > 12) expect(pair.ms, key).not.toBe(pair.en);
    }
  });

  it('uses the exact brand name and none of the retired claims', () => {
    const text = allStrings(dictionary).join('\n');
    expect(text).toContain('Fat_Rahz Batik');
    expect(text).not.toMatch(/fatrah/i);
    expect(text).not.toMatch(RETIRED_CLAIMS);
  });

  it('restricts the lead time to pre-order wording', () => {
    expect(dictionary.footerLeadTime.en).toMatch(/pre-order/i);
    expect(dictionary.footerLeadTime.ms).toMatch(/pra-tempah/i);
  });

  it('tells customers delivery is confirmed on WhatsApp', () => {
    expect(dictionary.footerDelivery.en).toMatch(/WhatsApp/);
    expect(dictionary.footerDelivery.ms).toMatch(/WhatsApp/);
  });
});

describe('about content', () => {
  const pairs = bilingualPairs(aboutContent);

  it('has both languages everywhere', () => {
    expect(pairs.length).toBeGreaterThan(15);
    for (const p of pairs) {
      expect(p.en.trim(), `${p.path} (en)`).not.toBe('');
      expect(p.ms.trim(), `${p.path} (ms)`).not.toBe('');
    }
  });

  it('states the confirmed facts', () => {
    const en = pairs.map((p) => p.en).join(' ');
    const ms = pairs.map((p) => p.ms).join(' ');
    expect(en).toMatch(/2014/);
    expect(en).toMatch(/Terengganu/);
    expect(en).toMatch(/100% handmade/i);
    expect(en).toMatch(/all age/i);
    expect(ms).toMatch(/2014/);
    expect(ms).toMatch(/100% buatan tangan/i);
  });

  it('says plainly that the batik fabric is not made by us', () => {
    expect(aboutContent.sourcing.body.en).toMatch(/do not make the batik fabric/i);
    expect(aboutContent.sourcing.body.ms).toMatch(/tidak menghasilkan kain batik/i);
  });

  it('describes four process steps without unverified specifics', () => {
    expect(aboutContent.steps).toHaveLength(4);
    const text = allStrings(aboutContent.steps).join(' ');
    expect(text).not.toMatch(/brass|zip|reinforced|hardware|lining|leather/i);
  });

  it('contains none of the retired claims', () => {
    expect(allStrings(aboutContent).join('\n')).not.toMatch(RETIRED_CLAIMS);
  });
});
