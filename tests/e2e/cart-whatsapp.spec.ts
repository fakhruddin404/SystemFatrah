import { test, expect, type Page } from '@playwright/test';

/**
 * Cart + WhatsApp e2e. window.open is stubbed so we never navigate to WhatsApp.
 *
 * Property 5: Preserved behavior
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.6, 12.1, 12.2, 12.3, 14.7
 */

const WHATSAPP_NUMBER = '60132577325';

declare global {
  interface Window {
    __opened: { url: string; target?: string }[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = ((url?: string | URL, target?: string) => {
      window.__opened.push({ url: String(url), target });
      return null;
    }) as typeof window.open;
  });
});

async function openFirstProduct(page: Page): Promise<string> {
  await page.goto('/');
  const href = await page
    .locator('#collection a[href^="/products/"]')
    .first()
    .getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href!);
  const name = (await page.getByRole('heading', { level: 1 }).first().innerText()).trim();
  expect(name.length).toBeGreaterThan(0);
  return name;
}

async function setQty(page: Page, qty: number) {
  for (let i = 1; i < qty; i++) {
    await page.getByRole('button', { name: 'Increase quantity' }).click();
  }
}

async function lastOpened(page: Page) {
  const opened = await page.evaluate(() => window.__opened);
  expect(opened.length).toBeGreaterThan(0);
  const call = opened[opened.length - 1];
  const url = new URL(call.url);
  return { call, url, text: new URLSearchParams(url.search).get('text') ?? '' };
}

test.describe('cart and WhatsApp ordering', () => {
  test('add-to-cart updates drawer count and total, drawer WhatsApp URL is correct', async ({ page }) => {
    const name = await openFirstProduct(page);
    const qty = 3;
    await setQty(page, qty);
    await page.getByRole('button', { name: /Add to Cart/ }).click();

    // Header count
    await expect(page.getByRole('button', { name: 'Open cart' })).toContainText(`(${qty})`);

    // addItem opens the drawer automatically.
    const drawer = page.getByRole('complementary', { name: 'Shopping cart' });
    await expect(drawer).toContainText(`(${qty} items)`);
    await expect(drawer).toContainText(name);

    const priceText = (await drawer.locator('li span.text-maroon').first().innerText()).trim();
    expect(priceText).toMatch(/^RM\s*[\d.,]+/);
    const unit = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    const expectedTotal = `RM ${(unit * qty).toFixed(2)}`;
    await expect(drawer.getByText(expectedTotal, { exact: true })).toBeVisible();

    await drawer.getByRole('button', { name: 'Order via WhatsApp' }).click();
    const { call, url, text } = await lastOpened(page);
    expect(call.target).toBe('_blank');
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(text).toContain(name);
    expect(text).toContain(`x${qty}`);
    expect(text).toContain(priceText);
    expect(text).toContain(`Total: ${expectedTotal}`);
    // We stayed on the site.
    expect(new URL(page.url()).hostname).not.toContain('wa.me');
  });

  test('product page Order via WhatsApp button uses qty', async ({ page }) => {
    const name = await openFirstProduct(page);
    const qty = 2;
    await setQty(page, qty);
    await page.getByRole('button', { name: 'Order via WhatsApp' }).click();

    const { call, url, text } = await lastOpened(page);
    expect(call.target).toBe('_blank');
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(text).toContain(name);
    expect(text).toContain(`x${qty}`);
    expect(text).toMatch(/RM\s*\d+/);
  });

  test('no checkout or payment surface exists', async ({ page }) => {
    await openFirstProduct(page);
    await page.getByRole('button', { name: /Add to Cart/ }).click();
    // addItem opens the drawer automatically.
    await expect(page.getByRole('complementary', { name: 'Shopping cart' })).toContainText('(1 item');

    const forbiddenText = /\b(checkout|payment|pay now|card number|credit card|cvv)\b/i;
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(forbiddenText);
    await expect(page.getByRole('button', { name: /checkout|pay\b|payment/i })).toHaveCount(0);

    const hrefs = await page.locator('a[href]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? ''),
    );
    for (const h of hrefs) {
      expect(h).not.toMatch(/checkout|payment|stripe|paypal|billplz|toyyibpay|fpx/i);
    }

    // No payment form inputs
    await expect(page.locator('input[autocomplete^="cc-"], input[name*="card" i]')).toHaveCount(0);

    // /checkout route does not exist
    const res = await page.request.get('/checkout');
    expect(res.status()).toBe(404);
  });
});
