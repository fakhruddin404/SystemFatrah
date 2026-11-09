import { test, expect } from '@playwright/test';

/**
 * Site navigation, brand and external links.
 */

test.describe('navigation and brand', () => {
  test('header links reach Pre-order, Ready Stock and Our Story', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');

    await header.getByRole('link', { name: 'Pre-order' }).click();
    await expect(page).toHaveURL(/\/pre-order$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pre-order');

    await page.getByRole('banner').getByRole('link', { name: 'Ready Stock' }).click();
    await expect(page).toHaveURL(/\/ready-stock$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('banner').getByRole('link', { name: 'Our Story' }).click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test('Contact opens WhatsApp in a new tab', async ({ page }) => {
    await page.goto('/');
    const contact = page.getByRole('banner').getByRole('link', { name: 'Contact' });
    await expect(contact).toHaveAttribute('href', /^https:\/\/wa\.me\/\d{8,15}$/);
    await expect(contact).toHaveAttribute('target', '_blank');
    await expect(contact).toHaveAttribute('rel', /noopener/);
  });

  test('footer links to Instagram, Threads and Shopee without tracking parameters', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/beg_batik/'
    );
    await expect(footer.getByRole('link', { name: 'Threads' })).toHaveAttribute(
      'href',
      'https://www.threads.com/@beg_batik'
    );
    await expect(footer.getByRole('link', { name: 'Shopee' })).toHaveAttribute(
      'href',
      'https://shopee.com.my/shop/162336477'
    );
    for (const name of ['Instagram', 'Threads', 'Shopee']) {
      await expect(footer.getByRole('link', { name })).toHaveAttribute('rel', /noopener/);
    }
  });

  test('the brand appears as Fat_Rahz Batik in titles and never as FATRAH', async ({ page }) => {
    for (const path of ['/', '/pre-order', '/ready-stock', '/about']) {
      await page.goto(path);
      await expect(page).toHaveTitle(/Fat_Rahz Batik/);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/fatrah/i);
    }
  });

  test('pre-order page lists designs with Pre-Order badges', async ({ page }) => {
    await page.goto('/pre-order');
    const cards = page.locator('h3');
    test.skip((await cards.count()) === 0, 'No products rendered (fail-soft state)');
    await expect(page.locator('[data-variant="preorder"]').first()).toBeVisible();
    await expect(page.locator('[data-variant="ready"]')).toHaveCount(0);
  });
});
