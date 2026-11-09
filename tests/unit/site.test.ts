import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WHATSAPP_NUMBER,
  SITE_NAME,
  SOCIAL_LINKS,
  WHATSAPP_NUMBER,
  resolveWhatsAppNumber,
  whatsappUrl,
} from '@/lib/site';

describe('lib/site', () => {
  it('uses the exact brand name', () => {
    expect(SITE_NAME).toBe('Fat_Rahz Batik');
  });

  describe('resolveWhatsAppNumber', () => {
    it('accepts digit-only numbers', () => {
      expect(resolveWhatsAppNumber('60123456789')).toBe('60123456789');
      expect(resolveWhatsAppNumber(' 60123456789 ')).toBe('60123456789');
    });

    it.each([[undefined], [''], ['+60123456789'], ['0123-456'], ['abc'], ['123'], ['1'.repeat(16)]])(
      'falls back to the default for %j',
      (raw) => {
        expect(resolveWhatsAppNumber(raw as string | undefined)).toBe(DEFAULT_WHATSAPP_NUMBER);
      }
    );

    it('exposes a valid number', () => {
      expect(WHATSAPP_NUMBER).toMatch(/^\d{8,15}$/);
    });
  });

  describe('SOCIAL_LINKS', () => {
    it('are https URLs', () => {
      for (const url of Object.values(SOCIAL_LINKS)) {
        expect(new URL(url).protocol).toBe('https:');
      }
    });

    it('points at the confirmed profiles', () => {
      expect(SOCIAL_LINKS.instagram).toBe('https://www.instagram.com/beg_batik/');
      expect(SOCIAL_LINKS.threads).toBe('https://www.threads.com/@beg_batik');
      expect(SOCIAL_LINKS.shopee).toBe('https://shopee.com.my/shop/162336477');
    });

    it('keeps tracking parameters out of the Shopee link', () => {
      expect(SOCIAL_LINKS.shopee).not.toMatch(/uls_trackid|is_from_login|\?/);
    });
  });

  describe('whatsappUrl', () => {
    it('links to the business number', () => {
      expect(whatsappUrl()).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    });

    it('encodes the prefilled text', () => {
      const url = new URL(whatsappUrl('Hello & welcome\nline 2'));
      expect(url.searchParams.get('text')).toBe('Hello & welcome\nline 2');
    });
  });
});
