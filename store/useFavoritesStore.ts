"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // Product IDs
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getCount: () => number;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),

      toggleFavorite: (productId: string) => {
        const { favorites } = get();
        if (favorites.includes(productId)) {
          set({ favorites: favorites.filter((id) => id !== productId) });
        } else {
          set({ favorites: [...favorites, productId] });
        }
      },

      isFavorite: (productId: string) => {
        return get().favorites.includes(productId);
      },

      getCount: () => {
        return get().favorites.length;
      },
    }),
    {
      name: "alyshop-favorites",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
