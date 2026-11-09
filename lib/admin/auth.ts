import 'server-only';

import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { createServerSupabase } from '@/lib/supabase/server';

export interface AdminContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  email: string;
}

/**
 * Returns the signed-in admin, or null for anonymous users and for signed-in users who
 * are not on the `admin_users` allowlist. Always re-checked server-side; never trust the client.
 */
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || isAdmin !== true) return null;

  return { supabase, userId: user.id, email: user.email ?? '' };
}

/** For pages and layouts: redirects to the login page unless the user is an admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
