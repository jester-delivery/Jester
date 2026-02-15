import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Produs minim necesar pentru afișare în coș
 * (se pot adăuga câmpuri după ce integrăm API-ul)
 */
export type CartProduct = {
  id: string;
  name: string;
  price: number | string;
  image?: string | null;
};

export type CartItem = {
  productId: string;
  quantity: number;
  product: CartProduct;
};

type CartState = {
  items: CartItem[];

  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

function parsePrice(price: number | string): number {
  if (typeof price === 'number') return price;
  const n = parseFloat(String(price));
  return isNaN(n) ? 0 : n;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: CartProduct, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          const newItems = existing
            ? state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            : [...state.items, { productId: product.id, quantity, product }];
          return { items: newItems };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemQuantity: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        return item ? item.quantity : 0;
      },

      getTotalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, i) => sum + parsePrice(i.product.price) * i.quantity,
          0
        );
      },
    }),
    {
      name: 'jester-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
