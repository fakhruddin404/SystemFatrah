/**
 * SEED-ONLY service-role Supabase client factory.
 *
 * The service-role key bypasses RLS. It lives only in `.env.local` on a
 * developer machine and must never be imported by app/, components/, or lib/
 * runtime code, nor set in any Vercel environment.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/database.types';

export class MissingEnvError extends Error {
  readonly varName: string;

  constructor(varName: string) {
    super(`Missing required environment variable: ${varName}. Set it in .env.local before seeding.`);
    this.name = 'MissingEnvError';
    this.varName = varName;
  }
}

function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new MissingEnvError(name);
  return value;
}

/**
 * Builds the service-role client. Throws MissingEnvError (naming the variable,
 * never printing any value) before any client or write is created.
 */
export function createServiceRoleClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient<Database> {
  const url = requireEnv(env, 'NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Loads `.env.local` into process.env (Node >= 20.12); no-op if the file is absent. */
export function loadLocalEnv(path = '.env.local'): void {
  try {
    process.loadEnvFile(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/** Script-entry helper: reports a startup error without secrets and exits non-zero. */
export function exitOnStartupError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[seed] ${message}`);
  process.exit(1);
}
