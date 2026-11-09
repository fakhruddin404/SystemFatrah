import { test, expect } from '@playwright/test';

/**
 * Our Story page and the permanent /craft redirect.
 */

const RETIRED = /hamzah|mek weh|banggol|natural dye|dye bath|\bboil|generations|wax|canting/i;

test.describe('Our Story', () => {
  test('/craft permanently redirects to /about', async ({ page, request }) => {
    const res = await request.get('/craft', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toMatch(/\/about$/);

    await page.goto('/craft');
    await expect(page).toHaveURL(/\/about$/);
  });

  test('tells the craft-sewer story in English with the confirmed facts', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sewn in Terengganu, from Terengganu batik.');

    const text = await page.locator('main').innerText();
    expect(text).toContain('2014');
    expect(text).toMatch(/do not make the batik fabric/i);
    expect(text).toMatch(/100% handmade/i);
    expect(text).not.toMatch(RETIRED);
  });

  test('switches to Bahasa Melayu', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'EN / BM' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Dijahit di Terengganu, daripada batik Terengganu.'
    );
    const text = await page.locator('main').innerText();
    expect(text).not.toContain('Sewn in Terengganu');
    expect(text).toMatch(/tidak menghasilkan kain batik/i);
  });

  test('links to both ways of buying and the social profiles', async ({ page }) => {
    await page.goto('/about');
    const main = page.locator('main');
    await expect(main.getByRole('link', { name: 'Shop Ready Stock' })).toHaveAttribute('href', '/ready-stock');
    await expect(main.getByRole('link', { name: 'Browse Pre-order' })).toHaveAttribute('href', '/pre-order');
    await expect(main.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/beg_batik/'
    );
  });
});
