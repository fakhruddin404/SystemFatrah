'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import type { ReadyStockItem } from '@/lib/ready-stock';
import { buildReadyStockLine, readyKey } from '@/lib/cart-lines';
import { useWhatsAppCheckout } from '@/hooks/useWhatsAppCheckout';
import UnavailableNotice from '@/components/UnavailableNotice';
import WhatsAppIcon from '@/components/WhatsAppIcon';

/** Purchase controls for one specific ready-stock bag. Quantity is always 1. */
export default function ReadyStockActions({ item }: { item: ReadyStockItem }) {
  const { addReadyStock, hasItem, removeKeys } = useCart();
  const { lang } = useLanguage();
  const { checkout } = useWhatsAppCheckout();
  const [soldNames, setSoldNames] = useState<string[]>([]);
  const inCart = hasItem(readyKey(item.id));

  const handleWhatsApp = async () => {
    const line = buildReadyStockLine(item);
    const result = await checkout([line]);
    if (result.unavailable.length > 0) {
      removeKeys([line.key]);
      setSoldNames(result.unavailable.map((l) => l.name));
    }
  };

  return (
    <div className="space-y-4">
      <UnavailableNotice names={soldNames} />
      {soldNames.length > 0 ? (
        <Link href="/ready-stock" className="inline-block text-sm font-medium border-b border-ink pb-0.5">
          {lang === 'en' ? 'See what is still available' : 'Lihat yang masih ada'}
        </Link>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => addReadyStock(item)}
          disabled={inCart}
          className="flex-1 bg-maroon text-warm-white font-medium py-3.5 px-6 hover:bg-maroon-deep transition-colors text-sm tracking-wide disabled:bg-ink-soft disabled:cursor-not-allowed"
        >
          {inCart
            ? lang === 'en' ? 'In your cart' : 'Dalam troli'
            : lang === 'en' ? '+ Add to Cart' : '+ Tambah ke Troli'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-medium py-3.5 px-6 hover:bg-[#1ebe5d] transition-colors text-sm"
        >
          <WhatsAppIcon />
          {lang === 'en' ? 'Order via WhatsApp' : 'Pesan via WhatsApp'}
        </button>
      </div>
    </div>
  );
}
