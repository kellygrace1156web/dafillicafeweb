import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Product } from '@/lib/supabase';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  tax_percentage: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  clearCart: () => void;
  getQuantity: (productId: string) => number;
  totalItems: number;
  subtotal: number;
  taxBreakdown: { rate: number; label: string; amount: number }[];
  totalTax: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
          tax_percentage: product.tax_percentage ?? 0,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const incrementItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (productId: string) => items.find((i) => i.id === productId)?.quantity ?? 0,
    [items]
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const { taxBreakdown, totalTax, total } = useMemo(() => {
    const groups: Record<string, { rate: number; amount: number }> = {};
    for (const item of items) {
      const rate = item.tax_percentage / 100;
      const key = String(rate);
      if (!groups[key]) groups[key] = { rate, amount: 0 };
      groups[key].amount += item.price * item.quantity * rate;
    }
    const breakdown = Object.values(groups).map((g) => ({
      rate: g.rate,
      label: `${(g.rate * 100).toFixed(0)}%`,
      amount: g.amount,
    }));
    const tTax = breakdown.reduce((s, b) => s + b.amount, 0);
    return { taxBreakdown: breakdown, totalTax: tTax, total: subtotal + tTax };
  }, [items, subtotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        incrementItem,
        decrementItem,
        clearCart,
        getQuantity,
        totalItems,
        subtotal,
        taxBreakdown,
        totalTax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
