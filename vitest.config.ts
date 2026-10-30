import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * Unit test configuration (the default `npm run test:unit` gate).
 *
 * Runs pure logic and React component tests in a `jsdom` environment with no
 * network access. It matches `*.test.ts(x)` but deliberately excludes the
 * `*.integration.test.ts(x)` pattern and the e2e directory, so a unit run never
 * touches Supabase and a developer with no cloud credentials can still run the
 * full unit suite offline.
 *
 * Integration tests that talk to a real Supabase test project live under a
 * separate config (`vitest.integration.config.ts`, `npm run test:integration`)
 * so network-dependent tests never slow down or flake the unit gate.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/*.integration.test.{ts,tsx}',
      'tests/e2e/**',
    ],
  },
});
