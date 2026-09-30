"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MessageCircle,
  Truck,
  MapPin,
  User,
  Phone,
  Building,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { checkoutSchema, CheckoutSchemaType } from "@/lib/validations/checkout";
import { createOrderAction } from "@/app/actions/order";
import { useCartStore } from "@/store/useCartStore";
import { formatCOP } from "@/lib/utils";

export function CheckoutView() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const subtotal = hasHydrated ? getSubtotal() : 0;
  const cartItems = hasHydrated ? items : [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutSchemaType>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      city: "Bogotá",
      neighborhood: "",
      address: "",
      indications: "",
      delivery_method: "envio",
      notes: "",
    },
  });

  const selectedDelivery = watch("delivery_method");

  const onSubmit = async (data: CheckoutSchemaType) => {
    if (cartItems.length === 0) {
      setServerError("Tu carrito está vacío. Agrega productos antes de continuar.");
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      const cartPayload = cartItems.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image_url: item.product.images[0]?.url,
      }));

      const result = await createOrderAction(data, cartPayload);

      if (!result.success) {
        setServerError(result.error || "No se pudo procesar el pedido. Por favor verifica tus datos.");
        setIsSubmitting(false);
        return;
      }

      // Limpiar carrito en el cliente
      clearCart();

      // Abrir WhatsApp en pestaña nueva
      if (result.whatsapp_url) {
        window.open(result.whatsapp_url, "_blank");
      }

      // Redirigir a la página de confirmación del pedido
      router.push(`/pedido/${result.order_code}?token=${result.public_token}`);
    } catch (err: any) {
      console.error("Error submitting checkout:", err);
      setServerError("Ocurrió un problema de conexión al registrar tu pedido. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  if (hasHydrated && cartItems.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#2E2A3B]">No hay productos en el carrito</h1>
        <p className="text-sm text-[#7A7590]">Agrega productos antes de completar tu pedido.</p>
        <Link
          href="/"
          className="inline-flex px-6 py-2.5 bg-[#F472A8] text-white text-sm font-bold rounded-xl shadow-xs"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7A7590]">
        <Link href="/" className="hover:text-[#6D4BB8] transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <Link href="/carrito" className="hover:text-[#6D4BB8] transition-colors">
          Carrito
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <span className="font-semibold text-[#6D4BB8]">Finalizar Pedido</span>
      </nav>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="text-xs sm:text-sm">
            <strong className="block font-bold">Atención:</strong>
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {/* Main Checkout Grid */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column (lg: 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-5 sm:p-8 space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#2E2A3B] tracking-tight">
                Datos de Entrega y Contacto
              </h1>
              <p className="text-xs sm:text-sm text-[#7A7590] mt-1">
                Completa tus datos para coordinar el despacho por WhatsApp. No cobramos en línea.
              </p>
            </div>

            {/* Personal Data */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8] flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>1. Información de contacto</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-1">
                  <label htmlFor="customer_name" className="text-xs font-semibold text-[#2E2A3B]">
                    Nombre y apellido completo *
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    {...register("customer_name")}
                    placeholder="Ej: Carolina Gómez"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8] focus:ring-2 focus:ring-[#FCE4EF]"
                  />
                  {errors.customer_name && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.customer_name.message}
                    </p>
                  )}
                </div>

                {/* Celular */}
                <div className="space-y-1">
                  <label htmlFor="customer_phone" className="text-xs font-semibold text-[#2E2A3B]">
                    Celular (WhatsApp de contacto) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-[#7A7590] font-semibold">
                      +57
                    </span>
                    <input
                      id="customer_phone"
                      type="tel"
                      maxLength={10}
                      {...register("customer_phone")}
                      placeholder="3001234567"
                      className="w-full text-xs sm:text-sm pl-11 pr-3 py-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8] focus:ring-2 focus:ring-[#FCE4EF]"
                    />
                  </div>
                  {errors.customer_phone && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.customer_phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="space-y-3 pt-4 border-t border-[#F0E8F2]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8] flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>2. Método de entrega</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    selectedDelivery === "envio"
                      ? "border-[#F472A8] bg-[#FCE4EF]/30"
                      : "border-[#F0E8F2] bg-[#FAF5FB] hover:border-[#D6C2E2]"
                  }`}
                >
                  <input
                    type="radio"
                    value="envio"
                    {...register("delivery_method")}
                    className="accent-[#F472A8] w-4 h-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#2E2A3B]">Envío a domicilio</p>
                    <p className="text-[11px] text-[#7A7590]">Directo a tu casa u oficina</p>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    selectedDelivery === "recoger"
                      ? "border-[#F472A8] bg-[#FCE4EF]/30"
                      : "border-[#F0E8F2] bg-[#FAF5FB] hover:border-[#D6C2E2]"
                  }`}
                >
                  <input
                    type="radio"
                    value="recoger"
                    {...register("delivery_method")}
                    className="accent-[#F472A8] w-4 h-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#2E2A3B]">Recoger personalmente</p>
                    <p className="text-[11px] text-[#7A7590]">En punto de entrega (Bogotá)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-4 pt-4 border-t border-[#F0E8F2]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>3. Dirección de entrega</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ciudad */}
                <div className="space-y-1">
                  <label htmlFor="city" className="text-xs font-semibold text-[#2E2A3B]">
                    Ciudad / Municipio *
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register("city")}
                    placeholder="Ej: Bogotá, Medellín, Cali..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                  {errors.city && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.city.message}</p>
                  )}
                </div>

                {/* Barrio */}
                <div className="space-y-1">
                  <label htmlFor="neighborhood" className="text-xs font-semibold text-[#2E2A3B]">
                    Barrio *
                  </label>
                  <input
                    id="neighborhood"
                    type="text"
                    {...register("neighborhood")}
                    placeholder="Ej: San Fernando, El Poblado..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                  {errors.neighborhood && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.neighborhood.message}
                    </p>
                  )}
                </div>

                {/* Dirección */}
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="address" className="text-xs font-semibold text-[#2E2A3B]">
                    Dirección exacta (calle, carrera, número) *
                  </label>
                  <input
                    id="address"
                    type="text"
                    {...register("address")}
                    placeholder="Ej: Calle 10 # 5-20"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                  {errors.address && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Indicaciones adicionales */}
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="indications" className="text-xs font-semibold text-[#2E2A3B]">
                    Indicaciones adicionales (Apto, torre, conjunto, color de fachada - opcional)
                  </label>
                  <input
                    id="indications"
                    type="text"
                    {...register("indications")}
                    placeholder="Ej: Apto 302 Torre B, conjunto Alameda"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                </div>

                {/* Notas */}
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="notes" className="text-xs font-semibold text-[#2E2A3B]">
                    Notas o comentarios para la tienda (opcional)
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    {...register("notes")}
                    placeholder="Horario preferido de entrega o detalles adicionales..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Column (lg: 5 cols) */}
          <div className="lg:col-span-5 space-y-5 sticky top-22">
            <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#2E2A3B] pb-3 border-b border-[#FAF5FC]">
                Resumen del pedido ({cartItems.length} {cartItems.length === 1 ? "ítem" : "ítems"})
              </h2>

              {/* Items List Snapshot */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-[#FAF5FC]">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF5FB] border border-[#F0E8F2] shrink-0">
                      <Image
                        src={item.product.images[0]?.url || "/placeholder.png"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#2E2A3B] truncate">{item.product.name}</p>
                      <p className="text-[11px] text-[#7A7590]">
                        Cantidad: {item.quantity} x {formatCOP(item.product.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#6D4BB8] shrink-0">
                      {formatCOP(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-3 border-t border-[#F0E8F2] text-xs sm:text-sm">
                <div className="flex items-center justify-between text-[#7A7590]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#2E2A3B]">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[#7A7590]">
                  <span>Envío:</span>
                  <span className="font-semibold text-[#28795A]">
                    {selectedDelivery === "recoger" ? "Gratis (Recoger)" : "Por confirmar"}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#F0E8F2] flex items-center justify-between">
                  <span className="text-sm font-bold text-[#2E2A3B]">TOTAL:</span>
                  <span className="text-xl font-extrabold text-[#6D4BB8]">{formatCOP(subtotal)}</span>
                </div>
              </div>

              {/* WhatsApp explanation */}
              <div className="p-3 bg-[#25D366]/10 rounded-2xl border border-[#25D366]/20 flex items-start gap-2.5">
                <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#2E2A3B] leading-relaxed">
                  Al pulsar el botón, tu pedido se guardará en nuestro sistema y se abrirá WhatsApp con el resumen listo para enviar al <strong>+57 321 305 2913</strong>.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando pedido...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>Enviar pedido por WhatsApp</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A7590] text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6D4BB8]" />
                <span>Tus datos se usan únicamente para gestionar tu entrega</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
