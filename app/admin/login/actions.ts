'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import type { ActionState } from '@/lib/admin/action-state';

const CredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

// One generic message for every failure so the form never reveals which emails exist.
const INVALID_LOGIN = 'Invalid email or password.';

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: INVALID_LOGIN };

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: INVALID_LOGIN };

  // Signed in is not the same as allowed in: the account must be on the admin allowlist.
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: 'This account does not have admin access.' };
  }

  redirect('/admin');
}

export async function signOut(): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
