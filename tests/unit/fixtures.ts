import type { Product, ProductSize } from '@/lib/products';
import type { ReadyStockItem } from '@/lib/ready-stock';

export const SIZE_SMALL: ProductSize = { id: 'size-s', label: 'Small', priceMyr: null, sortOrder: 0 };
export const SIZE_LARGE: ProductSize = { id: 'size-l', label: 'Large', priceMyr: 680, sortOrder: 1 };

/** One-size pre-order product. */
export const product: Product = {
  id: 'p1',
  name: 'Batik Tote Indigo',
  descriptionEn: 'Indigo & rust tote',
  descriptionMs: 'Beg tote indigo & karat',
  price: 'RM 480',
  priceMyr: 480,
  bg: '#8B3A3A',
  gridClass: 'col-span-1 lg:col-span-3',
  aspectClass: 'aspect-[4/5]',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/p1.jpg',
  details: null,
  sizes: [],
};

/** Pre-order product with two sizes; Large costs more. */
export const sizedProduct: Product = {
  ...product,
  id: 'p4',
  name: 'Kembara Weekender',
  price: 'RM 620',
  priceMyr: 620,
  sizes: [SIZE_SMALL, SIZE_LARGE],
};

export const readyItem: ReadyStockItem = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'RS-0042',
  name: 'Pesisir Sling',
  descriptionEn: 'A one-of-a-kind sling',
  descriptionMs: 'Beg sandang satu-satunya',
  price: 'RM 180',
  priceMyr: 180,
  sizeLabel: 'Medium',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/rs42.jpg',
};

export const readyItemOneSize: ReadyStockItem = {
  ...readyItem,
  id: '22222222-2222-4222-8222-222222222222',
  code: 'RS-0043',
  name: 'Malam Clutch',
  priceMyr: 90,
  price: 'RM 90',
  sizeLabel: null,
};
