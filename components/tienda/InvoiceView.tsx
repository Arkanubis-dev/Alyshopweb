"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Calendar,
  Phone,
  MapPin,
  User,
  Heart,
  Mail,
  CreditCard,
} from "lucide-react";
import { Order } from "@/types";
import { formatCOP } from "@/lib/utils";
import { Logo } from "./Logo";

interface InvoiceViewProps {
  order: Order;
  whatsappUrl: string;
}

export function InvoiceView({ order, whatsappUrl }: InvoiceViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusConfig = {
    pendiente: {
      label: "Pendiente por confirmar",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock,
    },
    confirmado: {
      label: "Pedido Confirmado",
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      icon: CheckCircle2,
    },
    enviado: {
      label: "En camino",
      bg: "bg-purple-50 text-purple-800 border-purple-200",
      icon: Truck,
    },
    entregado: {
      label: "Entregado",
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: Package,
    },
    cancelado: {
      label: "Cancelado",
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      icon: Clock,
    },
  }[order.status] || {
    label: order.status,
    bg: "bg-gray-50 text-gray-800 border-gray-200",
    icon: Clock,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top Banner (Hidden in print) */}
      <div className="print:hidden bg-gradient-to-r from-[#FCE4EF] via-[#EEEAFB] to-[#FFFBF7] rounded-3xl p-5 sm:p-6 border border-[#F0E8F2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6D4BB8] text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#2E2A3B]">
                ¡Pedido registrado con éxito!
              </h1>
              <p className="text-xs text-[#7A7590]">
                Tu pedido ha sido guardado con el código{" "}
                <strong className="text-[#6D4BB8]">{order.code}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#2E2A3B] border border-[#E8DFEC] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#6D4BB8]" />
              <span>Descargar / Imprimir PDF</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Abrir WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="p-3 bg-white/70 rounded-xl border border-white/60 text-xs text-[#7A7590]">
          💡 <strong>Nota:</strong> Si WhatsApp no se abrió automáticamente, pulsa el botón verde
          &quot;Abrir WhatsApp&quot; para enviar tu pedido a nuestro equipo.
        </div>
      </div>

      {/* ================================================================= */}
      {/* INVOICE / RESUMEN DE PEDIDO (Printable Container) */}
      {/* ================================================================= */}
      <div
        id="invoice-printable"
        className="bg-white rounded-3xl border border-[#F0E8F2] shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#F0E8F2]">
          <div className="space-y-2">
            <Logo size="md" />
            <p className="text-xs text-[#7A7590]">
              Tienda en línea • Bogotá, Colombia
            </p>
            <p className="text-xs text-[#7A7590]">
              WhatsApp de atención: +57 321 305 2913
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
              Resumen de Pedido
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#6D4BB8] tracking-tight">
              {order.code}
            </div>
            <div className="flex items-center gap-1 text-xs text-[#7A7590] sm:justify-end">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 sm:p-5 rounded-2xl bg-[#FFFBF7] border border-[#F0E8F2]">
          {/* Customer */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-[#6D4BB8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Datos del Cliente</span>
            </span>
            <p className="text-sm font-bold text-[#2E2A3B]">{order.customer_name}</p>
            <p className="text-[#7A7590] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#25D366]" />
              <span>{order.customer_phone}</span>
            </p>
            {order.customer_id_number && (
              <p className="text-[#7A7590] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#6D4BB8]" />
                <span>C.C. {order.customer_id_number}</span>
              </p>
            )}
            {order.customer_email && (
              <p className="text-[#7A7590] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#6D4BB8]" />
                <span className="truncate">{order.customer_email}</span>
              </p>
            )}
          </div>

          {/* Delivery */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-[#6D4BB8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Destino de Entrega</span>
            </span>
            <p className="text-sm font-bold text-[#2E2A3B]">
              {order.city} • Barrio {order.neighborhood}
            </p>
            <p className="text-[#7A7590]">{order.address}</p>
            <p className="text-[11px] text-[#6D4BB8] font-semibold">
              Modalidad: {order.delivery_method === "envio" ? "Envío a domicilio" : "Recoger en punto"}
            </p>
          </div>

          {order.notes && (
            <div className="sm:col-span-2 pt-2 border-t border-[#F0E8F2] text-xs">
              <span className="font-semibold text-[#7A7590]">Notas: </span>
              <span className="text-[#2E2A3B]">{order.notes}</span>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
            Productos solicitados
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#F0E8F2] text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                  <th className="py-2.5 pr-2">Producto</th>
                  <th className="py-2.5 px-2 text-center">Cant.</th>
                  <th className="py-2.5 px-2 text-right">Precio unitario</th>
                  <th className="py-2.5 pl-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5FC]">
                {(order.order_items || []).map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFFBF7]/50">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#FAF5FB] border border-[#F0E8F2] shrink-0 print:hidden">
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#2E2A3B]">{item.product_name}</p>
                          <p className="text-[11px] text-[#7A7590]">Ref: ALY-PROD</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-[#2E2A3B]">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-2 text-right text-[#7A7590]">
                      {formatCOP(item.unit_price)}
                    </td>
                    <td className="py-3 pl-2 text-right font-bold text-[#2E2A3B]">
                      {formatCOP(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-[#F0E8F2]">
          <div className="max-w-xs space-y-1 text-xs text-[#7A7590]">
            <p className="font-semibold text-[#2E2A3B]">Forma de pago acordada:</p>
            <p>Contraentrega o transferencia coordinada por WhatsApp con la dueña de la tienda.</p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-[#7A7590]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#2E2A3B]">{formatCOP(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#7A7590]">
              <span>Costo de envío:</span>
              <span className="font-semibold text-[#28795A]">
                {order.shipping_cost > 0 ? formatCOP(order.shipping_cost) : "Por confirmar"}
              </span>
            </div>
            <div className="pt-2 border-t border-[#F0E8F2] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#2E2A3B]">TOTAL:</span>
              <span className="text-xl font-extrabold text-[#6D4BB8]">
                {formatCOP(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Disclaimer */}
        <div className="pt-6 border-t border-[#F0E8F2] text-center space-y-1">
          <p className="text-xs font-semibold text-[#6D4BB8] flex items-center justify-center gap-1">
            <span>¡Gracias por tu compra en alyshop!</span>
            <Heart className="w-3.5 h-3.5 text-[#F472A8] fill-[#F472A8]" />
          </p>
          <p className="text-[11px] text-[#7A7590] leading-relaxed max-w-lg mx-auto">
            Este documento corresponde a un <strong>Resumen de Pedido</strong> para control,
            despacho y gestión interna de alyshop y no constituye una factura electrónica ante la DIAN.
          </p>
        </div>
      </div>

      {/* Return to store link (Hidden in print) */}
      <div className="print:hidden text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6D4BB8] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la tienda alyshop</span>
        </Link>
      </div>
    </div>
  );
}
