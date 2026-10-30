'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'en' | 'ms';

const dict = {
  navCollection: { en: 'Collection', ms: 'Koleksi' },
  navCraft: { en: 'Our Craft', ms: 'Kraf Kami' },
  navContact: { en: 'Contact', ms: 'Hubungi' },
  cart: { en: 'Cart', ms: 'Troli' },

  heroEyebrow: { en: 'TERENGGANU BATIK, HANDCRAFTED', ms: 'BATIK TERENGGANU, BUATAN TANGAN' },
  heroHeadline: { en: 'Batik, carried forward', ms: 'Batik, dibawa ke hadapan' },
  heroSubhead: {
    en: 'Wax-resist patterns drawn by hand and dyed by Terengganu artisans, shaped into bags built for everyday carry.',
    ms: 'Corak resis-lilin dilukis tangan dan dicelup oleh pengrajin Terengganu, dibentuk menjadi beg untuk penggunaan harian.',
  },
  heroCta: { en: 'Explore the Collection', ms: 'Lihat Koleksi' },

  collectionHeading: { en: 'The Collection', ms: 'Koleksi Kami' },
  viewAll: { en: 'View All', ms: 'Lihat Semua' },

  product1Desc: { en: 'Indigo & rust wax-dye', ms: 'Celupan lilin indigo & karat' },
  product2Desc: { en: 'Gold-leaf motif', ms: 'Motif daun emas' },
  product3Desc: { en: 'Coastal wave print', ms: 'Cetakan ombak pantai' },
  product4Desc: { en: 'Deep maroon dye', ms: 'Celupan merah marun pekat' },
  product5Desc: { en: 'Midnight indigo', ms: 'Indigo tengah malam' },

  bannerQuote: {
    en: '"Every wax line is drawn by hand — no two bags are ever quite alike."',
    ms: '"Setiap garisan lilin dilukis dengan tangan — tiada dua beg yang sama."',
  },
  bannerAttribution: { en: 'FATRAH ARTISAN WORKSHOP, TERENGGANU', ms: 'BENGKEL PENGRAJIN FATRAH, TERENGGANU' },

  footerBlurb: {
    en: 'Handcrafted Terengganu batik bags, made slowly by artisans who carry the tradition forward.',
    ms: 'Beg batik Terengganu buatan tangan, dibuat perlahan-lahan oleh pengrajin yang meneruskan tradisi ini.',
  },
  footerShop: { en: 'SHOP', ms: 'BELI' },
  footerAbout: { en: 'ABOUT', ms: 'TENTANG' },
  footerFollow: { en: 'FOLLOW', ms: 'IKUTI' },
  footerNewArrivals: { en: 'New Arrivals', ms: 'Ketibaan Baharu' },
  footerGiftCards: { en: 'Gift Cards', ms: 'Kad Hadiah' },
  footerCopyright: { en: '© 2026 FATRAH. Handcrafted in Terengganu, Malaysia.', ms: '© 2026 FATRAH. Dibuat tangan di Terengganu, Malaysia.' },
  footerLeadTime: { en: 'Made to order — allow 2–4 weeks for delivery.', ms: 'Dibuat mengikut tempahan — tempoh 2–4 minggu untuk penghantaran.' },
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
