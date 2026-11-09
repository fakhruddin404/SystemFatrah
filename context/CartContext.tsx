'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Product, ProductSize } from '@/lib/products';
import type { ReadyStockItem } from '@/lib/ready-stock';
import {
  type CartLine,
  addLine,
  buildPreorderLine,
  buildReadyStockLine,
  removeLine,
  setLineQuantity,
  subtotalMyr,
  totalQuantity,
} from '@/lib/cart-lines';
import { formatMyr } from '@/lib/money';

interface AddPreorderOptions {
  size?: ProductSize | null;
  quantity?: number;
}

interface CartContextValue {
  items: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addPreorder: (product: Product, options?: AddPreorderOptions) => void;
  addReadyStock: (item: ReadyStockItem) => void;
  removeItem: (key: string) => void;
  /** Removes several lines at once (e.g. bags that sold while in the cart). */
  removeKeys: (keys: string[]) => void;
  updateQty: (key: string, qty: number) => void;
  hasItem: (key: string) => boolean;
  totalCount: number;
  subtotal: number;
  /** Subtotal formatted with two decimals, e.g. "RM 960.00". Excludes delivery. */
  totalPrice: string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addPreorder = useCallback((product: Product, options: AddPreorderOptions = {}) => {
    const line = buildPreorderLine(product, options.size ?? null, options.quantity ?? 1);
    setItems((prev) => addLine(prev, line));
    setIsOpen(true);
  }, []);

  const addReadyStock = useCallback((item: ReadyStockItem) => {
    const line = buildReadyStockLine(item);
    setItems((prev) => addLine(prev, line));
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => removeLine(prev, key));
  }, []);

  const removeKeys = useCallback((keys: string[]) => {
    setItems((prev) => prev.filter((l) => !keys.includes(l.key)));
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((prev) => setLineQuantity(prev, key, qty));
  }, []);

  const hasItem = useCallback((key: string) => items.some((l) => l.key === key), [items]);

  const totalCount = totalQuantity(items);
  const subtotal = subtotalMyr(items);
  const totalPrice = formatMyr(subtotal, { fixed: true });

  const value = useMemo(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addPreorder,
      addReadyStock,
      removeItem,
      removeKeys,
      updateQty,
      hasItem,
      totalCount,
      subtotal,
      totalPrice,
    }),
    [items, isOpen, openCart, closeCart, addPreorder, addReadyStock, removeItem, removeKeys, updateQty, hasItem, totalCount, subtotal, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
