import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  addLine,
  buildPreorderLine,
  buildReadyStockLine,
  hasPreorderLine,
  lineTotalMyr,
  preorderKey,
  readyKey,
  readyStockIds,
  removeLine,
  setLineQuantity,
  subtotalMyr,
  totalQuantity,
  unitPriceFor,
  type CartLine,
} from '@/lib/cart-lines';
import { SIZE_LARGE, SIZE_SMALL, product, readyItem, readyItemOneSize, sizedProduct } from './fixtures';

describe('line keys', () => {
  it('distinguish products and sizes', () => {
    expect(preorderKey('p1', null)).toBe('po:p1:none');
    expect(preorderKey('p4', 'size-s')).toBe('po:p4:size-s');
    expect(preorderKey('p4', 'size-s')).not.toBe(preorderKey('p4', 'size-l'));
    expect(readyKey('abc')).toBe('rs:abc');
  });
});

describe('unitPriceFor', () => {
  it('uses the product price when the size has no override', () => {
    expect(unitPriceFor(sizedProduct, SIZE_SMALL)).toBe(620);
    expect(unitPriceFor(product, null)).toBe(480);
  });

  it('uses the size override when set', () => {
    expect(unitPriceFor(sizedProduct, SIZE_LARGE)).toBe(680);
  });
});

describe('building lines', () => {
  it('snapshots a pre-order line with its size and price', () => {
    const line = buildPreorderLine(sizedProduct, SIZE_LARGE, 2);
    expect(line).toMatchObject({
      kind: 'preorder',
      key: 'po:p4:size-l',
      productId: 'p4',
      sizeId: 'size-l',
      sizeLabel: 'Large',
      unitPriceMyr: 680,
      quantity: 2,
    });
  });

  it('clamps quantity to at least 1', () => {
    expect(buildPreorderLine(product, null, 0).quantity).toBe(1);
    expect(buildPreorderLine(product, null, -3).quantity).toBe(1);
    expect(buildPreorderLine(product, null, 2.9).quantity).toBe(2);
  });

  it('builds a ready-stock line with quantity 1 and its code', () => {
    const line = buildReadyStockLine(readyItem);
    expect(line).toMatchObject({
      kind: 'ready',
      key: `rs:${readyItem.id}`,
      itemId: readyItem.id,
      code: 'RS-0042',
      sizeLabel: 'Medium',
      unitPriceMyr: 180,
      quantity: 1,
    });
  });
});

describe('addLine', () => {
  it('merges pre-order lines with the same key', () => {
    const a = buildPreorderLine(product, null, 1);
    const lines = addLine(addLine([], a), buildPreorderLine(product, null, 2));
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it('keeps different sizes of one product as separate lines', () => {
    const lines = addLine(
      addLine([], buildPreorderLine(sizedProduct, SIZE_SMALL)),
      buildPreorderLine(sizedProduct, SIZE_LARGE)
    );
    expect(lines).toHaveLength(2);
  });

  it('adds a ready-stock bag only once', () => {
    const line = buildReadyStockLine(readyItem);
    const lines = addLine(addLine([], line), line);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(1);
  });

  it('does not mutate the input', () => {
    const original: CartLine[] = [buildPreorderLine(product, null)];
    const snapshot = structuredClone(original);
    addLine(original, buildPreorderLine(product, null));
    expect(original).toEqual(snapshot);
  });
});

describe('setLineQuantity / removeLine', () => {
  const base: CartLine[] = [buildPreorderLine(product, null, 2), buildReadyStockLine(readyItem)];

  it('updates a pre-order quantity', () => {
    expect(setLineQuantity(base, 'po:p1:none', 5)[0].quantity).toBe(5);
  });

  it('removes the line when the quantity drops to zero', () => {
    expect(setLineQuantity(base, 'po:p1:none', 0)).toHaveLength(1);
  });

  it('never changes a ready-stock quantity', () => {
    const result = setLineQuantity(base, `rs:${readyItem.id}`, 4);
    expect(result[1].quantity).toBe(1);
  });

  it('removes by key', () => {
    expect(removeLine(base, `rs:${readyItem.id}`).map((l) => l.kind)).toEqual(['preorder']);
  });
});

describe('totals', () => {
  it('sums line totals exactly', () => {
    const lines: CartLine[] = [
      buildPreorderLine(product, null, 2), // 960
      buildReadyStockLine(readyItem), // 180
      buildReadyStockLine(readyItemOneSize), // 90
    ];
    expect(lineTotalMyr(lines[0])).toBe(960);
    expect(subtotalMyr(lines)).toBe(1230);
    expect(totalQuantity(lines)).toBe(4);
  });

  it('is exact for fractional prices', () => {
    const cheap = { ...product, priceMyr: 0.1 };
    const lines = [buildPreorderLine(cheap, null, 3), buildPreorderLine({ ...cheap, id: 'x', priceMyr: 0.2 }, null, 1)];
    expect(subtotalMyr(lines)).toBe(0.5);
  });

  it('subtotal equals the sum of line totals (property)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            sen: fc.integer({ min: 0, max: 5_000_000 }),
            qty: fc.integer({ min: 1, max: 20 }),
            id: fc.uuid(),
          }),
          { maxLength: 8 }
        ),
        (specs) => {
          const lines = specs.map((s) =>
            buildPreorderLine({ ...product, id: s.id, priceMyr: s.sen / 100 }, null, s.qty)
          );
          const expectedSen = specs.reduce((sum, s) => sum + s.sen * s.qty, 0);
          expect(Math.round(subtotalMyr(lines) * 100)).toBe(expectedSen);
        }
      )
    );
  });

  it('detects pre-order lines and lists ready-stock ids', () => {
    const lines: CartLine[] = [buildReadyStockLine(readyItem)];
    expect(hasPreorderLine(lines)).toBe(false);
    expect(readyStockIds(lines)).toEqual([readyItem.id]);
    expect(hasPreorderLine([...lines, buildPreorderLine(product, null)])).toBe(true);
  });
});
