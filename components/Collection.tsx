'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/lib/products';
import PreorderCard from '@/components/PreorderCard';

interface CollectionProps {
  products: Product[];
}

/** Homepage pre-order section (mosaic layout driven by each product's grid classes). */
export default function Collection({ products }: CollectionProps) {
  const { t } = useLanguage();

  return (
    <section className="py-[70px] lg:py-[100px]" id="collection">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between gap-6 mb-9 lg:mb-14 pb-6 border-b border-ink">
          <div>
            <h2 className="font-serif text-[clamp(30px,3.2vw,40px)] font-medium">{t('preorderHeading')}</h2>
            <p className="text-ink-soft text-[15px] mt-2">{t('preorderSub')}</p>
          </div>
          <Link href="/pre-order" className="text-sm font-medium border-b border-ink pb-0.5 whitespace-nowrap">
            {t('viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-7">
          {products.map((p) => (
            <PreorderCard key={p.id} product={p} useGridClass />
          ))}
        </div>
      </div>
    </section>
  );
}
