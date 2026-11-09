import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { uncachedFetch } from '@/lib/cached-fetch';

/**
 * Supabase client bound to the signed-in user's session cookies (anon key + user JWT).
 * RLS applies, so admin writes work only for users listed in `admin_users`.
 * There is deliberately no service-role client in the deployed runtime.
 */
export function createServerSupabase(): SupabaseClient<Database> {
  // Literal property access is required so Next.js can inline NEXT_PUBLIC_ vars.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    global: { fetch: uncachedFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware
          // refreshes the session, so this can be ignored.
        }
      },
    },
  });
}
