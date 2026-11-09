'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/products';
import { priceLabel } from '@/lib/pricing';
import ProductCard from '@/components/ProductCard';

/** Pre-order card. Quick add is offered only for one-size products; sized products go to the detail page. */
export default function PreorderCard({
  product,
  useGridClass = false,
}: {
  product: Product;
  /** Apply the product's own grid placement classes (homepage mosaic). */
  useGridClass?: boolean;
}) {
  const { lang } = useLanguage();
  const { addPreorder } = useCart();

  return (
    <ProductCard
      href={`/products/${product.id}`}
      imageUrl={product.imageUrl}
      name={product.name}
      description={lang === 'en' ? product.descriptionEn : product.descriptionMs}
      price={priceLabel(product, lang)}
      badge="preorder"
      className={useGridClass ? product.gridClass : ''}
      aspectClass={product.aspectClass}
    >
      {product.sizes.length === 0 ? (
        <button
          onClick={() => addPreorder(product)}
          className="bg-maroon text-warm-white font-medium text-sm py-2 px-6 transition-colors hover:bg-maroon-deep"
        >
          {lang === 'en' ? '+ Add to Cart' : '+ Tambah ke Troli'}
        </button>
      ) : null}
    </ProductCard>
  );
}
