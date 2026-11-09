import { test, expect } from '@playwright/test';

/**
 * Ready-stock browsing and ordering. Needs at least one available bag in the target project
 * (staging has the sample bags from `npm run seed`); the tests skip themselves otherwise.
 * window.open is stubbed so we never navigate to WhatsApp.
 */

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

test.describe('ready stock', () => {
  test('lists available bags with green Ready Stock badges', async ({ page }) => {
    await page.goto('/ready-stock');
    const cards = page.locator('h3');
    test.skip((await cards.count()) === 0, 'No ready-stock bags available in this project');

    await expect(page.locator('[data-variant="ready"]').first()).toBeVisible();
    await expect(page.locator('[data-variant="preorder"]')).toHaveCount(0);
    const links = await page.locator('a[href^="/ready-stock/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href'))
    );
    expect(links.length).toBe(await cards.count());
    for (const href of links) expect(href).toMatch(/^\/ready-stock\/RS-/);
  });

  test('a bag has its own page, can be added once, and is ordered by code', async ({ page }) => {
    await page.goto('/ready-stock');
    const first = page.locator('a[href^="/ready-stock/"]').first();
    test.skip((await first.count()) === 0, 'No ready-stock bags available in this project');

    const href = await first.getAttribute('href');
    await page.goto(href!);
    const code = (await page.getByTestId('ready-code').innerText()).trim();
    expect(code).toMatch(/^RS-/);
    await expect(page.locator('[data-variant="ready"]').first()).toBeVisible();

    // Quantity is fixed at 1: no stepper on a one-of-a-kind bag.
    await expect(page.getByLabel('Increase quantity')).toHaveCount(0);

    await page.getByRole('button', { name: '+ Add to Cart' }).click();
    const drawer = page.getByRole('complementary', { name: 'Shopping cart' });
    await expect(drawer).toContainText(code);
    await expect(drawer).toContainText('(1 item)');
    await expect(drawer.getByLabel('Increase')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'In your cart' })).toBeDisabled();

    await drawer.getByRole('button', { name: 'Order via WhatsApp' }).click();
    await expect
      .poll(async () => (await page.evaluate(() => window.__opened)).some((o) => o.url.includes('wa.me')))
      .toBe(true);
    const opened = await page.evaluate(() => window.__opened);
    const wa = opened.find((o) => o.url.includes('wa.me'))!;
    const text = new URL(wa.url).searchParams.get('text') ?? '';
    expect(text).toContain(`[${code}]`);
    expect(text).toContain('Ready stock (one-of-a-kind)');
    expect(text).toContain('Delivery fee will be confirmed on WhatsApp.');
    expect(text).not.toContain('allow 2–4 weeks');
  });

  test('a sold or unknown code shows a friendly page that links back', async ({ page }) => {
    const res = await page.goto('/ready-stock/RS-DOES-NOT-EXIST');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This bag is no longer available');
    await expect(page.getByRole('link', { name: 'See ready stock' })).toHaveAttribute('href', '/ready-stock');
    await expect(page.getByRole('link', { name: 'Browse pre-order' })).toHaveAttribute('href', '/pre-order');
  });

  test('home shows a Ready now strip only when bags are available', async ({ page }) => {
    await page.goto('/');
    const strip = page.locator('#ready-now');
    const available = await page.request.get('/ready-stock').then((r) => r.text());
    const hasBags = /data-variant="ready"/.test(available);
    if (hasBags) {
      await expect(strip).toBeAttached();
      await expect(strip.locator('[data-variant="ready"]').first()).toBeVisible();
    } else {
      await expect(strip).toHaveCount(0);
    }
  });
});

test.describe('sizes on pre-order products', () => {
  test('a product with sizes needs a size; a one-size product does not', async ({ page }) => {
    await page.goto('/pre-order');
    const hrefs = await page.locator('a[href^="/products/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') as string)
    );
    test.skip(hrefs.length === 0, 'No products rendered');

    let sawSized = false;
    let sawOneSize = false;
    for (const href of hrefs) {
      await page.goto(href);
      const hasSizes = (await page.getByRole('radio').count()) > 0;
      const add = page.getByRole('button', { name: '+ Add to Cart' });
      if (hasSizes) {
        sawSized = true;
        await expect(add).toBeDisabled();
        await expect(page.getByRole('status')).toContainText('Please choose a size.');
        await page.getByRole('radio').first().click();
        await expect(add).toBeEnabled();
      } else {
        sawOneSize = true;
        await expect(add).toBeEnabled();
      }
    }
    test.info().annotations.push({ type: 'coverage', description: `sized=${sawSized} oneSize=${sawOneSize}` });
  });
});
