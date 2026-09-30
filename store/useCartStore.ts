"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((item) => item.product.id === product.id);

        if (existingIndex > -1) {
          const currentQty = items[existingIndex].quantity;
          const newQty = currentQty + quantity;

          // Check stock limit
          if (newQty > product.stock) {
            return false;
          }

          const updated = [...items];
          updated[existingIndex].quantity = newQty;
          set({ items: updated });
          return true;
        } else {
          if (quantity > product.stock) {
            return false;
          }
          set({ items: [...items, { product, quantity }] });
          return true;
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const items = get().items.map((item) => {
          if (item.product.id === productId) {
            const safeQty = Math.min(quantity, item.product.stock);
            return { ...item, quantity: safeQty };
          }
          return item;
        });

        set({ items });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "alyshop-cart",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
