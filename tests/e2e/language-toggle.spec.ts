import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: language toggle (EN <-> BM).
 *
 * Validates: Requirements 14.7, 12.1, 12.2
 *
 * "Nothing left in the prior language": after each toggle we assert every
 * translated string rendered on the page is present in the new language and
 * that its counterpart from the other language is absent.
 *
 * The dictionary pairs are read straight from context/LanguageContext.tsx so
 * the test cannot drift from the real copy. Component-local EN/MS strings
 * (Collection card overlay, CartDrawer) are listed in COMPONENT_PAIRS below.
 */

type Pair = { key: string; en: string; ms: string };

// Dictionary keys that are not rendered anywhere on the homepage:
// `cart` is unused, `productNDesc` were replaced by DB-driven descriptions.
const UNRENDERED_KEYS = /^(cart|product\d+Desc)$/;

function loadDictionaryPairs(): Pair[] {
  const src = readFileSync(join(process.cwd(), 'context', 'LanguageContext.tsx'), 'utf8');
  const str = `('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")`;
  const re = new RegExp(`(\\w+):\\s*\\{\\s*en:\\s*${str},\\s*ms:\\s*${str}\\s*,?\\s*\\}`, 'g');
  const pairs: Pair[] = [];
  for (const m of src.matchAll(re)) {
    // The captured literals are source-controlled string literals.
    const en = new Function(`return ${m[2]}`)() as string;
    const ms = new Function(`return ${m[3]}`)() as string;
    pairs.push({ key: m[1], en, ms });
  }
  return pairs;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').toLowerCase();

const dictPairs = loadDictionaryPairs().filter(
  (p) => !UNRENDERED_KEYS.test(p.key) && norm(p.en) !== norm(p.ms),
);

// Strings hard-coded per-component with `lang === 'en' ? ... : ...`.
const HOME_COMPONENT_PAIRS: Pair[] = [
  { key: 'card.view', en: 'View Product', ms: 'Lihat Produk' },
  { key: 'card.add', en: '+ Add to Cart', ms: '+ Tambah ke Troli' },
  { key: 'drawer.title', en: 'Your Cart', ms: 'Troli Anda' },
  { key: 'drawer.empty', en: 'Your cart is empty', ms: 'Troli anda kosong' },
  { key: 'drawer.emptyHint', en: 'Add a bag to get started.', ms: 'Tambah beg untuk bermula.' },
];

const CART_ITEM_PAIRS: Pair[] = [
  { key: 'drawer.remove', en: 'Remove', ms: 'Buang' },
  { key: 'drawer.subtotal', en: 'Subtotal', ms: 'Jumlah kecil' },
  {
    key: 'drawer.leadTime',
    en: 'Made to order — allow 2–4 weeks for delivery.',
    ms: 'Dibuat mengikut tempahan — 2–4 minggu untuk penghantaran.',
  },
  { key: 'drawer.whatsapp', en: 'Order via WhatsApp', ms: 'Pesan via WhatsApp' },
];

async function pageText(page: Page): Promise<string> {
  return norm(await page.locator('body').innerText());
}

async function expectLanguage(page: Page, lang: 'en' | 'ms', pairs: Pair[]) {
  const other = lang === 'en' ? 'ms' : 'en';
  // Poll so we tolerate the re-render after the toggle click.
  for (const p of pairs) {
    await expect
      .poll(async () => (await pageText(page)).includes(norm(p[lang])), {
        message: `"${p.key}" should show ${lang}: ${p[lang]}`,
      })
      .toBe(true);
  }
  const text = await pageText(page);
  for (const p of pairs) {
    expect(text.includes(norm(p[other])), `"${p.key}" left over in ${other}: ${p[other]}`).toBe(false);
  }
}

async function toggle(page: Page) {
  // dispatchEvent: the open cart drawer (z-50) overlays the header toggle, so a real
  // pointer click would be intercepted while the drawer is open.
  await page.getByRole('button', { name: 'EN / BM' }).dispatchEvent('click');
}

// Clicks can land before hydration; retry until the drawer actually opens.
async function openCart(page: Page) {
  const drawer = page.getByRole('complementary', { name: 'Shopping cart' });
  await expect(async () => {
    await page.getByRole('button', { name: 'Open cart' }).click();
    // The drawer is always in the DOM; it is open when not translated off-screen.
    await expect(drawer).toHaveClass(/translate-x-0/, { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

test.describe('language toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('homepage switches every translated string EN -> MS -> EN', async ({ page }) => {
    expect(dictPairs.length).toBeGreaterThan(10);
    const pairs = [...dictPairs, ...HOME_COMPONENT_PAIRS];

    await expectLanguage(page, 'en', pairs);

    await toggle(page);
    await expectLanguage(page, 'ms', pairs);

    await toggle(page);
    await expectLanguage(page, 'en', pairs);
  });

  test('product descriptions follow the selected language', async ({ page }) => {
    const cards = page.locator('#collection h3');
    const count = await cards.count();
    test.skip(count === 0, 'No products rendered (fail-soft state); nothing to compare');

    const descLocator = page.locator('#collection h3 + div > span:first-child');
    const en = await descLocator.allInnerTexts();
    await toggle(page);
    await expect(page.getByText('Lihat Semua')).toBeVisible();
    const ms = await descLocator.allInnerTexts();

    expect(ms).toHaveLength(en.length);
    // Descriptions re-render in MS (seed data has distinct EN/MS copy), and
    // toggling back restores the exact EN set.
    expect(ms.some((d, i) => d !== en[i])).toBe(true);

    await toggle(page);
    await expect(page.getByText('View All')).toBeVisible();
    expect(await descLocator.allInnerTexts()).toEqual(en);
  });

  test('cart drawer (empty and with an item) switches language', async ({ page }) => {
    await openCart(page);
    await expectLanguage(page, 'en', HOME_COMPONENT_PAIRS.filter((p) => p.key.startsWith('drawer')));

    await toggle(page);
    await expectLanguage(page, 'ms', HOME_COMPONENT_PAIRS.filter((p) => p.key.startsWith('drawer')));
    await toggle(page);
    await page.getByRole('button', { name: 'Close cart' }).click();
    await expect(page.getByRole('complementary', { name: 'Shopping cart' })).toHaveClass(/translate-x-full/);

    const addButtons = page.getByRole('button', { name: '+ Add to Cart' });
    test.skip((await addButtons.count()) === 0, 'No products rendered; cannot populate cart');
    // The button lives in a hover overlay; force the click.
    await addButtons.first().click({ force: true });

    // addItem opens the drawer itself.
    const drawer = page.getByRole('complementary', { name: 'Shopping cart' });
    await expect(drawer).toHaveClass(/translate-x-0/);
    await expect(drawer.getByRole('button', { name: 'Remove' })).toBeVisible();

    const drawerPairs = [
      ...CART_ITEM_PAIRS,
      HOME_COMPONENT_PAIRS.find((p) => p.key === 'drawer.title')!,
    ];
    await expectLanguage(page, 'en', drawerPairs);
    await toggle(page);
    await expectLanguage(page, 'ms', drawerPairs);
    await toggle(page);
    await expectLanguage(page, 'en', drawerPairs);
  });

  test.fixme(
    'Showcase and cart/menu aria-labels are translated',
    // GAP (not edited per task rules): components/Showcase.tsx ("Previous",
    // "Next", "Go to slide N") and the Header/CartDrawer aria-labels ("Open cart",
    // "Close cart", "Open menu", "Decrease", ...) are hard-coded English and do
    // not switch to MS. Also CartDrawer shows "(N items)" with an English
    // plural "s" appended in both languages. Enable once these use the dictionary.
    async ({ page }) => {
      await toggle(page);
      await expect(page.getByRole('button', { name: 'Previous' })).toHaveCount(0);
    },
  );
});
