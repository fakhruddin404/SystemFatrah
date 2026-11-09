'use client';

import { useLanguage } from '@/context/LanguageContext';

/** Shown when ready-stock bags sold while they were in a customer's cart. */
export default function UnavailableNotice({ names }: { names: string[] }) {
  const { lang } = useLanguage();
  if (names.length === 0) return null;
  const list = names.join(', ');

  return (
    <div role="alert" className="border border-maroon bg-warm-white text-maroon text-sm p-3">
      {lang === 'en'
        ? `${list} just sold and was removed from your cart. Please review your order and try again.`
        : `${list} baru sahaja terjual dan telah dikeluarkan daripada troli anda. Sila semak pesanan anda dan cuba lagi.`}
    </div>
  );
}
