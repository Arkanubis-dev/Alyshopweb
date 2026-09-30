"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Heart, ShoppingBag, ChevronDown, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { MobileCategoryDrawer } from "./MobileCategoryDrawer";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Zustand stores
  const cartItemsCount = useCartStore((state) => state.getTotalItems());
  const hasCartHydrated = useCartStore((state) => state.hasHydrated);
  const favoritesCount = useFavoritesStore((state) => state.getCount());
  const hasFavHydrated = useFavoritesStore((state) => state.hasHydrated);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFBF7]/95 backdrop-blur-md border-b border-[#F0E8F2] shadow-xs transition-all">
        {/* Main Header Container */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="lg:hidden p-2 text-[#6D4BB8] hover:bg-[#FCE4EF]/60 rounded-xl transition-colors"
                aria-label="Abrir menú de categorías"
              >
                <Menu className="w-6 h-6" strokeWidth={1.8} />
              </button>

              <Logo />
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4">
              <SearchBar />
            </div>

            {/* Right Action Icons (Icon on top, text below) */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
              {/* Mi Cuenta */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  onBlur={() => setTimeout(() => setIsAccountOpen(false), 200)}
                  className="flex flex-col items-center justify-center group py-1 px-2 rounded-xl hover:bg-[#FCE4EF]/40 transition-colors cursor-pointer"
                  aria-expanded={isAccountOpen}
                  aria-label="Mi cuenta"
                >
                  <div className="flex items-center text-[#6D4BB8] group-hover:text-[#F472A8] transition-colors">
                    <User className="w-5 h-5" strokeWidth={1.5} />
                    <ChevronDown className="w-3 h-3 -mr-1 ml-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium text-[#2E2A3B] group-hover:text-[#6D4BB8] transition-colors mt-0.5">
                    Mi cuenta
                  </span>
                </button>

                {/* Account dropdown */}
                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-[#F0E8F2] shadow-lg py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-[#FAF5FC]">
                      <p className="text-xs font-semibold text-[#2E2A3B]">Bienvenido a alyshop</p>
                      <p className="text-[11px] text-[#7A7590]">Acceso a panel</p>
                    </div>
                    <Link
                      href="/admin/login"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#2E2A3B] hover:bg-[#FCE4EF]/40 hover:text-[#6D4BB8] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#6D4BB8]" />
                      Iniciar sesión (Admin)
                    </Link>
                  </div>
                )}
              </div>

              {/* Favoritos */}
              <Link
                href="/favoritos"
                className="relative flex flex-col items-center justify-center group py-1 px-2 rounded-xl hover:bg-[#FCE4EF]/40 transition-colors"
                aria-label="Ver productos favoritos"
              >
                <div className="relative text-[#6D4BB8] group-hover:text-[#F472A8] transition-colors">
                  <Heart className="w-5 h-5" strokeWidth={1.5} />
                  {hasFavHydrated && favoritesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#F472A8] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {favoritesCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#2E2A3B] group-hover:text-[#6D4BB8] transition-colors mt-0.5">
                  Favoritos
                </span>
              </Link>

              {/* Carrito */}
              <Link
                href="/carrito"
                className="relative flex flex-col items-center justify-center group py-1 px-2 rounded-xl hover:bg-[#FCE4EF]/40 transition-colors"
                aria-label="Ver carrito de compras"
              >
                <div className="relative text-[#6D4BB8] group-hover:text-[#F472A8] transition-colors">
                  <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                  {hasCartHydrated && cartItemsCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#F472A8] text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-75">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#2E2A3B] group-hover:text-[#6D4BB8] transition-colors mt-0.5">
                  Carrito
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar Row */}
          <div className="pb-3 md:hidden">
            <SearchBar />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileCategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
