import { test, expect } from '@playwright/test';

/**
 * Placeholder smoke test for the Playwright e2e runner.
 *
 * Its only job is to prove the Playwright harness executes (config loads,
 * chromium project launches a browser, assertions run). It deliberately does
 * NOT navigate to the app so it can pass with no running server and no base
 * URL configured. Real e2e tests against the preview URL (homepage grid,
 * bilingual detail page, language toggle, add-to-cart, WhatsApp URL) arrive in
 * later tasks.
 */
test('playwright e2e harness smoke test', async ({ page }) => {
  await page.setContent('<h1 data-testid="smoke">FATRAH harness ok</h1>');
  await expect(page.getByTestId('smoke')).toHaveText('FATRAH harness ok');
});
