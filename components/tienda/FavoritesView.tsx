"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Heart, ChevronRight, ShoppingBag, ArrowLeft } from "lucide-react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface FavoritesViewProps {
  allProducts: Product[];
}

export function FavoritesView({ allProducts }: FavoritesViewProps) {
  const favorites = useFavoritesStore((state) => state.favorites);
  const hasFavHydrated = useFavoritesStore((state) => state.hasHydrated);
  const addItem = useCartStore((state) => state.addItem);

  // Filter products that are in the user's favorites list
  const favoritedProducts = useMemo(() => {
    if (!hasFavHydrated) return [];
    return allProducts.filter((product) => favorites.includes(product.id));
  }, [allProducts, favorites, hasFavHydrated]);

  const handleAddAllToCart = () => {
    favoritedProducts.forEach((product) => {
      if (product.stock > 0) {
        addItem(product, 1);
      }
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7A7590]">
        <Link href="/" className="hover:text-[#6D4BB8] transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <span className="font-semibold text-[#6D4BB8]">Mis Favoritos</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FCE4EF] text-[#F472A8] flex items-center justify-center shadow-xs">
            <Heart className="w-6 h-6 fill-[#F472A8]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2E2A3B] tracking-tight">
              Mis Productos Favoritos
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7590]">
              {favoritedProducts.length === 1
                ? "1 artículo guardado para después"
                : `${favoritedProducts.length} artículos guardados para después`}
            </p>
          </div>
        </div>

        {favoritedProducts.length > 0 && (
          <button
            type="button"
            onClick={handleAddAllToCart}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Agregar todos al carrito</span>
          </button>
        )}
      </div>

      {/* Products Grid or Empty State */}
      {favoritedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {favoritedProducts.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F0E8F2] p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FCE4EF] text-[#F472A8] flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#2E2A3B]">
              Aún no tienes favoritos guardados
            </h3>
            <p className="text-xs sm:text-sm text-[#7A7590]">
              Haz clic en el corazón de cualquier producto para guardarlo aquí y comprarlo cuando quieras.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorar la tienda</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
