'use client';

import type { Product } from '@/lib/products';
import type { ReadyStockItem } from '@/lib/ready-stock';
import { useLanguage } from '@/context/LanguageContext';
import PreorderCard from '@/components/PreorderCard';
import ReadyStockCard from '@/components/ReadyStockCard';

function CatalogHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div className="mb-10 lg:mb-14 pb-8 border-b border-ink">
      <p className="text-xs font-semibold tracking-[0.12em] text-maroon uppercase mb-4">{eyebrow}</p>
      <h1 className="font-serif text-[clamp(34px,4.5vw,56px)] font-medium leading-[1.08] mb-4">{title}</h1>
      <p className="text-ink-soft text-[16px] max-w-2xl">{intro}</p>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="border border-ink bg-warm-white p-12 text-center">
      <p className="font-serif text-xl mb-2">{title}</p>
      <p className="text-ink-soft text-[15px]">{hint}</p>
    </div>
  );
}

/** Body of /pre-order. */
export function PreorderCatalog({ products }: { products: Product[] }) {
  const { lang, t } = useLanguage();
  return (
    <>
      <CatalogHeader
        eyebrow={t('navPreorder')}
        title={t('preorderHeading')}
        intro={
          lang === 'en'
            ? 'Choose a design and we will sew it for you. Pre-order pieces are made to order, so allow 2–4 weeks.'
            : 'Pilih rekaan dan kami jahitkan untuk anda. Barang pra-tempah dibuat mengikut tempahan, jadi sila beri tempoh 2–4 minggu.'
        }
      />
      {products.length === 0 ? (
        <EmptyState
          title={lang === 'en' ? 'No designs available right now' : 'Tiada rekaan buat masa ini'}
          hint={lang === 'en' ? 'Please check back soon.' : 'Sila lawati semula tidak lama lagi.'}
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8">
          {products.map((p) => (
            <PreorderCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}

/** Body of /ready-stock. */
export function ReadyStockCatalog({ items }: { items: ReadyStockItem[] }) {
  const { lang, t } = useLanguage();
  return (
    <>
      <CatalogHeader
        eyebrow={t('navReadyStock')}
        title={t('readyNowHeading')}
        intro={
          lang === 'en'
            ? 'Each bag is one of a kind, with its own batik pattern. Pick the one you love and order it on WhatsApp.'
            : 'Setiap beg adalah satu-satunya, dengan corak batik tersendiri. Pilih yang anda suka dan buat pesanan melalui WhatsApp.'
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title={lang === 'en' ? 'All ready-stock bags have found a home' : 'Semua beg stok sedia ada telah terjual'}
          hint={
            lang === 'en'
              ? 'New pieces are added regularly. You can also browse our pre-order designs.'
              : 'Beg baharu ditambah dari semasa ke semasa. Anda juga boleh melihat rekaan pra-tempah kami.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
          {items.map((item) => (
            <ReadyStockCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
