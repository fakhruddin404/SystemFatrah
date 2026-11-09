import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const verifyReadyStock = vi.fn<(ids: string[]) => Promise<string[] | null>>();
vi.mock('@/app/actions/verify-ready-stock', () => ({
  verifyReadyStock: (ids: string[]) => verifyReadyStock(ids),
}));

import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import ReadyStockActions from '@/components/ReadyStockActions';
import CartDrawer from '@/components/CartDrawer';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { WHATSAPP_NUMBER } from '@/lib/site';
import { product, readyItem } from './fixtures';

/** Test-only controls driving the real context APIs. */
function Controls() {
  const { toggle } = useLanguage();
  const { addPreorder, addReadyStock } = useCart();
  return (
    <>
      <button onClick={toggle}>toggle-lang</button>
      <button onClick={() => addPreorder(product)}>add-product</button>
      <button onClick={() => addReadyStock(readyItem)}>add-ready</button>
    </>
  );
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>{children}</CartProvider>
    </LanguageProvider>
  );
}

interface Placeholder {
  closed: boolean;
  close: ReturnType<typeof vi.fn>;
  location: { href: string };
}

let openSpy: ReturnType<typeof vi.fn>;
let placeholder: Placeholder;

beforeEach(() => {
  placeholder = {
    closed: false,
    close: vi.fn(() => {
      placeholder.closed = true;
    }),
    location: { href: '' },
  };
  // A blank window is the placeholder opened inside the click gesture; real URLs return null.
  openSpy = vi.fn((url?: string) => (url === '' ? placeholder : null));
  vi.stubGlobal('open', openSpy);
  window.open = openSpy as unknown as typeof window.open;
  verifyReadyStock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The single real wa.me window the app opened directly (pre-order-only path). */
function openedDirectly() {
  expect(openSpy).toHaveBeenCalledTimes(1);
  const [href, target] = openSpy.mock.calls[0];
  const url = new URL(href as string);
  return { url, target, text: url.searchParams.get('text') ?? '' };
}

/** The wa.me URL the placeholder tab was pointed at (ready-stock path). */
function navigatedPlaceholder() {
  const url = new URL(placeholder.location.href);
  return { url, text: url.searchParams.get('text') ?? '' };
}

describe('ProductPurchasePanel WhatsApp order', () => {
  function setup() {
    render(
      <Providers>
        <Controls />
        <ProductPurchasePanel product={product} />
      </Providers>
    );
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    fireEvent.click(screen.getByLabelText('Increase quantity')); // qty = 3
  }

  it('English: targets the business number with product, quantity and notes', () => {
    setup();
    fireEvent.click(screen.getByText('Order via WhatsApp'));
    const { url, target, text } = openedDirectly();
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(target).toBe('_blank');
    expect(text).toContain('Hello Fat_Rahz Batik! I would like to order:');
    expect(text).toContain('• Batik Tote Indigo x3 — RM 480');
    expect(text).toContain('Subtotal: RM 1440.00');
    expect(text).toContain('Delivery fee will be confirmed on WhatsApp.');
    expect(text).toContain('Pre-order items are made to order — allow 2–4 weeks.');
  });

  it('Malay: uses the Malay message', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-lang'));
    fireEvent.click(screen.getByText('Pesan via WhatsApp'));
    const { text } = openedDirectly();
    expect(text).toContain('Assalamualaikum Fat_Rahz Batik! Saya ingin memesan:');
    expect(text).toContain('• Batik Tote Indigo x3 — RM 480');
    expect(text).toContain('Terima kasih!');
  });
});

describe('CartDrawer WhatsApp checkout (pre-order)', () => {
  function setup() {
    render(
      <Providers>
        <Controls />
        <CartDrawer />
      </Providers>
    );
  }

  it('English: sends lines, subtotal and the delivery note', () => {
    setup();
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('add-product')); // qty = 2
    fireEvent.click(screen.getByText('Order via WhatsApp'));
    const { url, target, text } = openedDirectly();
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(target).toBe('_blank');
    expect(text).toContain('Hello Fat_Rahz Batik! I would like to order:');
    expect(text).toContain('• Batik Tote Indigo x2 — RM 480');
    expect(text).toContain('Subtotal: RM 960.00');
    expect(text).toContain('Delivery fee will be confirmed on WhatsApp.');
    expect(text).toContain('Please confirm my order. Thank you!');
    expect(verifyReadyStock).not.toHaveBeenCalled();
  });

  it('Malay: sends the Malay message', () => {
    setup();
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('toggle-lang'));
    fireEvent.click(screen.getByText('Pesan via WhatsApp'));
    const { text } = openedDirectly();
    expect(text).toContain('Assalamualaikum Fat_Rahz Batik! Saya ingin memesan:');
    expect(text).toContain('Jumlah kecil: RM 960.00');
    expect(text).toContain('Kos penghantaran akan disahkan melalui WhatsApp.');
  });

  it('empty cart: no checkout control and nothing is opened', () => {
    setup();
    expect(screen.queryByText('Order via WhatsApp')).toBeNull();
    fireEvent.click(screen.getByText('toggle-lang'));
    expect(screen.queryByText('Pesan via WhatsApp')).toBeNull();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('shows the delivery note always, and the lead time only for pre-order items', () => {
    setup();
    fireEvent.click(screen.getByText('add-ready'));
    expect(screen.getByText('Delivery fee will be confirmed with you on WhatsApp.')).toBeTruthy();
    expect(screen.queryByText(/allow 2–4 weeks/)).toBeNull();

    fireEvent.click(screen.getByText('add-product'));
    expect(screen.getByText(/allow 2–4 weeks/)).toBeTruthy();
  });

  it('merges repeat adds of one pre-order product and offers a stepper', () => {
    setup();
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('add-product'));
    expect(screen.getByText('(2 items)')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Decrease'));
    expect(screen.getByText('(1 item)')).toBeTruthy();
  });
});

describe('CartDrawer ready-stock checkout', () => {
  function setup() {
    render(
      <Providers>
        <Controls />
        <CartDrawer />
      </Providers>
    );
    fireEvent.click(screen.getByText('add-ready'));
    fireEvent.click(screen.getByText('add-product'));
  }

  it('re-checks availability, then sends the code in the message', async () => {
    verifyReadyStock.mockResolvedValue([readyItem.id]);
    setup();
    fireEvent.click(screen.getByText('Order via WhatsApp'));

    await waitFor(() => expect(placeholder.location.href).not.toBe(''));
    expect(verifyReadyStock).toHaveBeenCalledWith([readyItem.id]);
    const { url, text } = navigatedPlaceholder();
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(text).toContain('Ready stock (one-of-a-kind)');
    expect(text).toContain('[RS-0042] Pesisir Sling (Size: Medium) — RM 180');
    expect(text).toContain('• Batik Tote Indigo x1 — RM 480');
    expect(text).toContain('Subtotal: RM 660.00');
    expect(placeholder.close).not.toHaveBeenCalled();
  });

  it('removes a bag that just sold, tells the customer, and opens nothing', async () => {
    verifyReadyStock.mockResolvedValue([]);
    setup();
    expect(screen.getByText('RS-0042')).toBeTruthy();
    fireEvent.click(screen.getByText('Order via WhatsApp'));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Pesisir Sling just sold');
    expect(placeholder.close).toHaveBeenCalled();
    expect(placeholder.location.href).toBe('');
    expect(screen.queryByText('RS-0042')).toBeNull();
    // The pre-order line is still in the cart.
    expect(screen.getByText('Batik Tote Indigo')).toBeTruthy();
    // Only the blank placeholder was ever opened.
    expect(openSpy.mock.calls.every(([url]) => url === '')).toBe(true);
  });

  it('does not block the customer when the availability check fails', async () => {
    verifyReadyStock.mockResolvedValue(null);
    setup();
    fireEvent.click(screen.getByText('Order via WhatsApp'));
    await waitFor(() => expect(placeholder.location.href).not.toBe(''));
    expect(navigatedPlaceholder().text).toContain('[RS-0042]');
  });

  it('falls back to a normal window when the placeholder was blocked', async () => {
    verifyReadyStock.mockResolvedValue([readyItem.id]);
    openSpy.mockImplementation(() => null); // popup blocker: no window handle at all
    setup();
    fireEvent.click(screen.getByText('Order via WhatsApp'));
    await waitFor(() => expect(openSpy.mock.calls.length).toBe(2));
    const [href, target] = openSpy.mock.calls[1];
    expect(String(href)).toContain(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(target).toBe('_blank');
  });
});

describe('ReadyStockActions', () => {
  function setup() {
    render(
      <Providers>
        <ReadyStockActions item={readyItem} />
        <CartDrawer />
      </Providers>
    );
  }

  it('adds the bag once and then disables the button', () => {
    setup();
    const add = screen.getByRole('button', { name: '+ Add to Cart' });
    fireEvent.click(add);
    const inCart = screen.getByRole('button', { name: 'In your cart' }) as HTMLButtonElement;
    expect(inCart.disabled).toBe(true);
  });

  it('orders directly on WhatsApp when the bag is still available', async () => {
    verifyReadyStock.mockResolvedValue([readyItem.id]);
    setup();
    fireEvent.click(screen.getAllByText('Order via WhatsApp')[0]);
    await waitFor(() => expect(placeholder.location.href).not.toBe(''));
    expect(navigatedPlaceholder().text).toContain('[RS-0042]');
  });

  it('shows a notice and a way back when the bag has just sold', async () => {
    verifyReadyStock.mockResolvedValue([]);
    setup();
    fireEvent.click(screen.getAllByText('Order via WhatsApp')[0]);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Pesisir Sling just sold');
    expect(screen.getByText('See what is still available').getAttribute('href')).toBe('/ready-stock');
    expect(placeholder.location.href).toBe('');
  });
});
