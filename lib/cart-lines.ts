import type { Product, ProductSize } from '@/lib/products';
import type { ReadyStockItem } from '@/lib/ready-stock';
import { fromSen, toSen } from '@/lib/money';

/** Made-to-order line: quantity N, optional size. */
export interface PreorderLine {
  kind: 'preorder';
  key: string;
  productId: string;
  name: string;
  descriptionEn: string;
  descriptionMs: string;
  imageUrl: string;
  sizeId: string | null;
  sizeLabel: string | null;
  /** Price at the time it was added to the cart. */
  unitPriceMyr: number;
  quantity: number;
}

/** One specific, one-of-a-kind bag. Quantity is always 1. */
export interface ReadyStockLine {
  kind: 'ready';
  key: string;
  itemId: string;
  code: string;
  name: string;
  descriptionEn: string;
  descriptionMs: string;
  imageUrl: string;
  sizeLabel: string | null;
  unitPriceMyr: number;
  quantity: 1;
}

export type CartLine = PreorderLine | ReadyStockLine;

export const preorderKey = (productId: string, sizeId: string | null): string =>
  `po:${productId}:${sizeId ?? 'none'}`;

export const readyKey = (itemId: string): string => `rs:${itemId}`;

/** Price of a product for the chosen size (size override wins when set). */
export function unitPriceFor(product: Product, size: ProductSize | null): number {
  return size?.priceMyr ?? product.priceMyr;
}

export function buildPreorderLine(
  product: Product,
  size: ProductSize | null,
  quantity = 1
): PreorderLine {
  return {
    kind: 'preorder',
    key: preorderKey(product.id, size?.id ?? null),
    productId: product.id,
    name: product.name,
    descriptionEn: product.descriptionEn,
    descriptionMs: product.descriptionMs,
    imageUrl: product.imageUrl,
    sizeId: size?.id ?? null,
    sizeLabel: size?.label ?? null,
    unitPriceMyr: unitPriceFor(product, size),
    quantity: Math.max(1, Math.floor(quantity)),
  };
}

export function buildReadyStockLine(item: ReadyStockItem): ReadyStockLine {
  return {
    kind: 'ready',
    key: readyKey(item.id),
    itemId: item.id,
    code: item.code,
    name: item.name,
    descriptionEn: item.descriptionEn ?? '',
    descriptionMs: item.descriptionMs ?? '',
    imageUrl: item.imageUrl,
    sizeLabel: item.sizeLabel,
    unitPriceMyr: item.priceMyr,
    quantity: 1,
  };
}

/** Adds a line. Pre-order lines merge by key; a ready-stock bag can only be added once. */
export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const existing = lines.find((l) => l.key === line.key);
  if (!existing) return [...lines, line];
  if (existing.kind === 'ready' || line.kind === 'ready') return lines;
  return lines.map((l) =>
    l.key === line.key && l.kind === 'preorder'
      ? { ...l, quantity: l.quantity + line.quantity }
      : l
  );
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => l.key !== key);
}

/** Sets a pre-order quantity (<= 0 removes the line). Ready-stock quantity never changes. */
export function setLineQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return removeLine(lines, key);
  return lines.map((l) =>
    l.key === key && l.kind === 'preorder' ? { ...l, quantity: Math.floor(quantity) } : l
  );
}

export function lineTotalMyr(line: CartLine): number {
  return fromSen(toSen(line.unitPriceMyr) * line.quantity);
}

export function subtotalMyr(lines: CartLine[]): number {
  return fromSen(lines.reduce((sum, l) => sum + toSen(l.unitPriceMyr) * l.quantity, 0));
}

export function totalQuantity(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function hasPreorderLine(lines: CartLine[]): boolean {
  return lines.some((l) => l.kind === 'preorder');
}

export function readyStockIds(lines: CartLine[]): string[] {
  return lines.flatMap((l) => (l.kind === 'ready' ? [l.itemId] : []));
}
