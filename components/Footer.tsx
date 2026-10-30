'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-[90px] pb-[50px]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-[60px] pb-[60px] border-b border-line mb-[30px] flex-wrap">
          <div className="max-w-[360px]">
            <a href="#" className="font-serif text-[26px] font-medium tracking-[0.5px] block mb-[18px]">FATRAH</a>
            <p className="text-ink-soft text-[15px]">{t('footerBlurb')}</p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-[34px] lg:gap-[80px]">
            <div>
              <h4 className="text-[13px] font-semibold tracking-[0.05em] mb-[18px]">{t('footerShop')}</h4>
              <ul className="flex flex-col gap-3">
                <li><a href="#collection" className="text-[14px] text-ink-soft hover:text-ink transition-colors">{t('navCollection')}</a></li>
                <li><a href="#" className="text-[14px] text-ink-soft hover:text-ink transition-colors">{t('footerNewArrivals')}</a></li>
                <li><a href="#" className="text-[14px] text-ink-soft hover:text-ink transition-colors">{t('footerGiftCards')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold tracking-[0.05em] mb-[18px]">{t('footerAbout')}</h4>
              <ul className="flex flex-col gap-3">
                <li><a href="/craft" className="text-[14px] text-ink-soft hover:text-ink transition-colors">{t('navCraft')}</a></li>
                <li><a href="#" className="text-[14px] text-ink-soft hover:text-ink transition-colors">{t('navContact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold tracking-[0.05em] mb-[18px]">{t('footerFollow')}</h4>
              <ul className="flex flex-col gap-3">
                <li><a href="#" className="text-[14px] text-ink-soft hover:text-ink transition-colors">Instagram</a></li>
                <li><a href="#" className="text-[14px] text-ink-soft hover:text-ink transition-colors">WhatsApp</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-[13px] text-ink-soft flex-wrap gap-3">
          <span>{t('footerCopyright')}</span>
          <span>{t('footerLeadTime')}</span>
        </div>
      </div>
    </footer>
  );
}
