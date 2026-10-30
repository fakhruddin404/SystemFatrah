'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { toggle, t } = useLanguage();
  const { totalCount, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '#collection', key: 'navCollection' as const },
    { href: '/craft', key: 'navCraft' as const },
    { href: '#', key: 'navContact' as const },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F3EDE1]/90 backdrop-blur-md border-b border-line">
      <nav className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[84px] flex items-center justify-between">
        <a href="/" className="font-serif text-[26px] font-medium tracking-[0.5px]">FATRAH</a>

        <ul className="hidden lg:flex gap-10 text-sm font-medium">
          {links.map((l) => (
            <li key={l.key}>
              <a href={l.href} className="relative py-1 group">
                {t(l.key)}
                <span className="absolute left-0 bottom-[-2px] w-0 h-[1px] bg-maroon transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-[14px] lg:gap-5">
          {/* Cart button with live badge */}
          <button
            onClick={openCart}
            className="relative text-sm font-medium flex items-center gap-1.5 hover:text-maroon transition-colors"
            aria-label="Open cart"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            <span className="hidden sm:inline">
              {totalCount > 0 ? `(${totalCount})` : '(0)'}
            </span>
            {totalCount > 0 && (
              <span className="sm:hidden absolute -top-1.5 -right-1.5 bg-maroon text-warm-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {totalCount}
              </span>
            )}
          </button>

          <button className="border border-line px-3 py-1.5 text-xs font-semibold tracking-wide text-ink hover:border-maroon hover:text-maroon transition-colors" onClick={toggle}>EN / BM</button>

          <button
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="block w-6 h-[1.5px] bg-ink my-[5px]" />
            <span className="block w-6 h-[1.5px] bg-ink my-[5px]" />
            <span className="block w-6 h-[1.5px] bg-ink my-[5px]" />
          </button>
        </div>
      </nav>

      <div
        className={`lg:hidden absolute top-[84px] left-0 right-0 bg-warm-white border-line overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-[400px] border-b opacity-100' : 'max-h-0 border-b-0 opacity-0'}`}
      >
        <div className="px-6 py-6 pb-8">
          <ul className="flex flex-col gap-[18px] text-[15px] font-medium">
            {links.map((l) => (
              <li key={l.key}><a href={l.href}>{t(l.key)}</a></li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
