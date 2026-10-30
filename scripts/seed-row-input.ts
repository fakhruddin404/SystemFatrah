/**
 * SEED-ONLY. Validates parsed CSV rows before the seed script writes anything.
 * Must never be imported by app/, components/, or lib/ runtime code.
 */
import { z } from 'zod';

const requiredText = z.string().trim().min(1);

export const SeedRowInput = z.object({
  id: requiredText,
  name: requiredText,
  descriptionEn: requiredText,
  descriptionMs: requiredText,
  price: z.string().regex(/^RM\s?\d+(\.\d{2})?$/),
  bg: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  gridClass: requiredText,
  aspectClass: requiredText,
  imageUrl: z.url({ protocol: /^https$/ }),
});

export type SeedRowInput = z.infer<typeof SeedRowInput>;
