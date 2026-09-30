"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Heart, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { MobileCategoryDrawer } from "./MobileCategoryDrawer";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const cartCount = useCartStore((state) => state.getTotalItems());
  const hasCartHydrated = useCartStore((state) => state.hasHydrated);
  const favCount = useFavoritesStore((state) => state.getCount());
  const hasFavHydrated = useFavoritesStore((state) => state.hasHydrated);

  return (
    <>
      <nav
        aria-label="Navegación móvil inferior"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F0E8F2] py-1.5 px-4 md:hidden shadow-lg"
      >
        <div className="flex items-center justify-around">
          {/* Inicio */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              pathname === "/" ? "text-[#6D4BB8]" : "text-[#7A7590] hover:text-[#2E2A3B]"
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={pathname === "/" ? 2 : 1.6} />
            <span
              className={`text-[10px] mt-0.5 ${
                pathname === "/" ? "font-bold text-[#6D4BB8]" : "font-medium"
              }`}
            >
              Inicio
            </span>
          </Link>

          {/* Categorías (Drawer trigger) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 text-[#7A7590] hover:text-[#2E2A3B] transition-colors"
          >
            <Grid className="w-5 h-5" strokeWidth={1.6} />
            <span className="text-[10px] font-medium mt-0.5">Categorías</span>
          </button>

          {/* Favoritos */}
          <Link
            href="/favoritos"
            className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              pathname === "/favoritos" ? "text-[#6D4BB8]" : "text-[#7A7590] hover:text-[#2E2A3B]"
            }`}
          >
            <div className="relative">
              <Heart
                className="w-5 h-5"
                strokeWidth={pathname === "/favoritos" ? 2 : 1.6}
              />
              {hasFavHydrated && favCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#F472A8] text-white text-[9px] font-bold flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 ${
                pathname === "/favoritos" ? "font-bold text-[#6D4BB8]" : "font-medium"
              }`}
            >
              Favoritos
            </span>
          </Link>

          {/* Carrito */}
          <Link
            href="/carrito"
            className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              pathname === "/carrito" ? "text-[#6D4BB8]" : "text-[#7A7590] hover:text-[#2E2A3B]"
            }`}
          >
            <div className="relative">
              <ShoppingBag
                className="w-5 h-5"
                strokeWidth={pathname === "/carrito" ? 2 : 1.6}
              />
              {hasCartHydrated && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#F472A8] text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 ${
                pathname === "/carrito" ? "font-bold text-[#6D4BB8]" : "font-medium"
              }`}
            >
              Carrito
            </span>
          </Link>
        </div>
      </nav>

      {/* Drawer */}
      <MobileCategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
