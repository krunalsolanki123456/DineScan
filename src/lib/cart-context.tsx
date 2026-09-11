import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MenuItem, MenuItemAddon, CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (menuItem: MenuItem, addons?: MenuItemAddon[], specialInstructions?: string, quantity?: number) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  tableNumber: string | null;
  setTableNumber: (table: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  const addItem = (
    menuItem: MenuItem,
    addons: MenuItemAddon[] = [],
    specialInstructions = '',
    quantity = 1
  ) => {
    const unitPrice = Number(menuItem.discount_price ?? menuItem.price) + addons.reduce((s, a) => s + Number(a.price), 0);
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.menu_item.id === menuItem.id &&
          JSON.stringify(item.addons.map((a) => a.id).sort()) === JSON.stringify(addons.map((a) => a.id).sort()) &&
          item.special_instructions === specialInstructions
      );
      if (existingIdx >= 0) {
        const updated = prev.map((item, i) => i === existingIdx ? { ...item, quantity: item.quantity + quantity } : item);
        return updated;
      }
      return [...prev, { menu_item: menuItem, addons, special_instructions: specialInstructions, quantity, unit_price: unitPrice }];
    });
  };

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const updateQuantity = (index: number, delta: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => ({
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
  }), [items]);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems: totals.totalItems, totalAmount: totals.totalAmount,
      tableNumber, setTableNumber,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
