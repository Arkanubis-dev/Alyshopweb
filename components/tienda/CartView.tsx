"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatCOP } from "@/lib/utils";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const subtotal = hasHydrated ? getSubtotal() : 0;
  const cartItems = hasHydrated ? items : [];

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7A7590]">
        <Link href="/" className="hover:text-[#6D4BB8] transition-colors">
          Inicio
        </Link>
        <span className="text-[#7A7590]/50">&gt;</span>
        <span className="font-semibold text-[#6D4BB8]">Carrito de compras</span>
      </nav>

      {/* Cart Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#F0E8F2]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FCE4EF] flex items-center justify-center text-[#6D4BB8]">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2E2A3B] tracking-tight">
              Carrito de compras
            </h1>
            <p className="text-xs text-[#7A7590]">
              {cartItems.length} {cartItems.length === 1 ? "producto seleccionado" : "productos seleccionados"}
            </p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-[#7A7590] hover:text-red-500 font-medium transition-colors"
          >
            Vaciar carrito
          </button>
        )}
      </div>

      {/* Cart Layout or Empty State */}
      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List (lg: 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-4 sm:p-6 divide-y divide-[#F7F2F9]">
            {cartItems.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              const isMaxStock = item.quantity >= item.product.stock;

              return (
                <div
                  key={item.product.id}
                  className="py-4 sm:py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <Link
                      href={`/producto/${item.product.slug}`}
                      className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF5FB] border border-[#F0E8F2] shrink-0"
                    >
                      <Image
                        src={item.product.images[0]?.url || "/placeholder.png"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        href={`/producto/${item.product.slug}`}
                        className="text-sm font-bold text-[#2E2A3B] hover:text-[#6D4BB8] transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.detail && (
                        <p className="text-xs text-[#7A7590]">
                          Detalle: <span className="text-[#2E2A3B]">{item.product.detail}</span>
                        </p>
                      )}
                      <p className="text-xs font-semibold text-[#6D4BB8]">
                        {formatCOP(item.product.price)} c/u
                      </p>
                    </div>
                  </div>

                  {/* Right: Quantity, Line Subtotal, and Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    {/* Quantity controls */}
                    <div className="inline-flex items-center border border-[#F0E8F2] rounded-xl bg-[#FAF5FB] p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Reducir"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E2A3B] hover:bg-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-xs font-bold text-[#2E2A3B]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={isMaxStock}
                        aria-label="Aumentar"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E2A3B] hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right w-24">
                      <span className="text-sm font-bold text-[#2E2A3B]">
                        {formatCOP(itemTotal)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      aria-label="Eliminar producto"
                      className="p-1.5 text-[#7A7590] hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4BB8] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Seguir agregando productos</span>
              </Link>
            </div>
          </div>

          {/* Order Summary Card (lg: 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-6 space-y-5 sticky top-22">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#2E2A3B] pb-3 border-b border-[#FAF5FC]">
              Resumen de compra
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-[#7A7590]">
                <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} artículos):</span>
                <span className="font-semibold text-[#2E2A3B]">{formatCOP(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-[#7A7590]">
                <span>Costo de envío:</span>
                <span className="font-semibold text-[#28795A]">Por confirmar en el checkout</span>
              </div>

              <div className="pt-3 border-t border-[#F0E8F2] flex items-center justify-between">
                <span className="text-sm font-bold text-[#2E2A3B]">Total estimado:</span>
                <span className="text-xl font-extrabold text-[#6D4BB8]">{formatCOP(subtotal)}</span>
              </div>
            </div>

            {/* Note about WhatsApp order flow */}
            <div className="p-3 bg-[#EEEAFB]/60 rounded-2xl border border-[#E4DEF6] flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-[#6D4BB8] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#2E2A3B] leading-relaxed">
                No requerimos tarjeta de crédito ni pagos online. Completas tus datos y nos envías el pedido por WhatsApp con un solo clic.
              </p>
            </div>

            {/* Checkout Link Button */}
            <Link
              href="/checkout"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#F472A8] hover:bg-[#E35E96] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <span>Continuar con mi pedido</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Trust reminders */}
            <div className="space-y-2 pt-2 text-[11px] text-[#7A7590]">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#6D4BB8]" />
                <span>Envíos seguros a todo el país</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6D4BB8]" />
                <span>Atención personalizada y directa</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F0E8F2] p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FCE4EF] text-[#6D4BB8] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#2E2A3B]">
              Tu carrito está vacío
            </h3>
            <p className="text-xs sm:text-sm text-[#7A7590]">
              Aún no has añadido productos a tu carrito. ¡Revisa nuestras novedades y encuentra lo que necesitas!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorar catálogo</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
