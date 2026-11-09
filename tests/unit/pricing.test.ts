import { describe, it, expect } from 'vitest';
import { priceLabel } from '@/lib/pricing';
import { SIZE_LARGE, SIZE_SMALL, product, sizedProduct } from './fixtures';

describe('priceLabel', () => {
  it('shows the plain price for a one-size product', () => {
    expect(priceLabel(product, 'en')).toBe('RM 480');
  });

  it('shows the plain price when every size costs the same', () => {
    expect(priceLabel({ ...sizedProduct, sizes: [SIZE_SMALL, { ...SIZE_SMALL, id: 'm', label: 'Medium' }] }, 'en')).toBe(
      'RM 620'
    );
  });

  it('shows "From" the lowest price when sizes differ', () => {
    expect(priceLabel(sizedProduct, 'en')).toBe('From RM 620');
    expect(priceLabel(sizedProduct, 'ms')).toBe('Dari RM 620');
  });

  it('uses the lowest size override when it is below the base price', () => {
    const cheaper = { ...sizedProduct, sizes: [{ ...SIZE_SMALL, priceMyr: 500 }, SIZE_LARGE] };
    expect(priceLabel(cheaper, 'en')).toBe('From RM 500');
  });
});
