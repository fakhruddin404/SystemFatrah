'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function Banner() {
  const { t } = useLanguage();

  return (
    <section data-testid="banner" className="bg-ink text-warm-white py-[70px] lg:py-[110px] text-center">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <p className="font-serif italic font-normal text-[clamp(24px,3vw,36px)] leading-[1.4] max-w-[780px] mx-auto mb-5">
          {t('bannerQuote')}
        </p>
        <div className="font-sans not-italic text-[13px] text-[#FAF7F1]/60 tracking-[0.05em]">
          {t('bannerAttribution')}
        </div>
      </div>
    </section>
  );
}
