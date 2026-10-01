import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Product, ProductVariant } from '@/lib/supabase';

export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  variant_name?: string;
  price: number;
  image_url: string;
  quantity: number;
  tax_percentage: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant) => void;
  removeItem: (cartItemId: string) => void;
  incrementItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  clearCart: () => void;
  getQuantity: (productId: string, variantName?: string) => number;
  totalItems: number;
  subtotal: number;
  taxBreakdown: { rate: number; label: string; amount: number }[];
  totalTax: number;
  total: number;
};

export function getCartItemId(productId: string, variantName?: string) {
  return variantName ? `${productId}::${variantName}` : productId;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, variant?: ProductVariant) => {
    const variantName = variant?.name;
    const cartItemId = getCartItemId(product.id, variantName);
    const price = variant?.price ?? product.price;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product_id: product.id,
          name: product.name,
          variant_name: variantName,
          price,
          image_url: product.image_url,
          quantity: 1,
          tax_percentage: product.tax_percentage ?? 0,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const incrementItem = useCallback((cartItemId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }, []);

  const decrementItem = useCallback((cartItemId: string) => {
    setItems((prev) =>
      prev
        .map((item) => (item.id === cartItemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (productId: string, variantName?: string) => {
      if (variantName !== undefined) {
        return items.find((item) => item.id === getCartItemId(productId, variantName))?.quantity ?? 0;
      }
      return items
        .filter((item) => item.product_id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
    },
    [items]
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { taxBreakdown, totalTax, total } = useMemo(() => {
    const groups: Record<string, { rate: number; amount: number }> = {};
    for (const item of items) {
      const rate = item.tax_percentage / 100;
      const key = String(rate);
      if (!groups[key]) groups[key] = { rate, amount: 0 };
      groups[key].amount += item.price * item.quantity * rate;
    }
    const breakdown = Object.values(groups).map((group) => ({
      rate: group.rate,
      label: `${(group.rate * 100).toFixed(0)}%`,
      amount: group.amount,
    }));
    const totalTaxAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);
    return { taxBreakdown: breakdown, totalTax: totalTaxAmount, total: subtotal + totalTaxAmount };
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
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
