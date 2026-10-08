"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  Star,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/types";
import { formatCOP } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { ProductCard } from "./ProductCard";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
  whatsappNumber?: string;
}

export function ProductDetailView({
  product,
  relatedProducts,
  whatsappNumber = "573213052913",
}: ProductDetailViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const router = useRouter();

  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;
  const maxStock = Math.max(1, product.stock);

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const ok = addItem(product, quantity);
    if (ok) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    router.push("/checkout");
  };

  // Direct WhatsApp order link for this specific product
  const totalItemPrice = product.price * quantity;
  const whatsappMessage = encodeURIComponent(
    `Hola alyshop! 👋 Me interesa comprar el siguiente producto:\n\n` +
    `🛍️ *${product.name}*\n` +
    (product.detail ? `📌 Detalle: ${product.detail}\n` : "") +
    `🔢 Cantidad: ${quantity}\n` +
    `💰 Total: ${formatCOP(totalItemPrice)}\n\n` +
    `¿Tienen disponibilidad para envío?`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const currentImage = product.images[selectedImageIndex] || product.images[0];

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7A7590]">
        <Link href="/" className="hover:text-[#6D4BB8] transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <Link
          href={`/categoria/${product.category_id || "todos"}`}
          className="hover:text-[#6D4BB8] transition-colors"
        >
          {product.category_name || "Categorías"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <span className="font-semibold text-[#6D4BB8] truncate max-w-[250px]">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-5 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Column (lg: 6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Big View */}
            <div className="relative aspect-square w-full rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] overflow-hidden group">
              <Image
                src={currentImage?.url || "/placeholder.png"}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 550px"
                className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                  isOutOfStock ? "grayscale opacity-75" : ""
                }`}
              />

              {/* Favorite Heart Button */}
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#7A7590] hover:text-[#F472A8] shadow-sm transition-transform active:scale-90 hover:scale-110 z-10"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFavorite
                      ? "text-[#F472A8] fill-[#F472A8]"
                      : "text-[#7A7590] hover:text-[#F472A8]"
                  }`}
                  strokeWidth={1.8}
                />
              </button>

              {/* Stock badges overlay */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                {isOutOfStock && (
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-[#2E2A3B]/90 text-white uppercase tracking-wider backdrop-blur-xs shadow-xs">
                    Agotado
                  </span>
                )}
                {isLowStock && (
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FFF1CC] text-[#9A6B0A] border border-[#FDE397] uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Pocas unidades ({product.stock} restantes)
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails row (up to 5 images) */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {product.images.slice(0, 5).map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-18 h-18 rounded-xl overflow-hidden bg-[#FAF5FB] border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? "border-[#F472A8] ring-2 ring-[#FCE4EF]"
                        : "border-[#F0E8F2] hover:border-[#D6C2E2]"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} vista ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Purchase Column (lg: 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Category & Brand */}
              <div className="flex items-center gap-2 mb-2">
                {product.category_name && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EEEAFB] text-[#6D4BB8] text-xs font-semibold">
                    {product.category_name}
                  </span>
                )}
                {product.brand && (
                  <span className="text-xs text-[#7A7590]">
                    Marca: <span className="font-semibold text-[#2E2A3B]">{product.brand}</span>
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E2A3B] leading-tight tracking-tight">
                {product.name}
              </h1>

              {/* Variant / Detail */}
              {product.detail && (
                <p className="text-sm font-medium text-[#7A7590] mt-1">
                  Variante: <span className="text-[#2E2A3B] font-semibold">{product.detail}</span>
                </p>
              )}

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center text-[#F5A623]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating_avg)
                          ? "fill-[#F5A623] text-[#F5A623]"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#2E2A3B]">
                  {product.rating_avg.toFixed(1)}
                </span>
                <span className="text-xs text-[#7A7590]">
                  ({product.rating_count} valoraciones de clientes)
                </span>
              </div>
            </div>

            {/* Price section */}
            <div className="p-4 rounded-2xl bg-[#FFFBF7] border border-[#F0E8F2] flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2E2A3B] tracking-tight">
                {formatCOP(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-base text-[#7A7590] line-through">
                    {formatCOP(product.compare_price)}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FCE4EF] text-[#D94883] text-xs font-bold">
                    Ahorras {formatCOP(product.compare_price - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Stock indicator badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#7A7590] font-medium">Estado de stock:</span>
              {isOutOfStock ? (
                <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  Agotado temporalmente
                </span>
              ) : isLowStock ? (
                <span className="font-bold text-[#9A6B0A] bg-[#FFF1CC] px-2.5 py-1 rounded-lg border border-[#FDE397]">
                  ¡Pocas unidades! ({product.stock} disponibles)
                </span>
              ) : (
                <span className="font-bold text-[#28795A] bg-[#DDF3EC] px-2.5 py-1 rounded-lg border border-[#C5EBDF] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Disponible para envío inmediato ({product.stock} en bodega)
                </span>
              )}
            </div>

            {/* Quantity Selector + Actions */}
            {!isOutOfStock && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A7590]">
                    Cantidad:
                  </span>
                  <div className="inline-flex items-center border border-[#F0E8F2] rounded-xl bg-[#FAF5FB] p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      aria-label="Reducir cantidad"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2E2A3B] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-[#2E2A3B]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock}
                      aria-label="Aumentar cantidad"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2E2A3B] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-[#7A7590]">
                    Subtotal: <strong className="text-[#6D4BB8]">{formatCOP(totalItemPrice)}</strong>
                  </span>
                </div>

                {/* Primary CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Button 1: Agregar al Carrito */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95 ${
                      addedAnimation
                        ? "bg-[#6D4BB8] text-white"
                        : "bg-[#F472A8] hover:bg-[#E35E96] text-white"
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-5 h-5 animate-in zoom-in" strokeWidth={2.5} />
                        <span>¡Agregado al carrito!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" strokeWidth={1.8} />
                        <span>Agregar al carrito</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Comprar ahora y llenar datos de entrega */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>Comprar ahora (Pedir por WhatsApp)</span>
                  </button>
                </div>

                {/* Direct question consultation */}
                <div className="text-center pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#7A7590] hover:text-[#25D366] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>¿Tienes dudas antes de comprar? Chatea con una asesora</span>
                  </a>
                </div>
              </div>
            )}

            {/* Trust Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#F0E8F2]">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#EEEAFB]/60 text-xs">
                <Truck className="w-4 h-4 text-[#6D4BB8] shrink-0" strokeWidth={1.6} />
                <span className="text-[#2E2A3B] font-medium leading-tight">Envíos a todo el país</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#EEEAFB]/60 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#6D4BB8] shrink-0" strokeWidth={1.6} />
                <span className="text-[#2E2A3B] font-medium leading-tight">Compra 100% protegida</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#EEEAFB]/60 text-xs">
                <RotateCcw className="w-4 h-4 text-[#6D4BB8] shrink-0" strokeWidth={1.6} />
                <span className="text-[#2E2A3B] font-medium leading-tight">Garantía de calidad</span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-[#F0E8F2] space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6D4BB8]">
                Descripción del producto
              </h3>
              <p className="text-xs sm:text-sm text-[#2E2A3B] leading-relaxed whitespace-pre-line">
                {product.description || "Este artículo forma parte del catálogo seleccionado de alyshop para garantizarte la mejor calidad, durabilidad y satisfacción."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#F0E8F2]">
            <h2 className="text-lg sm:text-xl font-bold text-[#2E2A3B] tracking-tight">
              Productos relacionados
            </h2>
            <Link
              href={`/categoria/${product.category_id || "todos"}`}
              className="text-xs sm:text-sm font-semibold text-[#6D4BB8] hover:text-[#F472A8] transition-colors"
            >
              Ver más en esta categoría &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
            {relatedProducts.map((relProduct) => (
              <div key={relProduct.id} className="h-full">
                <ProductCard product={relProduct} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
