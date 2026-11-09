'use client';

import { useLanguage } from '@/context/LanguageContext';
import type { Product, ProductSize } from '@/lib/products';
import { formatMyr } from '@/lib/money';

/** Radio-style size picker. Render only when the product has sizes. */
export default function SizeSelector({
  product,
  selectedId,
  onSelect,
}: {
  product: Product;
  selectedId: string | null;
  onSelect: (size: ProductSize) => void;
}) {
  const { lang } = useLanguage();

  return (
    <div className="flex items-start gap-4">
      <span id="size-label" className="text-sm font-medium text-ink-soft w-16 pt-2.5">
        {lang === 'en' ? 'Size' : 'Saiz'}
      </span>
      <div role="radiogroup" aria-labelledby="size-label" className="flex flex-wrap gap-2">
        {product.sizes.map((size) => {
          const selected = size.id === selectedId;
          const override = size.priceMyr !== null && size.priceMyr !== product.priceMyr;
          return (
            <button
              key={size.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(size)}
              className={`min-w-[64px] px-4 py-2.5 text-sm font-medium border transition-colors ${
                selected
                  ? 'bg-ink text-warm-white border-ink'
                  : 'bg-transparent text-ink border-ink/40 hover:border-ink'
              }`}
            >
              {size.label}
              {override ? (
                <span className="block text-[11px] font-normal opacity-80">{formatMyr(size.priceMyr as number)}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
