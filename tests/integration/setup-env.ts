import { existsSync } from 'node:fs';

// Load local env for integration tests. In CI the env comes from secrets,
// so a missing .env.local is fine.
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}
