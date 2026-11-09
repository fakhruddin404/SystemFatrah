import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cached-fetch';

/** Call after any change to ready-stock data so the public site updates immediately. */
export function revalidateReadyStock(): void {
  revalidateTag(CACHE_TAGS.readyStock);
  revalidatePath('/');
  revalidatePath('/ready-stock');
  revalidatePath('/ready-stock/[code]', 'page');
}

/** Call after any change to pre-order products or their sizes. */
export function revalidateProducts(): void {
  revalidateTag(CACHE_TAGS.products);
  revalidatePath('/');
  revalidatePath('/pre-order');
  revalidatePath('/products/[id]', 'page');
}
