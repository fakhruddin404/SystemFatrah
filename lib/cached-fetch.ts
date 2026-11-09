/** Cache tags shared by the data layer and the admin revalidation helpers. */
export const CACHE_TAGS = {
  products: 'products',
  readyStock: 'ready-stock',
} as const;

export interface CachedFetchOptions {
  tags: string[];
  /** Seconds. Use a short value for data that changes when an item sells. */
  revalidate: number;
}

/** fetch wrapper adding Next.js ISR revalidation hints and cache tags (Next 14 App Router). */
export function createCachedFetch({ tags, revalidate }: CachedFetchOptions): typeof fetch {
  return (input, init) =>
    fetch(input, {
      ...init,
      next: { revalidate, tags },
    } as RequestInit);
}

/** fetch wrapper that always bypasses the Next.js data cache. */
export const uncachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });
