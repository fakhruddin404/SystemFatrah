'use server';

import { z } from 'zod';
import { fetchAvailableIds } from '@/lib/ready-stock';

const IdsSchema = z.array(z.uuid()).max(50);

/**
 * Returns the subset of the given ready-stock ids that are still available.
 * Reads fresh data (never the Next.js data cache). Returns null when the check
 * itself failed so the caller can avoid blocking the customer on a hiccup.
 */
export async function verifyReadyStock(ids: string[]): Promise<string[] | null> {
  const parsed = IdsSchema.safeParse(ids);
  if (!parsed.success) return [];
  return fetchAvailableIds(parsed.data);
}
