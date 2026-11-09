'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  const { lang } = useLanguage();

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-ink-soft w-16">
        {lang === 'en' ? 'Quantity' : 'Kuantiti'}
      </span>
      <div className="flex items-center border border-ink">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 flex items-center justify-center text-ink hover:bg-sand transition-colors text-lg"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 flex items-center justify-center text-ink hover:bg-sand transition-colors text-lg"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
