'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Product, ProductSize } from '@/lib/products';
import { buildPreorderLine, unitPriceFor } from '@/lib/cart-lines';
import { formatMyr } from '@/lib/money';
import { priceLabel } from '@/lib/pricing';
import { useWhatsAppCheckout } from '@/hooks/useWhatsAppCheckout';
import QuantityStepper from '@/components/QuantityStepper';
import SizeSelector from '@/components/SizeSelector';
import WhatsAppIcon from '@/components/WhatsAppIcon';

/** Purchase controls for a pre-order product: price, optional size, quantity, cart and WhatsApp. */
export default function ProductPurchasePanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<ProductSize | null>(null);
  const { addPreorder } = useCart();
  const { lang } = useLanguage();
  const { checkout } = useWhatsAppCheckout();

  const needsSize = product.sizes.length > 0;
  const canOrder = !needsSize || size !== null;
  const unitPrice = unitPriceFor(product, size);

  const handleAddToCart = () => {
    if (!canOrder) return;
    addPreorder(product, { size, quantity: qty });
  };

  const handleWhatsApp = () => {
    if (!canOrder) return;
    void checkout([buildPreorderLine(product, size, qty)]);
  };

  return (
    <div className="space-y-5">
      <div className="text-2xl font-serif text-ink" data-testid="product-price">
        {size || !needsSize ? formatMyr(unitPrice) : priceLabel(product, lang)}
      </div>

      {needsSize ? <SizeSelector product={product} selectedId={size?.id ?? null} onSelect={setSize} /> : null}

      <QuantityStepper value={qty} onChange={setQty} />

      {needsSize && !size ? (
        <p role="status" className="text-sm text-maroon">
          {lang === 'en' ? 'Please choose a size.' : 'Sila pilih saiz.'}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!canOrder}
          className="flex-1 bg-maroon text-warm-white font-medium py-3.5 px-6 hover:bg-maroon-deep transition-colors text-sm tracking-wide disabled:bg-ink-soft disabled:cursor-not-allowed"
        >
          {lang === 'en' ? '+ Add to Cart' : '+ Tambah ke Troli'}
        </button>
        <button
          onClick={handleWhatsApp}
          disabled={!canOrder}
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-medium py-3.5 px-6 hover:bg-[#1ebe5d] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <WhatsAppIcon />
          {lang === 'en' ? 'Order via WhatsApp' : 'Pesan via WhatsApp'}
        </button>
      </div>
    </div>
  );
}
