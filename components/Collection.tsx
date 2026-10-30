'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/products';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface CollectionProps {
  products: Product[];
}

function ProductCard({ product }: { product: Product }) {
  const { lang } = useLanguage();
  const { addItem } = useCart();
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={`flex flex-col group ${product.gridClass} transition-all duration-700 ease-out translate-y-8 opacity-0 ${isVisible ? '!translate-y-0 !opacity-100' : ''}`}
    >
      <div className={`bg-warm-white border border-line rounded-[18px] relative overflow-hidden mb-4 ${product.aspectClass}`}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 33vw"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2.5">
          <Link
            href={`/products/${product.id}`}
            className="bg-warm-white text-ink font-medium text-sm py-2 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-sm hover:scale-105"
          >
            {lang === 'en' ? 'View Product' : 'Lihat Produk'}
          </Link>
          <button
            onClick={() => addItem(product)}
            className="bg-maroon text-warm-white font-medium text-sm py-2 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-sm hover:bg-maroon-deep"
          >
            {lang === 'en' ? '+ Add to Cart' : '+ Tambah ke Troli'}
          </button>
        </div>
      </div>
      <h3 className="font-serif text-[19px] font-medium mb-1.5">{product.name}</h3>
      <div className="flex justify-between text-sm text-ink-soft">
        <span>{lang === 'en' ? product.descriptionEn : product.descriptionMs}</span>
        <span>{product.price}</span>
      </div>
    </div>
  );
}

export default function Collection({ products }: CollectionProps) {
  const { t } = useLanguage();

  return (
    <section className="py-[70px] lg:py-[100px]" id="collection">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-9 lg:mb-14 pb-6 border-b border-line">
          <h2 className="font-serif text-[clamp(30px,3.2vw,40px)] font-medium">{t('collectionHeading')}</h2>
          <a href="#" className="text-sm font-medium border-b border-ink pb-0.5">{t('viewAll')}</a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-7">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
