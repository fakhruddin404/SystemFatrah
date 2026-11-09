import { test, expect } from '@playwright/test';

/**
 * Admin area.
 *
 * The access-control tests need no credentials. The full lifecycle test is opt-in and
 * runs only when ADMIN_E2E_EMAIL and ADMIN_E2E_PASSWORD are set to an admin user of the
 * STAGING project (never use production credentials here). It creates a bag, checks the
 * public site, marks it sold, then deletes it.
 */

const email = process.env.ADMIN_E2E_EMAIL;
const password = process.env.ADMIN_E2E_PASSWORD;

test.describe('admin access control', () => {
  for (const path of [
    '/admin',
    '/admin/ready-stock',
    '/admin/ready-stock/new',
    '/admin/products',
    '/admin/products/new',
  ]) {
    test(`anonymous visitors are sent to the login page from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fat_Rahz Batik');
    });
  }

  test('the login page is not indexable and has no storefront cart', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('complementary', { name: 'Shopping cart' })).toHaveCount(0);
  });

  test('wrong credentials show one generic message', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('nobody@example.test');
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Scoped to the form: Next's route announcer also has role="alert".
    await expect(page.locator('form').getByRole('alert')).toHaveText('Invalid email or password.');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('admin Server Action endpoints are not reachable without a session', async ({ request }) => {
    const res = await request.post('/admin/ready-stock/new', {
      headers: { 'Next-Action': 'deadbeef' },
      data: {},
      maxRedirects: 0,
    });
    // Redirected to login by the middleware (or rejected); never a success.
    expect([301, 302, 303, 307, 308, 400, 401, 403, 404]).toContain(res.status());
  });
});

test.describe.serial('admin ready-stock lifecycle', () => {
  test.skip(!email || !password, 'Set ADMIN_E2E_EMAIL and ADMIN_E2E_PASSWORD (staging admin) to run');

  const bagName = `E2E Bag ${Date.now()}`;

  test('sign in', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
  });

  test('add a bag by pasting an image link, see it on the public site', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/ready-stock/new');
    await page.getByLabel('Image URL').fill('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    await page.getByLabel('Name').fill(bagName);
    await page.getByLabel('Price (RM)').fill('123.50');
    await page.getByLabel('Size').fill('Medium');
    await page.getByRole('button', { name: 'Add bag' }).click();

    await expect(page).toHaveURL(/\/admin\/ready-stock$/);
    await expect(page.getByText(bagName)).toBeVisible();

    await expect
      .poll(async () => (await page.request.get('/ready-stock')).text(), { timeout: 30_000 })
      .toContain(bagName);
  });

  test('marking it sold hides it from the public site straight away', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/ready-stock');
    const row = page.locator('li', { hasText: bagName });
    await row.getByRole('button', { name: 'Mark sold' }).click();
    await expect(row.getByRole('button', { name: 'Mark available' })).toBeVisible();

    await expect
      .poll(async () => (await page.request.get('/ready-stock')).text(), { timeout: 30_000 })
      .not.toContain(bagName);
  });

  test('delete the bag', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/ready-stock');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.locator('li', { hasText: bagName }).getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(bagName)).toHaveCount(0);
  });
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  if (/\/admin$/.test(page.url())) return;
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
