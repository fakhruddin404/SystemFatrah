'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

const WHATSAPP_NUMBER = '60132577325';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalCount, totalPrice } = useCart();
  const { lang } = useLanguage();

  const handleWhatsApp = () => {
    if (items.length === 0) return;
    const lines = items.map(
      (i) => `• ${i.product.name} x${i.quantity} — ${i.product.price}`
    );
    const message = [
      lang === 'en' ? 'Hello FATRAH! I would like to order:' : 'Assalamualaikum FATRAH! Saya ingin memesan:',
      '',
      ...lines,
      '',
      `${lang === 'en' ? 'Total' : 'Jumlah'}: ${totalPrice}`,
      '',
      lang === 'en' ? 'Please confirm my order. Thank you!' : 'Mohon sahkan pesanan saya. Terima kasih!',
    ].join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
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
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-ink-soft">
              <div className="text-4xl mb-4">🛍️</div>
              <p className="font-serif text-lg mb-1">{lang === 'en' ? 'Your cart is empty' : 'Troli anda kosong'}</p>
              <p className="text-sm">{lang === 'en' ? 'Add a bag to get started.' : 'Tambah beg untuk bermula.'}</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 py-5">
                  <div className="relative w-20 h-24 flex-none rounded-lg overflow-hidden border border-line">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-medium text-base leading-tight mb-0.5 truncate">{product.name}</p>
                    <p className="text-xs text-ink-soft mb-3">
                      {lang === 'en' ? product.descriptionEn : product.descriptionMs}
                    </p>
                    <div className="flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-line rounded-full overflow-hidden">
                        <button
                          className="w-8 h-8 flex items-center justify-center text-ink hover:bg-sand transition-colors text-lg"
                          onClick={() => updateQty(product.id, quantity - 1)}
                          aria-label="Decrease"
                        >−</button>
                        <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center text-ink hover:bg-sand transition-colors text-lg"
                          onClick={() => updateQty(product.id, quantity + 1)}
                          aria-label="Increase"
                        >+</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-maroon">{product.price}</span>
                        <button
                          onClick={() => removeItem(product.id)}
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
          <div className="px-6 py-5 border-t border-line space-y-3">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>{lang === 'en' ? 'Subtotal' : 'Jumlah kecil'}</span>
              <span className="font-medium text-ink">{totalPrice}</span>
            </div>
            <p className="text-xs text-ink-soft">{lang === 'en' ? 'Made to order — allow 2–4 weeks for delivery.' : 'Dibuat mengikut tempahan — 2–4 minggu untuk penghantaran.'}</p>
            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] text-white font-medium py-3.5 px-6 flex items-center justify-center gap-2 hover:bg-[#1ebe5d] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {lang === 'en' ? 'Order via WhatsApp' : 'Pesan via WhatsApp'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
