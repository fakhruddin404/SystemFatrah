/**
 * SEED-ONLY. Validates parsed CSV rows before the seed script writes anything.
 * Must never be imported by app/, components/, or lib/ runtime code.
 */
import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim();
const httpsUrl = z.url({ protocol: /^https$/ });
const amount = z.string().trim().regex(/^\d+(\.\d{1,2})?$/);

export const SeedRowInput = z.object({
  id: requiredText,
  name: requiredText,
  descriptionEn: requiredText,
  descriptionMs: requiredText,
  price: z.string().regex(/^RM\s?\d+(\.\d{2})?$/),
  bg: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  gridClass: requiredText,
  aspectClass: requiredText,
  imageUrl: httpsUrl,
});

export type SeedRowInput = z.infer<typeof SeedRowInput>;

/** One size of a pre-order product. `priceOverrideMyr` may be empty (use the product price). */
export const SeedSizeInput = z.object({
  productId: requiredText,
  label: requiredText,
  sortOrder: z.string().trim().regex(/^\d+$/),
  priceOverrideMyr: z.union([z.literal(''), amount]),
});

export type SeedSizeInput = z.infer<typeof SeedSizeInput>;

/** A sample ready-stock bag (staging only). `sizeLabel` may be empty (one size). */
export const SeedReadyStockInput = z.object({
  code: requiredText,
  name: requiredText,
  descriptionEn: optionalText,
  descriptionMs: optionalText,
  priceMyr: amount,
  sizeLabel: optionalText,
  imageUrl: httpsUrl,
});

export type SeedReadyStockInput = z.infer<typeof SeedReadyStockInput>;
