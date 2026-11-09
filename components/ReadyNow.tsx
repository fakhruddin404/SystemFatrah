'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { ReadyStockItem } from '@/lib/ready-stock';
import ReadyStockCard from '@/components/ReadyStockCard';

/** Homepage strip with the latest available one-of-a-kind bags. Renders nothing when there are none. */
export default function ReadyNow({ items }: { items: ReadyStockItem[] }) {
  const { t } = useLanguage();
  if (items.length === 0) return null;

  return (
    <section className="py-[70px] lg:py-[100px] bg-warm-white border-y border-ink" id="ready-now">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between gap-6 mb-9 lg:mb-14 pb-6 border-b border-ink">
          <div>
            <h2 className="font-serif text-[clamp(30px,3.2vw,40px)] font-medium">{t('readyNowHeading')}</h2>
            <p className="text-ink-soft text-[15px] mt-2">{t('readyNowSub')}</p>
          </div>
          <Link href="/ready-stock" className="text-sm font-medium border-b border-ink pb-0.5 whitespace-nowrap">
            {t('viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
          {items.map((item) => (
            <ReadyStockCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
