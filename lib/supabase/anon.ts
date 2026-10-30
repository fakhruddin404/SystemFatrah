import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Optional overrides, e.g. a custom `fetch` so callers can attach Next.js
 * caching hints (`next: { revalidate }`).
 */
export interface AnonClientOptions {
  fetch?: typeof fetch;
}

/**
 * Creates a read-only Supabase client using the public anon key.
 * This is the only Supabase client in the deployed runtime; RLS makes it read-only.
 * Throws a clear error naming the missing variable if configuration is absent.
 */
export function createAnonClient(
  options: AnonClientOptions = {}
): SupabaseClient<Database> {
  // Literal property access is required so Next.js can inline NEXT_PUBLIC_ vars.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
    );
  }
  if (!anonKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(options.fetch ? { global: { fetch: options.fetch } } : {}),
  });
}
