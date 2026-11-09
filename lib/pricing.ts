import type { Product } from '@/lib/products';
import { formatMyr } from '@/lib/money';

/**
 * Price text for a pre-order product when no size is chosen yet:
 * "RM 480" when every size costs the same (or there are none), "From RM 450" otherwise.
 */
export function priceLabel(product: Product, lang: 'en' | 'ms'): string {
  const prices = product.sizes.map((s) => s.priceMyr ?? product.priceMyr);
  if (prices.length === 0) return product.price;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatMyr(min);
  return `${lang === 'en' ? 'From' : 'Dari'} ${formatMyr(min)}`;
}
