import { type CartLine, hasPreorderLine, subtotalMyr } from '@/lib/cart-lines';
import { formatMyr } from '@/lib/money';
import { PREORDER_LEAD_TIME, SITE_NAME, whatsappUrl } from '@/lib/site';

export type Lang = 'en' | 'ms';

const COPY = {
  en: {
    greeting: `Hello ${SITE_NAME}! I would like to order:`,
    readyHeading: 'Ready stock (one-of-a-kind)',
    preorderHeading: 'Pre-order',
    size: 'Size',
    subtotal: 'Subtotal',
    delivery: 'Delivery fee will be confirmed on WhatsApp.',
    leadTime: `Pre-order items are made to order — allow ${PREORDER_LEAD_TIME.en}.`,
    closing: 'Please confirm my order. Thank you!',
  },
  ms: {
    greeting: `Assalamualaikum ${SITE_NAME}! Saya ingin memesan:`,
    readyHeading: 'Stok sedia ada (satu-satunya)',
    preorderHeading: 'Pra-tempah',
    size: 'Saiz',
    subtotal: 'Jumlah kecil',
    delivery: 'Kos penghantaran akan disahkan melalui WhatsApp.',
    leadTime: `Item pra-tempah dibuat mengikut tempahan — tempoh ${PREORDER_LEAD_TIME.ms}.`,
    closing: 'Mohon sahkan pesanan saya. Terima kasih!',
  },
} as const;

function sizeSuffix(label: string | null, lang: Lang): string {
  return label ? ` (${COPY[lang].size}: ${label})` : '';
}

/** Builds the plain-text order message for the given cart lines. Pure. */
export function buildWhatsAppMessage(lines: CartLine[], lang: Lang): string {
  const c = COPY[lang];
  const ready = lines.flatMap((l) => (l.kind === 'ready' ? [l] : []));
  const preorder = lines.flatMap((l) => (l.kind === 'preorder' ? [l] : []));

  const out: string[] = [c.greeting, ''];

  if (ready.length > 0) {
    out.push(c.readyHeading);
    for (const l of ready) {
      out.push(`• [${l.code}] ${l.name}${sizeSuffix(l.sizeLabel, lang)} — ${formatMyr(l.unitPriceMyr)}`);
    }
    out.push('');
  }

  if (preorder.length > 0) {
    out.push(c.preorderHeading);
    for (const l of preorder) {
      out.push(
        `• ${l.name}${sizeSuffix(l.sizeLabel, lang)} x${l.quantity} — ${formatMyr(l.unitPriceMyr)}`
      );
    }
    out.push('');
  }

  out.push(`${c.subtotal}: ${formatMyr(subtotalMyr(lines), { fixed: true })}`);
  out.push(c.delivery);
  if (hasPreorderLine(lines)) out.push(c.leadTime);
  out.push('', c.closing);

  return out.join('\n');
}

/** wa.me URL with the order message prefilled. */
export function buildWhatsAppUrl(lines: CartLine[], lang: Lang): string {
  return whatsappUrl(buildWhatsAppMessage(lines, lang));
}
