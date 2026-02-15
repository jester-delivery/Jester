import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Jester24CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  section: string;
  qty: number;
};

type Jester24CartState = {
  items: Jester24CartItem[];
  addItem: (item: Omit<Jester24CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
  getItem: (id: string) => Jester24CartItem | undefined;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useJester24CartStore = create<Jester24CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: 1 }] };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      inc: (id) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: i.qty + 1 } : i
          ),
        }));
      },

      dec: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item || item.qty <= 1) return state;
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, qty: i.qty - 1 } : i
            ),
          };
        });
      },

      clear: () => set({ items: [] }),

      getItem: (id) => get().items.find((i) => i.id === id),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.qty, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: "jester24-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
