'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { readyKey } from '@/lib/cart-lines';
import type { ReadyStockItem } from '@/lib/ready-stock';
import ProductCard from '@/components/ProductCard';

/** Short line under the name: size, or "One size". The code is shown on the detail page. */
export function readyStockSubtitle(item: ReadyStockItem, lang: 'en' | 'ms'): string {
  if (item.sizeLabel) return `${lang === 'en' ? 'Size' : 'Saiz'} ${item.sizeLabel}`;
  return lang === 'en' ? 'One size' : 'Satu saiz';
}

export default function ReadyStockCard({ item }: { item: ReadyStockItem }) {
  const { lang } = useLanguage();
  const { addReadyStock, hasItem } = useCart();
  const inCart = hasItem(readyKey(item.id));

  return (
    <ProductCard
      href={`/ready-stock/${item.code}`}
      imageUrl={item.imageUrl}
      name={item.name}
      description={readyStockSubtitle(item, lang)}
      price={item.price}
      badge="ready"
      aspectClass="aspect-[4/5]"
    >
      <button
        onClick={() => addReadyStock(item)}
        disabled={inCart}
        className="bg-maroon text-warm-white font-medium text-sm py-2 px-6 transition-colors hover:bg-maroon-deep disabled:bg-ink-soft disabled:cursor-not-allowed"
      >
        {inCart
          ? lang === 'en' ? 'In your cart' : 'Dalam troli'
          : lang === 'en' ? '+ Add to Cart' : '+ Tambah ke Troli'}
      </button>
    </ProductCard>
  );
}
