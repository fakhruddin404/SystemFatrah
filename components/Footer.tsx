'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { SITE_NAME, SOCIAL_LINKS, whatsappUrl } from '@/lib/site';

const linkClass = 'text-[14px] text-ink-soft hover:text-ink transition-colors';

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-[90px] pb-[50px]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-[60px] pb-[60px] border-b border-ink/80 mb-[30px] flex-wrap">
          <div className="max-w-[360px]">
            <Link href="/" className="font-serif text-[26px] font-medium tracking-[0.5px] block mb-[18px]">{SITE_NAME}</Link>
            <p className="text-ink-soft text-[15px]">{t('footerBlurb')}</p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-[34px] lg:gap-[80px]">
            <div>
              <h4 className="text-[13px] font-semibold tracking-[0.05em] mb-[18px]">{t('footerShop')}</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/pre-order" className={linkClass}>{t('navPreorder')}</Link></li>
                <li><Link href="/ready-stock" className={linkClass}>{t('navReadyStock')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold tracking-[0.05em] mb-[18px]">{t('footerAbout')}</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/about" className={linkClass}>{t('navStory')}</Link></li>
                <li><External href={whatsappUrl()}>{t('navContact')}</External></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold tracking-[0.05em] mb-[18px]">{t('footerFollow')}</h4>
              <ul className="flex flex-col gap-3">
                <li><External href={SOCIAL_LINKS.instagram}>Instagram</External></li>
                <li><External href={SOCIAL_LINKS.threads}>Threads</External></li>
                <li><External href={SOCIAL_LINKS.shopee}>Shopee</External></li>
                <li><External href={whatsappUrl()}>WhatsApp</External></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-[13px] text-ink-soft flex-wrap gap-3">
          <span>{t('footerCopyright')}</span>
          <span className="flex flex-col sm:flex-row sm:gap-4">
            <span>{t('footerLeadTime')}</span>
            <span>{t('footerDelivery')}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
