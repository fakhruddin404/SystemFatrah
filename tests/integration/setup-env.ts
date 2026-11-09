import { existsSync } from 'node:fs';
import { assertStagingTarget } from '../../scripts/target-guard';

// Load local env for integration tests. In CI the env comes from secrets,
// so a missing .env.local is fine.
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

// Integration tests may write test rows, so they must only ever run against fatrah-staging.
// Refuse to run (instead of silently skipping) when a project is configured without that
// being stated explicitly via SUPABASE_TARGET=staging.
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  assertStagingTarget(process.env);
}
