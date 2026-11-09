'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { hasPreorderLine } from '@/lib/cart-lines';
import { formatMyr } from '@/lib/money';
import { useWhatsAppCheckout } from '@/hooks/useWhatsAppCheckout';
import MediaImage from '@/components/MediaImage';
import StatusBadge from '@/components/StatusBadge';
import UnavailableNotice from '@/components/UnavailableNotice';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function CartDrawer() {
  const pathname = usePathname();
  const { items, isOpen, closeCart, removeItem, removeKeys, updateQty, totalCount, totalPrice } = useCart();
  const { lang } = useLanguage();
  const { checkout, checking } = useWhatsAppCheckout();
  const [soldNames, setSoldNames] = useState<string[]>([]);

  // The admin area has no storefront cart.
  if (pathname?.startsWith('/admin')) return null;

  const handleWhatsApp = async () => {
    if (items.length === 0) return;
    const result = await checkout(items);
    if (result.unavailable.length > 0) {
      removeKeys(result.unavailable.map((l) => l.key));
      setSoldNames(result.unavailable.map((l) => l.name));
    } else {
      setSoldNames([]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-ink/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-warm-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink/80">
          <span className="font-serif text-xl font-medium">
            {lang === 'en' ? 'Your Cart' : 'Troli Anda'}
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-sans text-ink-soft">({totalCount} {lang === 'en' ? 'item' : 'item'}{totalCount !== 1 ? 's' : ''})</span>
            )}
          </span>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <UnavailableNotice names={soldNames} />
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-ink-soft">
              <div className="text-4xl mb-4">🛍️</div>
              <p className="font-serif text-lg mb-1">{lang === 'en' ? 'Your cart is empty' : 'Troli anda kosong'}</p>
              <p className="text-sm">{lang === 'en' ? 'Add a bag to get started.' : 'Tambah beg untuk bermula.'}</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {items.map((line) => (
                <li key={line.key} className="flex gap-4 py-5">
                  <div className="relative w-20 h-24 flex-none overflow-hidden border border-ink">
                    <MediaImage
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge variant={line.kind === 'ready' ? 'ready' : 'preorder'} />
                      {line.kind === 'ready' ? (
                        <span className="text-[11px] font-semibold tracking-wide text-ink-soft">{line.code}</span>
                      ) : null}
                    </div>
                    <p className="font-serif font-medium text-base leading-tight mb-0.5 truncate">{line.name}</p>
                    <p className="text-xs text-ink-soft mb-3">
                      {line.sizeLabel
                        ? `${lang === 'en' ? 'Size' : 'Saiz'}: ${line.sizeLabel}`
                        : lang === 'en' ? line.descriptionEn : line.descriptionMs}
                    </p>
                    <div className="flex items-center justify-between">
                      {line.kind === 'preorder' ? (
                        <div className="flex items-center border border-ink">
                          <button
                            className="w-8 h-8 flex items-center justify-center text-ink hover:bg-sand transition-colors text-lg"
                            onClick={() => updateQty(line.key, line.quantity - 1)}
                            aria-label="Decrease"
                          >−</button>
                          <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                          <button
                            className="w-8 h-8 flex items-center justify-center text-ink hover:bg-sand transition-colors text-lg"
                            onClick={() => updateQty(line.key, line.quantity + 1)}
                            aria-label="Increase"
                          >+</button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-soft">{lang === 'en' ? 'One of a kind' : 'Satu-satunya'}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-maroon">{formatMyr(line.unitPriceMyr)}</span>
                        <button
                          onClick={() => removeItem(line.key)}
                          className="text-xs text-ink-soft hover:text-maroon transition-colors"
                          aria-label="Remove"
                        >
                          {lang === 'en' ? 'Remove' : 'Buang'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-ink/80 space-y-3">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>{lang === 'en' ? 'Subtotal' : 'Jumlah kecil'}</span>
              <span className="font-medium text-ink">{totalPrice}</span>
            </div>
            <p className="text-xs text-ink-soft">
              {lang === 'en'
                ? 'Delivery fee will be confirmed with you on WhatsApp.'
                : 'Kos penghantaran akan disahkan dengan anda melalui WhatsApp.'}
            </p>
            {hasPreorderLine(items) ? (
              <p className="text-xs text-ink-soft">
                {lang === 'en'
                  ? 'Pre-order items are made to order — allow 2–4 weeks.'
                  : 'Item pra-tempah dibuat mengikut tempahan — tempoh 2–4 minggu.'}
              </p>
            ) : null}
            <button
              onClick={handleWhatsApp}
              disabled={checking}
              className="w-full bg-[#25D366] text-white font-medium py-3.5 px-6 flex items-center justify-center gap-2 hover:bg-[#1ebe5d] transition-colors disabled:opacity-60"
            >
              <WhatsAppIcon className="w-5 h-5" />
              {lang === 'en' ? 'Order via WhatsApp' : 'Pesan via WhatsApp'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
