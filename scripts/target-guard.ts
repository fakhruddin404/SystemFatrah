/**
 * Guards against pointing destructive tooling at the wrong Supabase project.
 *
 * We run two projects: fatrah-staging (previews, tests, sample data) and fatrah-prod.
 * Local scripts and integration tests must say which one they intend to touch via
 * SUPABASE_TARGET=staging|production in .env.local, and refuse to run otherwise.
 */

export type SupabaseTarget = 'staging' | 'production';

export class TargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetError';
  }
}

export function readTarget(env: NodeJS.ProcessEnv): SupabaseTarget {
  const raw = env.SUPABASE_TARGET?.trim().toLowerCase();
  if (raw === 'staging' || raw === 'production') return raw;
  throw new TargetError(
    'SUPABASE_TARGET is not set. Set SUPABASE_TARGET=staging (fatrah-staging) or ' +
      'SUPABASE_TARGET=production (fatrah-prod) in .env.local so the script knows which project it is touching.'
  );
}

/** Seed script: staging is always allowed; production needs an explicit --confirm-production flag. */
export function resolveSeedTarget(env: NodeJS.ProcessEnv, confirmProduction: boolean): SupabaseTarget {
  const target = readTarget(env);
  if (target === 'production' && !confirmProduction) {
    throw new TargetError(
      'SUPABASE_TARGET=production: re-run with --confirm-production to seed the production project. ' +
        'Sample ready-stock bags and sizes are never seeded to production.'
    );
  }
  return target;
}

/** Integration tests may write test data, so they run against staging only. */
export function assertStagingTarget(env: NodeJS.ProcessEnv): void {
  const target = readTarget(env);
  if (target !== 'staging') {
    throw new TargetError(
      `Integration tests only run against fatrah-staging (SUPABASE_TARGET=staging); got "${target}".`
    );
  }
}

/** Host of the configured Supabase URL, for log output. Never includes keys. */
export function describeProject(env: NodeJS.ProcessEnv): string {
  try {
    return new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? '').host;
  } catch {
    return '(unknown host)';
  }
}
