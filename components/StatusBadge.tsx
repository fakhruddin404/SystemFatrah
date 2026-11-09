'use client';

import { useLanguage } from '@/context/LanguageContext';

export type BadgeVariant = 'ready' | 'preorder';

const LABELS: Record<BadgeVariant, { en: string; ms: string }> = {
  ready: { en: 'Ready Stock', ms: 'Stok Sedia Ada' },
  preorder: { en: 'Pre-Order', ms: 'Pra-Tempah' },
};

const STYLES: Record<BadgeVariant, string> = {
  // Solid green for one-of-a-kind bags that are ready to go.
  ready: 'bg-ready text-warm-white border border-ready',
  // Subtle outline for made-to-order designs.
  preorder: 'bg-warm-white/80 text-ink border border-ink/60',
};

export default function StatusBadge({
  variant,
  className = '',
}: {
  variant: BadgeVariant;
  className?: string;
}) {
  const { lang } = useLanguage();
  return (
    <span
      data-variant={variant}
      className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] leading-none ${STYLES[variant]} ${className}`}
    >
      {LABELS[variant][lang]}
    </span>
  );
}
