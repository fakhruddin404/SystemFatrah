import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';

/**
 * Homepage e2e: product grid comes from Supabase and the page composes
 * Header, Hero, Showcase, Collection, Banner, Footer (in order).
 *
 * Validates: Requirements 14.7, 12.4
 */

if (existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    /* ignore */
  }
}

async function fetchExpectedNames(): Promise<string[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/products?select=id,name&order=sort_order,id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { id: string; name: string }[];
  return rows.map((r) => r.name);
}

test.describe('homepage', () => {
  test('composes all sections in order', async ({ page }) => {
    await page.goto('/');

    const header = page.getByRole('banner');
    const hero = page.getByRole('heading', { level: 1 });
    const showcaseNext = page.getByRole('button', { name: 'Next', exact: true });
    const collection = page.locator('#collection');
    const banner = page.getByTestId('banner');
    const footer = page.getByRole('contentinfo');

    await expect(header).toBeVisible();
    await expect(header.getByRole('link', { name: 'FATRAH' })).toBeVisible();
    await expect(hero).toBeVisible();
    await expect(showcaseNext).toBeAttached();
    await expect(collection).toBeAttached();
    await expect(collection.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(banner).toBeAttached();
    await expect(footer).toBeAttached();

    // Document order: header < hero < showcase < collection < banner < footer
    const tops = await page.evaluate(() => {
      const y = (el: Element | null) => (el ? el.getBoundingClientRect().top + window.scrollY : NaN);
      const showcase = document.querySelector('button[aria-label="Next"]')?.closest('section') ?? null;
      return [
        y(document.querySelector('header')),
        y(document.querySelector('h1')?.closest('section') ?? null),
        y(showcase),
        y(document.querySelector('#collection')),
        y(document.querySelector('[data-testid="banner"]')),
        y(document.querySelector('footer')),
      ];
    });
    for (const t of tops) expect(Number.isNaN(t)).toBe(false);
    const sorted = [...tops].sort((a, b) => a - b);
    expect(tops).toEqual(sorted);
  });

  test('product grid matches Supabase products', async ({ page }) => {
    const expectedNames = await fetchExpectedNames();
    await page.goto('/');

    const cards = page.locator('#collection h3');
    if (expectedNames && expectedNames.length > 0) {
      await expect(cards).toHaveCount(expectedNames.length);
      expect(await cards.allTextContents()).toEqual(expectedNames);
    } else {
      expect(await cards.count()).toBeGreaterThan(0);
      const links = page.locator('#collection a[href^="/products/"]');
      expect(await links.count()).toBeGreaterThan(0);
    }

    // Every card links to a product detail page.
    const hrefs = await page.locator('#collection a[href^="/products/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href')),
    );
    expect(hrefs.length).toBe(await cards.count());
    for (const h of hrefs) expect(h).toMatch(/^\/products\/.+/);
  });

  test('a product image loads', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('#collection img').first();
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        timeout: 20_000,
      })
      .toBe(true);
  });
});
