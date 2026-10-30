import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright end-to-end configuration.
 *
 * The base URL is read from the environment so the same suite can run against a
 * local dev server, a Vercel preview deployment, or production without code
 * changes:
 *
 *   PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app npm run test:e2e
 *
 * In CI the e2e job sets PLAYWRIGHT_BASE_URL to the preview URL (per design:
 * "e2e runs against the live Vercel Preview URL"). Locally it falls back to the
 * Next dev server on port 3000.
 *
 * Only a chromium project is defined for now; additional browsers can be added
 * to `projects` later without touching the rest of the config.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Bypass Vercel Deployment Protection on previews when a secret is provided.
    ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          extraHTTPHeaders: {
            'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          },
        }
      : {}),
  },
  // Start the local dev server only when no external base URL (e.g. CI preview) is provided.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
