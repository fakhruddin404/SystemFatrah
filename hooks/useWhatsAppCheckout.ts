'use client';

import { useCallback, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { type CartLine, readyStockIds } from '@/lib/cart-lines';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { verifyReadyStock } from '@/app/actions/verify-ready-stock';

export interface CheckoutResult {
  /** True when a WhatsApp window was opened. */
  opened: boolean;
  /** Ready-stock lines that were no longer available (nothing is opened in that case). */
  unavailable: CartLine[];
}

/**
 * Opens WhatsApp with the order message. Ready-stock bags are re-checked against the
 * database first; if any have just sold, nothing is opened and they are reported back
 * so the caller can remove them and tell the customer.
 */
export function useWhatsAppCheckout() {
  const { lang } = useLanguage();
  const [checking, setChecking] = useState(false);

  const checkout = useCallback(
    async (lines: CartLine[]): Promise<CheckoutResult> => {
      if (lines.length === 0) return { opened: false, unavailable: [] };

      const ids = readyStockIds(lines);
      if (ids.length === 0) {
        window.open(buildWhatsAppUrl(lines, lang), '_blank');
        return { opened: true, unavailable: [] };
      }

      // Open a blank tab inside the click gesture so mobile popup blockers allow it,
      // then point it at WhatsApp once the availability check finishes.
      const placeholder = window.open('', '_blank');
      setChecking(true);
      try {
        const available = await verifyReadyStock(ids);
        const unavailable =
          available === null
            ? []
            : lines.filter((l) => l.kind === 'ready' && !available.includes(l.itemId));

        if (unavailable.length > 0) {
          placeholder?.close();
          return { opened: false, unavailable };
        }

        const url = buildWhatsAppUrl(lines, lang);
        if (placeholder && !placeholder.closed) {
          placeholder.location.href = url;
        } else {
          window.open(url, '_blank');
        }
        return { opened: true, unavailable: [] };
      } finally {
        setChecking(false);
      }
    },
    [lang]
  );

  return { checkout, checking };
}
