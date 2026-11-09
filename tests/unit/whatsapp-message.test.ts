import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { buildPreorderLine, buildReadyStockLine, type CartLine } from '@/lib/cart-lines';
import { WHATSAPP_NUMBER } from '@/lib/site';
import { SIZE_LARGE, product, readyItem, readyItemOneSize, sizedProduct } from './fixtures';

const preorderOnly: CartLine[] = [buildPreorderLine(product, null, 2)];
const readyOnly: CartLine[] = [buildReadyStockLine(readyItem), buildReadyStockLine(readyItemOneSize)];
const mixed: CartLine[] = [
  buildReadyStockLine(readyItem),
  buildPreorderLine(sizedProduct, SIZE_LARGE, 3),
];

describe('buildWhatsAppMessage (English)', () => {
  it('formats a pre-order cart with subtotal, delivery note and lead time', () => {
    expect(buildWhatsAppMessage(preorderOnly, 'en')).toBe(
      [
        'Hello Fat_Rahz Batik! I would like to order:',
        '',
        'Pre-order',
        '• Batik Tote Indigo x2 — RM 480',
        '',
        'Subtotal: RM 960.00',
        'Delivery fee will be confirmed on WhatsApp.',
        'Pre-order items are made to order — allow 2–4 weeks.',
        '',
        'Please confirm my order. Thank you!',
      ].join('\n')
    );
  });

  it('formats ready stock with codes and no lead-time note', () => {
    const message = buildWhatsAppMessage(readyOnly, 'en');
    expect(message).toContain('Ready stock (one-of-a-kind)');
    expect(message).toContain('• [RS-0042] Pesisir Sling (Size: Medium) — RM 180');
    expect(message).toContain('• [RS-0043] Malam Clutch — RM 90');
    expect(message).toContain('Subtotal: RM 270.00');
    expect(message).not.toContain('allow 2–4 weeks');
    expect(message).not.toContain('Pre-order');
  });

  it('formats a mixed cart with both sections, sizes and the size price', () => {
    const message = buildWhatsAppMessage(mixed, 'en');
    expect(message.indexOf('Ready stock')).toBeLessThan(message.indexOf('Pre-order'));
    expect(message).toContain('• Kembara Weekender (Size: Large) x3 — RM 680');
    expect(message).toContain('Subtotal: RM 2220.00');
    expect(message).toContain('allow 2–4 weeks');
  });

  it('always mentions that delivery is confirmed on WhatsApp', () => {
    for (const lines of [preorderOnly, readyOnly, mixed]) {
      expect(buildWhatsAppMessage(lines, 'en')).toContain('Delivery fee will be confirmed on WhatsApp.');
    }
  });

  it('never includes a delivery amount', () => {
    // "RM" followed by a number on a delivery line would be an amount ("confirmed" must not trip this).
    expect(buildWhatsAppMessage(mixed, 'en')).not.toMatch(/delivery[^\n]*\bRM\s?\d|postage|shipping/i);
  });
});

describe('buildWhatsAppMessage (Bahasa Melayu)', () => {
  it('uses the Malay greeting, labels and notes', () => {
    const message = buildWhatsAppMessage(mixed, 'ms');
    expect(message).toContain('Assalamualaikum Fat_Rahz Batik! Saya ingin memesan:');
    expect(message).toContain('Stok sedia ada (satu-satunya)');
    expect(message).toContain('Pra-tempah');
    expect(message).toContain('(Saiz: Large)');
    expect(message).toContain('Jumlah kecil: RM 2220.00');
    expect(message).toContain('Kos penghantaran akan disahkan melalui WhatsApp.');
    expect(message).toContain('tempoh 2–4 minggu');
    expect(message).toContain('Mohon sahkan pesanan saya. Terima kasih!');
  });

  it('omits the lead-time note for ready stock only', () => {
    expect(buildWhatsAppMessage(readyOnly, 'ms')).not.toContain('2–4 minggu');
  });
});

describe('buildWhatsAppUrl', () => {
  it('targets the business number with the encoded message', () => {
    const url = new URL(buildWhatsAppUrl(mixed, 'en'));
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(url.searchParams.get('text')).toBe(buildWhatsAppMessage(mixed, 'en'));
  });
});
