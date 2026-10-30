import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import ProductActions from '@/components/ProductActions';
import CartDrawer from '@/components/CartDrawer';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { CartProvider, useCart } from '@/context/CartContext';
import type { Product } from '@/lib/products';

const NUMBER = '60132577325';

const product: Product = {
  id: 'p1',
  name: 'Batik Tote Indigo',
  descriptionEn: 'Indigo & rust wax-dye',
  descriptionMs: 'Celupan lilin indigo & karat',
  price: 'RM 480',
  bg: '',
  gridClass: '',
  aspectClass: '',
  imageUrl: 'https://images.unsplash.com/photo-1.jpg',
};

/** Test-only controls driving the real context APIs. */
function Controls() {
  const { toggle } = useLanguage();
  const { addItem } = useCart();
  return (
    <>
      <button onClick={toggle}>toggle-lang</button>
      <button onClick={() => addItem(product)}>add-product</button>
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

function parseOpened(openSpy: ReturnType<typeof vi.fn>) {
  expect(openSpy).toHaveBeenCalledTimes(1);
  const [href, target] = openSpy.mock.calls[0];
  const url = new URL(href as string);
  return { url, target, text: new URLSearchParams(url.search).get('text') ?? '' };
}

let openSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  openSpy = vi.fn();
  vi.stubGlobal('open', openSpy);
  window.open = openSpy as unknown as typeof window.open;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProductActions WhatsApp order', () => {
  function setup() {
    render(
      <Providers>
        <Controls />
        <ProductActions product={product} />
      </Providers>
    );
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    fireEvent.click(screen.getByLabelText('Increase quantity')); // qty = 3
  }

  it('English: targets configured number with product name and quantity', () => {
    setup();
    fireEvent.click(screen.getByText('Order via WhatsApp'));
    const { url, target, text } = parseOpened(openSpy);
    expect(url.origin + url.pathname).toBe(`https://wa.me/${NUMBER}`);
    expect(target).toBe('_blank');
    expect(text).toContain('Hello FATRAH! I would like to order:');
    expect(text).toContain('Batik Tote Indigo x3');
    expect(text).toContain('RM 480');
  });

  it('Malay: targets configured number with product name and quantity', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-lang'));
    fireEvent.click(screen.getByText('Pesan via WhatsApp'));
    const { url, text } = parseOpened(openSpy);
    expect(url.origin + url.pathname).toBe(`https://wa.me/${NUMBER}`);
    expect(text).toContain('Assalamualaikum FATRAH! Saya ingin memesan:');
    expect(text).toContain('Batik Tote Indigo x3');
    expect(text).toContain('Terima kasih!');
  });
});

describe('CartDrawer WhatsApp checkout', () => {
  function setup() {
    render(
      <Providers>
        <Controls />
        <CartDrawer />
      </Providers>
    );
  }

  it('English: targets configured number with product name and quantity', () => {
    setup();
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('add-product')); // qty = 2
    fireEvent.click(screen.getByText('Order via WhatsApp'));
    const { url, target, text } = parseOpened(openSpy);
    expect(url.origin + url.pathname).toBe(`https://wa.me/${NUMBER}`);
    expect(target).toBe('_blank');
    expect(text).toContain('Hello FATRAH! I would like to order:');
    expect(text).toContain('• Batik Tote Indigo x2 — RM 480');
    expect(text).toContain('Total: RM 960.00');
    expect(text).toContain('Please confirm my order. Thank you!');
  });

  it('Malay: targets configured number with product name and quantity', () => {
    setup();
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('add-product'));
    fireEvent.click(screen.getByText('toggle-lang'));
    fireEvent.click(screen.getByText('Pesan via WhatsApp'));
    const { url, text } = parseOpened(openSpy);
    expect(url.origin + url.pathname).toBe(`https://wa.me/${NUMBER}`);
    expect(text).toContain('Assalamualaikum FATRAH! Saya ingin memesan:');
    expect(text).toContain('• Batik Tote Indigo x2 — RM 480');
    expect(text).toContain('Jumlah: RM 960.00');
    expect(text).toContain('Mohon sahkan pesanan saya. Terima kasih!');
  });

  it('empty cart: no checkout control is rendered and no wa.me URL is opened', () => {
    setup();
    expect(screen.queryByText('Order via WhatsApp')).toBeNull();
    fireEvent.click(screen.getByText('toggle-lang'));
    expect(screen.queryByText('Pesan via WhatsApp')).toBeNull();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
