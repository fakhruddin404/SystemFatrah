/** Single source of truth for brand name, contact details and external links. */

export const SITE_NAME = 'Fat_Rahz Batik';
export const FOUNDED_YEAR = 2014;

/** Used when NEXT_PUBLIC_WHATSAPP_NUMBER is missing or malformed. */
export const DEFAULT_WHATSAPP_NUMBER = '60132577325';

/** Digits only, country code included (E.164 without the "+"). */
export function resolveWhatsAppNumber(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  return /^\d{8,15}$/.test(value) ? value : DEFAULT_WHATSAPP_NUMBER;
}

// Literal property access so Next.js can inline NEXT_PUBLIC_ variables.
export const WHATSAPP_NUMBER = resolveWhatsAppNumber(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
);

/** Lead time that applies to pre-order items only. */
export const PREORDER_LEAD_TIME = { en: '2–4 weeks', ms: '2–4 minggu' } as const;

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/beg_batik/',
  threads: 'https://www.threads.com/@beg_batik',
  // Shopee tracking parameters (uls_trackid, is_from_login) are intentionally omitted.
  shopee: 'https://shopee.com.my/shop/162336477',
} as const;

/** wa.me link for the business number, optionally with prefilled text. */
export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
