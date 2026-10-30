import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Integration test configuration (`npm run test:integration`).
 *
 * These tests run against a REAL Supabase test project (never production), so
 * they run in a `node` environment and only match `*.integration.test.ts(x)`.
 * They are kept in a separate config from the unit gate so network-dependent
 * tests never slow down or flake the offline unit suite.
 *
 * The Supabase connection details are read from the environment at runtime
 * (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`); CI supplies
 * them from repository secrets pointed at the separate test project.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    name: 'integration',
    environment: 'node',
    globals: true,
    setupFiles: ['tests/integration/setup-env.ts'],
    include: ['**/*.integration.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/e2e/**'],
  },
});
