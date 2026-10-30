import { existsSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

/**
 * Product detail e2e: both EN and MS descriptions render, plus the
 * made-to-order 2–4 week note (hardcoded English copy on the page).
 *
 * Validates: Requirements 14.7, 12.3
 */

if (existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    /* ignore */
  }
}

interface Row {
  id: string;
  name: string;
  description_en: string;
  description_ms: string;
}

async function fetchRows(): Promise<Row[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const res = await fetch(
    `${url}/rest/v1/products?select=id,name,description_en,description_ms&order=sort_order,id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) return null;
  return (await res.json()) as Row[];
}

async function expectMadeToOrderNote(page: Page) {
  const note = page.locator('p', { hasText: 'Made to order — allow' });
  await expect(note).toBeVisible();
  await expect(note).toContainText('2–4 weeks');
}

test.describe('product detail', () => {
  test('shows EN + MS descriptions and made-to-order note for each product', async ({ page }) => {
    const rows = await fetchRows();

    if (rows && rows.length > 0) {
      for (const row of rows) {
        await page.goto(`/products/${row.id}`);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(row.name);
        await expect(page.getByText(row.description_en.trim(), { exact: true })).toBeVisible();
        const ms = page.getByText(row.description_ms.trim(), { exact: true });
        await expect(ms).toBeVisible();
        await expect(ms).toHaveCSS('font-style', 'italic');
        await expectMadeToOrderNote(page);
      }
    } else {
      // Fallback (no Supabase env): discover a product from the homepage.
      await page.goto('/');
      const href = await page
        .locator('#collection a[href^="/products/"]')
        .first()
        .getAttribute('href');
      expect(href).toMatch(/^\/products\/.+/);
      await page.goto(href!);
      const paras = page.locator('main p.text-\\[15px\\]');
      await expect(paras).toHaveCount(2);
      const [en, ms] = await paras.allTextContents();
      expect(en.trim().length).toBeGreaterThan(0);
      expect(ms.trim().length).toBeGreaterThan(0);
      await expectMadeToOrderNote(page);
    }
  });

  test('unknown product id shows the 404 page', async ({ page }) => {
    const res = await page.goto('/products/does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/could not be found|not found/i).first()).toBeVisible();
    await expect(page.locator('p', { hasText: 'Made to order — allow' })).toHaveCount(0);
  });
});
