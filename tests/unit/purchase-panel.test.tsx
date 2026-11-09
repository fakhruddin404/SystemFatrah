import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('@/app/actions/verify-ready-stock', () => ({ verifyReadyStock: vi.fn() }));

import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import PreorderCard from '@/components/PreorderCard';
import StatusBadge from '@/components/StatusBadge';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { product, sizedProduct } from './fixtures';

function CartProbe() {
  const { items, totalCount, subtotal } = useCart();
  return (
    <div data-testid="probe">
      {items.map((l) => `${l.key}|${l.sizeLabel ?? '-'}|${l.unitPriceMyr}|${l.quantity}`).join(';')}
      {` count=${totalCount} subtotal=${subtotal}`}
    </div>
  );
}

function LangToggle() {
  const { toggle } = useLanguage();
  return <button onClick={toggle}>toggle-lang</button>;
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>{children}</CartProvider>
    </LanguageProvider>
  );
}

let openSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  openSpy = vi.fn(() => null);
  window.open = openSpy as unknown as typeof window.open;
  // jsdom has no IntersectionObserver (used by the scroll-reveal hook in product cards).
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProductPurchasePanel: one-size product', () => {
  it('shows no size selector and lets the customer add straight away', () => {
    render(
      <Providers>
        <ProductPurchasePanel product={product} />
        <CartProbe />
      </Providers>
    );
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByTestId('product-price').textContent).toBe('RM 480');

    const add = screen.getByRole('button', { name: '+ Add to Cart' }) as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    fireEvent.click(add);
    expect(screen.getByTestId('probe').textContent).toContain('po:p1:none|-|480|1');
  });
});

describe('ProductPurchasePanel: product with sizes', () => {
  function setup() {
    render(
      <Providers>
        <LangToggle />
        <ProductPurchasePanel product={sizedProduct} />
        <CartProbe />
      </Providers>
    );
  }

  it('requires a size before adding or ordering', () => {
    setup();
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Please choose a size.');

    const add = screen.getByRole('button', { name: '+ Add to Cart' }) as HTMLButtonElement;
    const order = screen.getByRole('button', { name: 'Order via WhatsApp' }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    expect(order.disabled).toBe(true);

    fireEvent.click(add);
    fireEvent.click(order);
    expect(screen.getByTestId('probe').textContent).toContain('count=0');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('shows "From" until a size is chosen, then the size price', () => {
    setup();
    expect(screen.getByTestId('product-price').textContent).toBe('From RM 620');

    fireEvent.click(screen.getByRole('radio', { name: /Large/ }));
    expect(screen.getByTestId('product-price').textContent).toBe('RM 680');

    fireEvent.click(screen.getByRole('radio', { name: /Small/ }));
    expect(screen.getByTestId('product-price').textContent).toBe('RM 620');
  });

  it('adds the chosen size at its own price as a separate cart line', () => {
    setup();
    fireEvent.click(screen.getByRole('radio', { name: /Large/ }));
    fireEvent.click(screen.getByLabelText('Increase quantity')); // 2
    fireEvent.click(screen.getByRole('button', { name: '+ Add to Cart' }));
    fireEvent.click(screen.getByLabelText('Decrease quantity')); // back to 1
    fireEvent.click(screen.getByRole('radio', { name: /Small/ }));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to Cart' }));

    const probe = screen.getByTestId('probe').textContent ?? '';
    expect(probe).toContain('po:p4:size-l|Large|680|2');
    expect(probe).toContain('po:p4:size-s|Small|620|1');
    expect(probe).toContain('subtotal=1980');
  });

  it('sends the size in the WhatsApp message', () => {
    setup();
    fireEvent.click(screen.getByRole('radio', { name: /Large/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Order via WhatsApp' }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const text = new URL(openSpy.mock.calls[0][0] as string).searchParams.get('text') ?? '';
    expect(text).toContain('• Kembara Weekender (Size: Large) x1 — RM 680');
  });

  it('marks the chosen size as selected for assistive technology', () => {
    setup();
    const large = screen.getByRole('radio', { name: /Large/ });
    expect(large.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(large);
    expect(large.getAttribute('aria-checked')).toBe('true');
  });

  it('translates the size prompt', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-lang'));
    expect(screen.getByRole('status').textContent).toBe('Sila pilih saiz.');
    expect(screen.getByText('Saiz')).toBeTruthy();
  });
});

describe('PreorderCard', () => {
  it('offers quick add for one-size products only', () => {
    render(
      <Providers>
        <PreorderCard product={product} />
        <PreorderCard product={sizedProduct} />
      </Providers>
    );
    expect(screen.getAllByRole('button', { name: '+ Add to Cart' })).toHaveLength(1);
    expect(screen.getAllByText('View Product')).toHaveLength(2);
  });

  it('links to the product page and carries the Pre-Order badge', () => {
    const { container } = render(
      <Providers>
        <PreorderCard product={product} />
      </Providers>
    );
    const links = container.querySelectorAll('a[href^="/products/"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/products/p1');
    expect(container.querySelector('[data-variant="preorder"]')).not.toBeNull();
  });

  it('shows "From" pricing when sizes differ', () => {
    render(
      <Providers>
        <PreorderCard product={sizedProduct} />
      </Providers>
    );
    expect(screen.getByText('From RM 620')).toBeTruthy();
  });
});

describe('StatusBadge', () => {
  it('renders the solid green Ready Stock and outlined Pre-Order variants', () => {
    const { container } = render(
      <Providers>
        <StatusBadge variant="ready" />
        <StatusBadge variant="preorder" />
      </Providers>
    );
    const ready = container.querySelector('[data-variant="ready"]') as HTMLElement;
    const preorder = container.querySelector('[data-variant="preorder"]') as HTMLElement;
    expect(ready.textContent).toBe('Ready Stock');
    expect(ready.className).toContain('bg-ready');
    expect(preorder.textContent).toBe('Pre-Order');
    expect(preorder.className).toContain('border-ink');
    expect(preorder.className).not.toContain('bg-ready');
  });

  it('translates its label', () => {
    render(
      <Providers>
        <LangToggle />
        <StatusBadge variant="ready" />
        <StatusBadge variant="preorder" />
      </Providers>
    );
    fireEvent.click(screen.getByText('toggle-lang'));
    const badges = within(document.body);
    expect(badges.getByText('Stok Sedia Ada')).toBeTruthy();
    expect(badges.getByText('Pra-Tempah')).toBeTruthy();
  });
});
