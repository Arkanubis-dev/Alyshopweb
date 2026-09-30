"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Filter,
  Check,
  X,
  Edit2,
  FileText,
  User,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { formatCOP } from "@/lib/utils";
import {
  updateOrderStatusAction,
  updateOrderDetailsAction,
} from "@/app/actions/orders";

interface OrdersViewProps {
  initialOrders: Order[];
}

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const [orders, setProducts] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editingShippingCost, setEditingShippingCost] = useState<number>(0);
  const [editingInternalNotes, setEditingInternalNotes] = useState<string>("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "todos" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pendiente":
        return { label: "Pendiente", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock };
      case "confirmado":
        return { label: "Confirmado", bg: "bg-blue-50 text-blue-800 border-blue-200", icon: CheckCircle2 };
      case "enviado":
        return { label: "Enviado", bg: "bg-purple-50 text-purple-800 border-purple-200", icon: Truck };
      case "entregado":
        return { label: "Entregado", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: Package };
      case "cancelado":
        return { label: "Cancelado", bg: "bg-rose-50 text-rose-800 border-rose-200", icon: XCircle };
    }
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setEditingShippingCost(order.shipping_cost);
    setEditingInternalNotes(order.internal_notes || "");
  };

  const handleChangeStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      setIsUpdatingStatus(true);
      const res = await updateOrderStatusAction(selectedOrder.id, newStatus);
      if (res.success) {
        showToast(`Estado del pedido ${selectedOrder.code} actualizado a "${newStatus}"`);
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        setProducts((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
        );
      } else {
        showToast(res.error || "No se pudo actualizar el estado", "error");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder) return;
    try {
      setIsSavingDetails(true);
      const res = await updateOrderDetailsAction(
        selectedOrder.id,
        editingShippingCost,
        editingInternalNotes
      );
      if (res.success) {
        showToast("Detalles de envío y notas guardados");
        const nextTotal = selectedOrder.subtotal + editingShippingCost;
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                shipping_cost: editingShippingCost,
                total: nextTotal,
                internal_notes: editingInternalNotes,
              }
            : null
        );
        setProducts((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  shipping_cost: editingShippingCost,
                  total: nextTotal,
                  internal_notes: editingInternalNotes,
                }
              : o
          )
        );
      } else {
        showToast(res.error || "Error al guardar", "error");
      }
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Build WhatsApp template based on current order status
  const getCustomerWhatsAppUrl = (order: Order) => {
    let cleanPhone = order.customer_phone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("57") && cleanPhone.length === 10) {
      cleanPhone = `57${cleanPhone}`;
    }

    let message = "";
    switch (order.status) {
      case "pendiente":
        message =
          `Hola ${order.customer_name}! 👋 Te saludamos de *alyshop*.\n\n` +
          `Hemos recibido tu pedido *${order.code}* por un valor de *${formatCOP(order.total)}*.\n` +
          `¿Nos confirmas tu dirección para coordinar el despacho?`;
        break;
      case "confirmado":
        message =
          `Hola ${order.customer_name}! ✨ Tu pedido *${order.code}* ha sido *confirmado exitosamente* en alyshop.\n\n` +
          `Lo estamos empacando con mucho amor. Te avisaremos apenas vaya en camino. ¡Muchas gracias!`;
        break;
      case "enviado":
        message =
          `Hola ${order.customer_name}! 🚚 ¡Excelentes noticias! Tu pedido *${order.code}* ya va en camino hacia *${order.address}*.\n\n` +
          `Recuerda tener a mano el valor a pagar si elegiste contraentrega. ¡Que disfrutes tu compra!`;
        break;
      case "entregado":
        message =
          `Hola ${order.customer_name}! 🎉 Esperamos que ya tengas tus artículos en mano y te encanten.\n\n` +
          `Cualquier duda o comentario, estamos siempre a tu orden en alyshop. ¡Gracias por confiar en nosotros!`;
        break;
      case "cancelado":
        message =
          `Hola ${order.customer_name}. Te confirmamos que tu pedido *${order.code}* en alyshop ha sido cancelado.\n\n` +
          `Si tienes alguna pregunta, con gusto te atendemos por aquí.`;
        break;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom ${
            notification.type === "success"
              ? "bg-[#6D4BB8] text-white border-[#5837A3]"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {notification.type === "success" ? <Check className="w-4 h-4 text-[#F472A8]" /> : <X className="w-4 h-4" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F0E8F2]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2E2A3B] tracking-tight">
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590]">
            Controla pedidos recibidos por WhatsApp, cambia estados y comunícate directamente con tus clientes.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F0E8F2] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-sm">
          <Search className="w-4 h-4 text-[#7A7590] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ALY, cliente o celular..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-[#7A7590]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-[#2E2A3B] bg-[#FAF5FB] border border-[#F0E8F2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F472A8]"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
            <option value="enviado">Enviados</option>
            <option value="entregado">Entregados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FAF5FB] border-b border-[#F0E8F2] text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Ciudad / Destino</th>
                <th className="py-3 px-4">Total (COP)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2F9]">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const BadgeIcon = badge.icon;

                return (
                  <tr key={order.id} className="hover:bg-[#FFFBF7]/60 transition-colors">
                    {/* Código */}
                    <td className="py-3.5 px-4 font-extrabold text-[#6D4BB8]">
                      {order.code}
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2E2A3B]">{order.customer_name}</div>
                      <div className="text-[11px] text-[#7A7590]">{order.customer_phone}</div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 text-xs text-[#7A7590] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Ciudad */}
                    <td className="py-3.5 px-4 text-xs text-[#2E2A3B]">
                      {order.city} • <span className="text-[#7A7590]">{order.neighborhood}</span>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 font-bold text-[#2E2A3B]">
                      {formatCOP(order.total)}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>Ver Detalle</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-[#7A7590] space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-[#6D4BB8]/40" />
            <p className="text-sm font-semibold">No se encontraron pedidos con este filtro</p>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* DRAWER: DETALLE DEL PEDIDO */}
      {/* ================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#6D4BB8]">
                    Pedido {selectedOrder.code}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedOrder.status).bg}`}
                  >
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-[#7A7590]">
                  Registrado el{" "}
                  {new Date(selectedOrder.created_at).toLocaleString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#7A7590]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Quick WhatsApp Action with Customer */}
              <div className="p-4 bg-[#25D366]/10 rounded-2xl border border-[#25D366]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#2E2A3B]">Contactar cliente por WhatsApp</p>
                  <p className="text-[11px] text-[#7A7590]">
                    Mensaje pre-configurado para estado: <strong>{selectedOrder.status}</strong>
                  </p>
                </div>
                <a
                  href={getCustomerWhatsAppUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Enviar mensaje</span>
                </a>
              </div>

              {/* Status Change Selector (With automatic inventory discount on 'confirmado') */}
              <div className="p-4 bg-[#FAF5FB] rounded-2xl border border-[#F0E8F2] space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8] block">
                  Cambiar Estado del Pedido
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedOrder.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleChangeStatus(e.target.value as OrderStatus)}
                    className="flex-1 text-xs font-bold text-[#2E2A3B] bg-white border border-[#F0E8F2] p-2.5 rounded-xl cursor-pointer"
                  >
                    <option value="pendiente">Pendiente por confirmar</option>
                    <option value="confirmado">Confirmado (Descuenta stock en bodega)</option>
                    <option value="enviado">Enviado (En camino al cliente)</option>
                    <option value="entregado">Entregado con éxito</option>
                    <option value="cancelado">Cancelado (Reintegra stock a bodega)</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#7A7590]">
                  💡 <em>Regla de inventario:</em> Al marcar como &quot;confirmado&quot;, el sistema descuenta
                  automáticamente las existencias del catálogo.
                </p>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                  Datos del Cliente
                </h3>
                <div className="p-4 rounded-2xl bg-white border border-[#F0E8F2] space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#7A7590]" />
                    <span className="font-bold text-[#2E2A3B]">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#7A7590]" />
                    <span className="text-[#2E2A3B]">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7A7590]" />
                    <span className="text-[#2E2A3B]">
                      {selectedOrder.city} • Barrio {selectedOrder.neighborhood} • {selectedOrder.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-[#FAF5FC]">
                    <Truck className="w-4 h-4 text-[#6D4BB8]" />
                    <span className="text-[#6D4BB8] font-semibold">
                      Modalidad: {selectedOrder.delivery_method === "envio" ? "Envío a domicilio" : "Recoger en punto"}
                    </span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="text-[11px] text-[#7A7590] pt-1">
                      <strong>Comentarios:</strong> {selectedOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                  Productos del Pedido
                </h3>
                <div className="rounded-2xl border border-[#F0E8F2] overflow-hidden divide-y divide-[#F7F2F9]">
                  {(selectedOrder.order_items || []).map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#2E2A3B]">{item.product_name}</p>
                        <p className="text-[11px] text-[#7A7590]">
                          {item.quantity} x {formatCOP(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-[#6D4BB8]">
                        {formatCOP(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Cost & Internal Notes Edit */}
              <div className="space-y-4 p-4 rounded-2xl bg-[#FFFBF7] border border-[#F0E8F2]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E2A3B]">
                  Ajustes de Factura y Costo de Envío
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-[#7A7590]">Costo de Envío (COP)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingShippingCost}
                      onChange={(e) => setEditingShippingCost(Number(e.target.value) || 0)}
                      className="w-full mt-1 p-2 rounded-xl bg-white border border-[#F0E8F2] font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#7A7590]">Total Recalculado</label>
                    <div className="mt-1 p-2 rounded-xl bg-[#EEEAFB] text-[#6D4BB8] font-extrabold text-sm">
                      {formatCOP(selectedOrder.subtotal + editingShippingCost)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#7A7590]">Notas Internas (Solo staff)</label>
                  <textarea
                    rows={2}
                    value={editingInternalNotes}
                    onChange={(e) => setEditingInternalNotes(e.target.value)}
                    placeholder="Ej: Cliente solicitó entregar después de las 3pm..."
                    className="w-full p-2.5 rounded-xl bg-white border border-[#F0E8F2] text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSavingDetails}
                  onClick={handleSaveDetails}
                  className="w-full py-2 bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {isSavingDetails ? "Guardando..." : "Guardar Envío y Notas"}
                </button>
              </div>

              {/* View Public Invoice Button */}
              <div className="pt-2">
                <Link
                  href={`/pedido/${selectedOrder.code}?token=${selectedOrder.public_token}`}
                  target="_blank"
                  className="w-full py-3 rounded-xl bg-[#FCE4EF] hover:bg-[#F472A8] text-[#6D4BB8] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Factura Pública / Descargar PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
