"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatCOP } from "@/lib/utils";

export function MiniCartCard() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const subtotal = hasHydrated ? getSubtotal() : 0;
  const cartItems = hasHydrated ? items : [];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#F0E8F2] shadow-xs p-4 space-y-3.5">
      {/* Card Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#FAF5FC]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FCE4EF] flex items-center justify-center text-[#6D4BB8]">
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.8} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E2A3B]">
            Tu Carrito
          </h3>
        </div>
        {cartItems.length > 0 && (
          <span className="text-xs text-[#7A7590] font-medium">
            {cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"}
          </span>
        )}
      </div>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-center mx-auto text-[#7A7590]/50">
            <ShoppingBag className="w-6 h-6" strokeWidth={1.4} />
          </div>
          <p className="text-xs text-[#7A7590] font-medium">
            No hay productos en el carrito
          </p>
          <p className="text-[11px] text-[#7A7590]/80">
            ¡Agrega tus artículos favoritos para empezar!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* List of items (max 3 visible in mini cart) */}
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1 divide-y divide-[#FAF5FC]">
            {cartItems.slice(0, 3).map((item) => (
              <div
                key={item.product.id}
                className="pt-2 first:pt-0 flex items-center gap-2.5 group"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#FCE4EF]/30 shrink-0 border border-[#F0E8F2]">
                  <Image
                    src={item.product.images[0]?.url || "/placeholder.png"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#2E2A3B] truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[11px] text-[#7A7590]">
                    {item.quantity} x {formatCOP(item.product.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.product.id)}
                  aria-label={`Eliminar ${item.product.name}`}
                  className="text-[#7A7590]/40 hover:text-red-500 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {cartItems.length > 3 && (
            <p className="text-[11px] text-center text-[#7A7590]">
              + {cartItems.length - 3} producto(s) más
            </p>
          )}

          {/* Subtotal */}
          <div className="pt-2 border-t border-[#F0E8F2] flex items-center justify-between">
            <span className="text-xs text-[#7A7590] font-medium">Subtotal:</span>
            <span className="text-sm font-bold text-[#6D4BB8]">
              {formatCOP(subtotal)}
            </span>
          </div>
        </div>
      )}

      {/* Wide Pink Button "Ver carrito" */}
      <Link
        href="/carrito"
        className="w-full py-2.5 px-4 bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs"
      >
        <span>Ver carrito</span>
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
      </Link>
    </div>
  );
}
