'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="flex flex-col lg:flex-row items-stretch min-h-[600px] lg:min-h-0">
      <div className="flex-none lg:flex-[0_0_42%] flex flex-col justify-center px-6 py-[50px] lg:p-[60px_60px_60px_40px] xl:pl-[calc(50vw-600px)] order-2 lg:order-1">
        <div className="text-[13px] tracking-[0.06em] text-maroon font-semibold mb-[22px] uppercase">
          {t('heroEyebrow')}
        </div>
        <h1 className="font-serif text-[clamp(40px,5vw,64px)] font-medium leading-[1.05] tracking-[-0.01em] mb-[26px]">
          {t('heroHeadline')}
        </h1>
        <p className="text-[17px] text-ink-soft max-w-full lg:max-w-[380px] mb-[36px]">
          {t('heroSubhead')}
        </p>
        <a 
          href="#collection" 
          className="inline-flex items-center gap-2.5 bg-maroon text-warm-white py-[15px] px-[30px] text-sm font-medium border border-maroon w-fit transition-colors duration-300 hover:bg-maroon-deep"
        >
          {t('heroCta')}
        </a>
      </div>

      <div className="flex-none lg:flex-[0_0_58%] relative overflow-hidden bg-gradient-to-br from-[#cf8a52] via-[#8B3A3A] to-[#4a2632] h-[60vw] min-h-[340px] lg:h-auto order-1 lg:order-2">
        {/* Replace this SVG with real editorial photography — this is a placeholder motif */}
        <svg viewBox="0 0 700 640" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
          <defs>
            <pattern id="batikMotif" width="140" height="140" patternUnits="userSpaceOnUse">
              <circle cx="70" cy="70" r="2" fill="#F3EDE1" opacity="0.5" />
              <path d="M70 30 C90 45, 90 65, 70 80 C50 65, 50 45, 70 30 Z" fill="none" stroke="#F3EDE1" strokeWidth="1.2" opacity="0.45" />
              <path d="M20 20 C35 20 35 35 20 35 C5 35 5 20 20 20 Z" fill="none" stroke="#F3EDE1" strokeWidth="1" opacity="0.3" />
              <path d="M120 100 C135 100 135 115 120 115 C105 115 105 100 120 100 Z" fill="none" stroke="#F3EDE1" strokeWidth="1" opacity="0.3" />
              <path d="M30 110 Q70 90 110 110" stroke="#F3EDE1" strokeWidth="1" fill="none" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="700" height="640" fill="url(#batikMotif)" />
          <circle cx="560" cy="120" r="150" fill="#B8863E" opacity="0.18" />
          <circle cx="90" cy="520" r="200" fill="#4a2632" opacity="0.35" />
        </svg>
      </div>
    </section>
  );
}
