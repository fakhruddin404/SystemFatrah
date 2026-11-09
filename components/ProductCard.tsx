'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import MediaImage from '@/components/MediaImage';
import StatusBadge, { type BadgeVariant } from '@/components/StatusBadge';

export interface ProductCardProps {
  href: string;
  imageUrl: string;
  name: string;
  /** Short line under the name (description, size or code). */
  description: string;
  price: string;
  badge: BadgeVariant;
  /** Layout classes for the card wrapper (grid placement). */
  className?: string;
  aspectClass?: string;
  /** Hover actions, e.g. an add-to-cart button. */
  children?: ReactNode;
}

/**
 * Shared card for both catalogs: square corners, hairline ink border, a status
 * badge and a stretched link so the whole image is tappable.
 */
export default function ProductCard({
  href,
  imageUrl,
  name,
  description,
  price,
  badge,
  className = '',
  aspectClass = 'aspect-[4/5]',
  children,
}: ProductCardProps) {
  const { lang } = useLanguage();
  const { ref, isVisible } = useScrollReveal(0.1);
  const viewLabel = lang === 'en' ? 'View Product' : 'Lihat Produk';

  return (
    <div
      ref={ref}
      className={`flex flex-col group ${className} transition-all duration-700 ease-out translate-y-8 opacity-0 ${isVisible ? '!translate-y-0 !opacity-100' : ''}`}
    >
      <div className={`relative overflow-hidden bg-warm-white border border-ink mb-4 ${aspectClass}`}>
        <MediaImage
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute left-3 top-3">
          <StatusBadge variant={badge} />
        </div>

        {/* One stretched link per card keeps the whole image tappable. */}
        <Link href={href} aria-label={`${viewLabel}: ${name}`} className="absolute inset-0 z-10" />

        {/*
          The overlay sits above the stretched link (z-20 > z-10) but ignores pointer events, so
          taps fall through to the link. Only the action button takes clicks, and only on devices
          that can hover; on touch screens a tap always opens the product page.
        */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2.5">
          <span className="bg-warm-white text-ink font-medium text-sm py-2 px-6">{viewLabel}</span>
          {children ? (
            <div className="pointer-events-none [@media(hover:hover)]:pointer-events-auto">{children}</div>
          ) : null}
        </div>
      </div>
      <h3 className="font-serif text-[19px] font-medium mb-1.5">{name}</h3>
      <div className="flex justify-between gap-3 text-sm text-ink-soft">
        <span>{description}</span>
        <span className="font-medium text-ink whitespace-nowrap">{price}</span>
      </div>
    </div>
  );
}
