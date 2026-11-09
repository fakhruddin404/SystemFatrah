'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'en' | 'ms';

// Every entry must stay a plain `{ en: '...', ms: '...' }` literal: the language-toggle
// e2e test reads this file to verify that nothing is left untranslated.
const dict = {
  navPreorder: { en: 'Pre-order', ms: 'Pra-tempah' },
  navReadyStock: { en: 'Ready Stock', ms: 'Stok Sedia Ada' },
  navStory: { en: 'Our Story', ms: 'Kisah Kami' },
  navContact: { en: 'Contact', ms: 'Hubungi' },
  cart: { en: 'Cart', ms: 'Troli' },

  heroEyebrow: { en: 'TERENGGANU BATIK, SEWN INTO BAGS', ms: 'BATIK TERENGGANU, DIJAHIT MENJADI BEG' },
  heroHeadline: { en: 'Heritage batik, sewn for today', ms: 'Batik warisan, dijahit untuk hari ini' },
  heroSubhead: {
    en: 'Fat_Rahz Batik, rooted in Terengganu, turns authentic Terengganu batik into modern, elegant bags for every day. 100% handmade, with care, since 2014.',
    ms: 'Fat_Rahz Batik, berpusat di Terengganu, menukar batik asli Terengganu kepada beg moden yang elegan untuk kegunaan harian. 100% buatan tangan, dijahit dengan teliti sejak 2014.',
  },
  heroCta: { en: 'Browse Pre-order', ms: 'Lihat Pra-tempah' },
  heroCtaSecondary: { en: 'Shop Ready Stock', ms: 'Beli Stok Sedia Ada' },

  preorderHeading: { en: 'Pre-order Collection', ms: 'Koleksi Pra-tempah' },
  preorderSub: {
    en: 'Designs we sew to order, in the size you choose.',
    ms: 'Rekaan yang kami jahit mengikut tempahan, dalam saiz pilihan anda.',
  },
  readyNowHeading: { en: 'Ready now', ms: 'Sedia sekarang' },
  readyNowSub: {
    en: 'One-of-a-kind bags, each with its own batik pattern.',
    ms: 'Beg satu-satunya, setiap satu dengan corak batik tersendiri.',
  },
  viewAll: { en: 'View All', ms: 'Lihat Semua' },

  bannerQuote: {
    en: '"Authentic Terengganu batik deserves to be carried every day."',
    ms: '"Batik asli Terengganu layak dibawa setiap hari."',
  },
  bannerAttribution: { en: 'Fat_Rahz Batik · Terengganu · Since 2014', ms: 'Fat_Rahz Batik · Terengganu · Sejak 2014' },

  footerBlurb: {
    en: 'Modern, elegant bags sewn from authentic Terengganu batik. 100% handmade, with care, since 2014.',
    ms: 'Beg moden yang elegan dijahit daripada batik asli Terengganu. 100% buatan tangan, dengan teliti, sejak 2014.',
  },
  footerShop: { en: 'EXPLORE', ms: 'TEROKA' },
  footerAbout: { en: 'ABOUT', ms: 'TENTANG' },
  footerFollow: { en: 'FOLLOW', ms: 'IKUTI' },
  footerCopyright: { en: '© 2026 Fat_Rahz Batik. Sewn in Terengganu, Malaysia.', ms: '© 2026 Fat_Rahz Batik. Dijahit di Terengganu, Malaysia.' },
  footerLeadTime: { en: 'Pre-order pieces are made to order — allow 2–4 weeks.', ms: 'Barang pra-tempah dibuat mengikut tempahan — tempoh 2–4 minggu.' },
  footerDelivery: { en: 'Delivery fee is confirmed with you on WhatsApp.', ms: 'Kos penghantaran disahkan melalui WhatsApp.' },
} as const;

export type DictKey = keyof typeof dict;

interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
  t: (key: DictKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const toggle = () => setLang((prev) => (prev === 'en' ? 'ms' : 'en'));
  const t = (key: DictKey) => dict[key][lang];

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

/** Exposed for tests that verify every key has both languages. */
export const dictionary = dict;
