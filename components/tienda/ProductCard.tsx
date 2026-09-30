"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Check } from "lucide-react";
import { Product } from "@/types";
import { formatCOP } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const success = addItem(product, 1);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div className="group h-full flex flex-col justify-between bg-white rounded-[14px] border border-[#F0E8F2] shadow-xs hover:shadow-md hover:border-[#E4D5E8] transition-all duration-200 overflow-hidden relative">
      {/* Top Image Container (Square 1:1) */}
      <div className="relative aspect-square w-full bg-[#FAF5FB] overflow-hidden">
        {/* Product Image */}
        <Link href={`/producto/${product.slug}`} className="block w-full h-full">
          <div className="relative w-full h-full">
            <Image
              src={product.images[0]?.url || "/placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover rounded-t-[13px] group-hover:scale-105 transition-transform duration-300 ${
                isOutOfStock ? "grayscale opacity-70" : ""
              }`}
            />
          </div>
        </Link>

        {/* Favorite Heart Button (Top Right) */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#7A7590] hover:text-[#F472A8] shadow-xs transition-transform active:scale-90 hover:scale-110 z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite
                ? "text-[#F472A8] fill-[#F472A8]"
                : "text-[#7A7590] hover:text-[#F472A8]"
            }`}
            strokeWidth={1.75}
          />
        </button>

        {/* Stock Badges (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          {isOutOfStock && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#2E2A3B]/80 text-white uppercase tracking-wider backdrop-blur-xs">
              Agotado
            </span>
          )}
          {isLowStock && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#FFF1CC] text-[#9A6B0A] border border-[#FDE397] uppercase tracking-wider shadow-xs">
              Pocas unidades
            </span>
          )}
          {product.compare_price && product.compare_price > product.price && !isOutOfStock && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#FCE4EF] text-[#D94883] border border-[#F8C8E1] uppercase tracking-wider">
              Oferta
            </span>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Product Name */}
          <Link href={`/producto/${product.slug}`}>
            <h3 className="text-sm font-semibold text-[#2E2A3B] line-clamp-2 leading-snug group-hover:text-[#6D4BB8] transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Variant or short detail in small gray */}
          {product.detail && (
            <p className="text-[11px] text-[#7A7590] mt-0.5 truncate">
              {product.detail}
            </p>
          )}
        </div>

        {/* Price, Rating and Add to Cart Action */}
        <div className="pt-1 border-t border-[#FAF5FC] flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {/* Price with comparison */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-[17px] font-bold text-[#2E2A3B] tracking-tight">
                {formatCOP(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-[#7A7590]/70 line-through">
                  {formatCOP(product.compare_price)}
                </span>
              )}
            </div>

            {/* Rating stars & review count */}
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex items-center text-[#F5A623]">
                <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
              </div>
              <span className="text-[11px] font-medium text-[#2E2A3B]">
                {product.rating_avg.toFixed(1)}
              </span>
              <span className="text-[10px] text-[#7A7590]">
                ({product.rating_count})
              </span>
            </div>
          </div>

          {/* Rounded square pink button with cart icon in bottom-right corner */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={
              isOutOfStock
                ? "Producto agotado"
                : `Agregar ${product.name} al carrito`
            }
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-xs shrink-0 ${
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : justAdded
                ? "bg-[#6D4BB8] text-white scale-95"
                : "bg-[#FCE4EF] hover:bg-[#F472A8] text-[#F472A8] hover:text-white active:scale-90"
            }`}
            title={isOutOfStock ? "Agotado" : "Agregar al carrito"}
          >
            {justAdded ? (
              <Check className="w-4 h-4 animate-in zoom-in" strokeWidth={2.5} />
            ) : (
              <ShoppingBag className="w-4 h-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
