"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AdminPagination, PageSizeOption } from "./AdminPagination";
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
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  Minus,
  Eye,
  Mail,
  CreditCard,
  Archive,
  Split,
  ArrowUpRight,
  ArrowDownLeft,
  Undo2,
} from "lucide-react";
import { Order, OrderStatus, Product } from "@/types";
import { formatCOP } from "@/lib/utils";
import {
  updateOrderStatusAction,
  updateOrderDetailsAction,
  updateFullOrderAction,
  deleteOrderAction,
  createManualOrderAction,
  splitOrderAction,
  revertItemTransferAction,
} from "@/app/actions/orders";
import { ProductSearchCombobox } from "./ProductSearchCombobox";

interface OrdersViewProps {
  initialOrders: Order[];
  products?: Product[];
}

interface EditableItem {
  id?: string;
  product_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal?: number;
  image_url?: string;
  transferred_to_code?: string;
  transferred_from_code?: string;
}

export function OrdersView({ initialOrders, products = [] }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editingShippingCost, setEditingShippingCost] = useState<number>(0);
  const [editingInternalNotes, setEditingInternalNotes] = useState<string>("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Full Order Edit Modal State (CRUD)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerEmail, setEditCustomerEmail] = useState("");
  const [editCustomerIdNumber, setEditCustomerIdNumber] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDeliveryMethod, setEditDeliveryMethod] = useState<"envio" | "recoger">("envio");
  const [editNotes, setEditNotes] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [editStatus, setEditStatus] = useState<OrderStatus>("pendiente");
  const [editShippingCost, setEditShippingCost] = useState<number>(0);
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [selectedProdToAdd, setSelectedProdToAdd] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Order Confirmation Modal State (CRUD)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Create Manual Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createCustomerPhone, setCreateCustomerPhone] = useState("");
  const [createCustomerEmail, setCreateCustomerEmail] = useState("");
  const [createCustomerIdNumber, setCreateCustomerIdNumber] = useState("");
  const [createCity, setCreateCity] = useState("Bogotá");
  const [createNeighborhood, setCreateNeighborhood] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createDeliveryMethod, setCreateDeliveryMethod] = useState<"envio" | "recoger">("envio");
  const [createNotes, setCreateNotes] = useState("");
  const [createInternalNotes, setCreateInternalNotes] = useState("");
  const [createStatus, setCreateStatus] = useState<OrderStatus>("confirmado");
  const [createShippingCost, setCreateShippingCost] = useState<number>(0);
  const [createItems, setCreateItems] = useState<EditableItem[]>([]);
  const [createSelectedProdToAdd, setCreateSelectedProdToAdd] = useState<string>("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Split / Transference Order Modal State
  const [splitModalOrder, setSplitModalOrder] = useState<Order | null>(null);
  const [splitSelections, setSplitSelections] = useState<{ [itemId: string]: number }>({});
  const [splitShippingCost, setSplitShippingCost] = useState<number>(0);
  const [splitIsAlreadyPaid, setSplitIsAlreadyPaid] = useState<boolean>(false);
  const [splitNotes, setSplitNotes] = useState<string>("");
  const [isSplitting, setIsSplitting] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // Navegar inmediatamente a una orden transferida o padre
  const handleJumpToOrder = (targetCode: string) => {
    const found = orders.find((o) => o.code === targetCode || o.id === targetCode);
    if (found) {
      if (editingOrder) {
        handleOpenEdit(found);
      } else {
        handleOpenDetail(found);
      }
      showToast(`Visualizando pedido ${found.code}`);
    } else {
      setSearch(targetCode);
      showToast(`Filtrando lista por ${targetCode}`);
    }
  };

  const handleOpenSplitModal = (order: Order, preselectedItemId?: string) => {
    setSplitModalOrder(order);
    const initialSel: { [itemId: string]: number } = {};
    (order.order_items || []).forEach((item) => {
      if (!item.transferred_to_code) {
        if (preselectedItemId && (item.id === preselectedItemId || item.product_id === preselectedItemId)) {
          initialSel[item.id] = item.quantity;
        }
      }
    });
    setSplitSelections(initialSel);
    setSplitShippingCost(0);
    setSplitIsAlreadyPaid(false);
    setSplitNotes("");
  };

  const handleConfirmSplitOrder = async () => {
    if (!splitModalOrder) return;
    const itemsToTransfer = Object.entries(splitSelections)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantityToTransfer]) => ({ itemId, quantityToTransfer }));

    if (itemsToTransfer.length === 0) {
      showToast("Debes seleccionar al menos un producto para transferir", "error");
      return;
    }

    try {
      setIsSplitting(true);
      const res = await splitOrderAction({
        originalOrderId: splitModalOrder.id,
        itemsToTransfer,
        newOrderShippingCost: Number(splitShippingCost) || 0,
        isAlreadyPaid: splitIsAlreadyPaid,
        newOrderNotes: splitNotes,
      });

      if (res.success && res.originalOrder && res.newOrder) {
        showToast(`¡Listo! Se creó el pedido ${res.newOrder.code} con los productos transferidos.`);
        const updatedOrig = res.originalOrder;
        const createdChild = res.newOrder;

        setOrders((prev) => {
          const map = new Map<string, Order>();
          map.set(createdChild.id, createdChild);
          prev.forEach((o) => {
            map.set(o.id, o.id === updatedOrig.id ? updatedOrig : o);
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        if (selectedOrder && selectedOrder.id === updatedOrig.id) {
          setSelectedOrder(updatedOrig);
        }
        if (editingOrder && editingOrder.id === updatedOrig.id) {
          handleOpenEdit(updatedOrig);
        }
        setSplitModalOrder(null);
      } else {
        showToast(res.error || "Error al transferir productos", "error");
      }
    } catch {
      showToast("Error inesperado al dividir el pedido", "error");
    } finally {
      setIsSplitting(false);
    }
  };

  const handleRevertTransfer = async (orderId: string, itemId: string) => {
    try {
      const res = await revertItemTransferAction(orderId, itemId);
      if (res.success && res.order) {
        showToast("Transferencia cancelada. El producto vuelve a estar activo en este pedido.");
        const updated = res.order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        if (selectedOrder && selectedOrder.id === updated.id) {
          setSelectedOrder(updated);
        }
        if (editingOrder && editingOrder.id === updated.id) {
          handleOpenEdit(updated);
        }
      } else {
        showToast(res.error || "No se pudo deshacer la transferencia", "error");
      }
    } catch {
      showToast("Error inesperado al deshacer transferencia", "error");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "todos" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
        (o.customer_id_number && o.customer_id_number.includes(q)) ||
        o.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const paginatedOrders = useMemo(() => {
    if (pageSize === "all") return filteredOrders;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredOrders.slice(start, start + (pageSize as number));
  }, [filteredOrders, currentPage, pageSize]);

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
      case "ajuste_anterior":
        return {
          label: "Ajuste Anterior (Histórico)",
          bg: "bg-amber-100/90 text-amber-950 border-amber-300",
          icon: Archive,
        };
    }
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setEditingShippingCost(order.shipping_cost);
    setEditingInternalNotes(order.internal_notes || "");
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setEditCustomerName(order.customer_name);
    setEditCustomerPhone(order.customer_phone);
    setEditCustomerEmail(order.customer_email || "");
    setEditCustomerIdNumber(order.customer_id_number || "");
    setEditCity(order.city);
    setEditNeighborhood(order.neighborhood);
    setEditAddress(order.address);
    setEditDeliveryMethod(order.delivery_method || "envio");
    setEditNotes(order.notes || "");
    setEditInternalNotes(order.internal_notes || "");
    setEditStatus(order.status);
    setEditShippingCost(order.shipping_cost);
    setEditItems(
      (order.order_items || []).map((i) => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.subtotal,
        image_url: i.image_url,
        transferred_to_code: i.transferred_to_code,
        transferred_from_code: i.transferred_from_code,
      }))
    );
    setSelectedProdToAdd("");
  };

  // Item adjustments in Edit Modal
  const handleItemQtyChange = (index: number, delta: number) => {
    setEditItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: item.unit_price * newQty };
      })
    );
  };

  const handleItemRemove = (index: number) => {
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddItemFromCatalog = (customProd?: Product) => {
    const prod = customProd || products.find((p) => p.id === selectedProdToAdd);
    if (!prod) return;

    // Check if already in items
    const existingIndex = editItems.findIndex((i) => i.product_id === prod.id);
    if (existingIndex >= 0) {
      handleItemQtyChange(existingIndex, 1);
    } else {
      const primaryUrl = prod.images?.[0]?.url || "";
      setEditItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}`,
          product_id: prod.id,
          product_name: prod.name,
          unit_price: prod.price,
          quantity: 1,
          subtotal: prod.price,
          image_url: primaryUrl,
        },
      ]);
    }
    setSelectedProdToAdd("");
  };

  // Live calculations for Edit Modal (solo productos activos suman al subtotal)
  const editSubtotal = editItems
    .filter((i) => !i.transferred_to_code)
    .reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const editTotal = editSubtotal + (Number(editShippingCost) || 0);

  const handleSaveOrderEdit = async () => {
    if (!editingOrder) return;
    if (!editCustomerName.trim() || !editCustomerPhone.trim()) {
      showToast("Nombre y celular del cliente son requeridos", "error");
      return;
    }
    if (editItems.length === 0) {
      showToast("El pedido debe tener al menos un producto", "error");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await updateFullOrderAction(editingOrder.id, {
        customer_name: editCustomerName.trim(),
        customer_phone: editCustomerPhone.trim(),
        customer_email: editCustomerEmail.trim() || undefined,
        customer_id_number: editCustomerIdNumber.trim() || undefined,
        city: editCity.trim(),
        neighborhood: editNeighborhood.trim(),
        address: editAddress.trim(),
        delivery_method: editDeliveryMethod,
        notes: editNotes.trim(),
        internal_notes: editInternalNotes.trim(),
        status: editStatus,
        shipping_cost: Number(editShippingCost) || 0,
        parent_order_code: editingOrder.parent_order_code,
        order_items: editItems.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          subtotal: item.unit_price * item.quantity,
          image_url: item.image_url,
          transferred_to_code: item.transferred_to_code,
          transferred_from_code: item.transferred_from_code,
        })),
      });

      if (res.success && res.order) {
        showToast(`Pedido ${editingOrder.code} actualizado correctamente`);
        const updated = res.order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        if (selectedOrder && selectedOrder.id === updated.id) {
          setSelectedOrder(updated);
          setEditingShippingCost(updated.shipping_cost);
          setEditingInternalNotes(updated.internal_notes || "");
        }
        setEditingOrder(null);
      } else {
        showToast(res.error || "Error al actualizar el pedido", "error");
      }
    } catch {
      showToast("Error inesperado al guardar el pedido", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      setIsDeletingOrder(true);
      const res = await deleteOrderAction(orderToDelete.id);
      if (res.success) {
        showToast(`Pedido ${orderToDelete.code} eliminado correctamente`);
        setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
        if (selectedOrder?.id === orderToDelete.id) {
          setSelectedOrder(null);
        }
        setOrderToDelete(null);
      } else {
        showToast(res.error || "Error al eliminar el pedido", "error");
      }
    } catch {
      showToast("Error inesperado al eliminar el pedido", "error");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Manual Order Creation Handlers
  const handleOpenCreateOrder = () => {
    setCreateCustomerName("");
    setCreateCustomerPhone("");
    setCreateCity("Bogotá");
    setCreateNeighborhood("");
    setCreateAddress("");
    setCreateDeliveryMethod("envio");
    setCreateNotes("");
    setCreateInternalNotes("Pedido manual registrado desde panel administrativo");
    setCreateStatus("confirmado");
    setCreateShippingCost(0);
    setCreateItems([]);
    setCreateSelectedProdToAdd("");
    setIsCreateModalOpen(true);
  };

  const handleCreateQtyChange = (index: number, delta: number) => {
    setCreateItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: item.unit_price * newQty };
      })
    );
  };

  const handleCreateItemRemove = (index: number) => {
    setCreateItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateAddItemFromCatalog = (customProd?: Product) => {
    const prod = customProd || products.find((p) => p.id === createSelectedProdToAdd);
    if (!prod) return;

    const existingIndex = createItems.findIndex((i) => i.product_id === prod.id);
    if (existingIndex >= 0) {
      handleCreateQtyChange(existingIndex, 1);
    } else {
      const primaryUrl = prod.images?.[0]?.url || "";
      setCreateItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}`,
          product_id: prod.id,
          product_name: prod.name,
          unit_price: prod.price,
          quantity: 1,
          subtotal: prod.price,
          image_url: primaryUrl,
        },
      ]);
    }
    setCreateSelectedProdToAdd("");
  };

  const createSubtotal = createItems.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const createTotal = createSubtotal + (Number(createShippingCost) || 0);

  const handleSaveCreateOrder = async () => {
    if (!createCustomerName.trim() || !createCustomerPhone.trim()) {
      showToast("El nombre y el celular del cliente son requeridos", "error");
      return;
    }
    if (createItems.length === 0) {
      showToast("Debes agregar al menos un producto al pedido", "error");
      return;
    }

    try {
      setIsCreatingOrder(true);
      const res = await createManualOrderAction({
        customer_name: createCustomerName.trim(),
        customer_phone: createCustomerPhone.trim(),
        customer_email: createCustomerEmail.trim() || undefined,
        customer_id_number: createCustomerIdNumber.trim() || undefined,
        city: createCity.trim() || "Bogotá",
        neighborhood: createNeighborhood.trim(),
        address:
          createAddress.trim() ||
          (createDeliveryMethod === "recoger" ? "Recogida en punto físico / Bogotá" : "Por coordinar"),
        delivery_method: createDeliveryMethod,
        notes: createNotes.trim(),
        internal_notes: createInternalNotes.trim(),
        status: createStatus,
        shipping_cost: Number(createShippingCost) || 0,
        items: createItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          subtotal: item.unit_price * item.quantity,
          image_url: item.image_url,
        })),
      });

      if (res.success && res.order) {
        showToast(`¡Pedido ${res.order.code} creado exitosamente!`);
        const newOrder = res.order;
        setOrders((prev) => [newOrder, ...prev]);
        setIsCreateModalOpen(false);
        handleOpenDetail(newOrder);
      } else {
        showToast(res.error || "Error al crear el pedido", "error");
      }
    } catch {
      showToast("Error inesperado al crear el pedido", "error");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleChangeStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      setIsUpdatingStatus(true);
      const res = await updateOrderStatusAction(selectedOrder.id, newStatus);
      if (res.success) {
        showToast(`Estado del pedido ${selectedOrder.code} actualizado a "${newStatus}"`);
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        setOrders((prev) =>
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
        setOrders((prev) =>
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
      case "ajuste_anterior":
        message =
          `Hola ${order.customer_name}! 📋 Tu pedido *${order.code}* en alyshop ha sido registrado en nuestro sistema como ajuste de pedido anterior.\n\n` +
          `¡Muchas gracias por tu preferencia!`;
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
            Gestión y CRUD de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590]">
            Administra, ajusta datos del cliente, modifica o elimina productos solicitados y crea pedidos manuales.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-[#6D4BB8]">
            Total pedidos: <strong>{orders.length}</strong>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Crear Pedido Manual</span>
          </button>
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
            <option value="ajuste_anterior">Ajuste de pedido anterior (Histórico)</option>
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
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2F9]">
              {paginatedOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const BadgeIcon = badge.icon;

                return (
                  <tr key={order.id} className="hover:bg-[#FFFBF7]/60 transition-colors">
                    {/* Código */}
                    <td className="py-3.5 px-4 font-extrabold text-[#6D4BB8] whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm">{order.code}</span>
                        {order.parent_order_code && (
                          <button
                            type="button"
                            onClick={() => handleJumpToOrder(order.parent_order_code!)}
                            title={`Ver pedido origen ${order.parent_order_code}`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FCE4EF] hover:bg-[#F472A8] text-[#C02670] hover:text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                            <span>De {order.parent_order_code}</span>
                          </button>
                        )}
                        {(() => {
                          const childCodes = Array.from(
                            new Set(
                              (order.order_items || [])
                                .map((i) => i.transferred_to_code)
                                .filter(Boolean) as string[]
                            )
                          );
                          if (childCodes.length === 0) return null;
                          return childCodes.map((cc) => (
                            <button
                              key={cc}
                              type="button"
                              onClick={() => handleJumpToOrder(cc)}
                              title={`Ver pedido derivado ${cc}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#EEEAFB] hover:bg-[#6D4BB8] text-[#6D4BB8] hover:text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              <span>A {cc}</span>
                            </button>
                          ));
                        })()}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2E2A3B]">{order.customer_name}</div>
                      <div className="text-[11px] text-[#7A7590] flex items-center gap-1.5 flex-wrap">
                        <span>{order.customer_phone}</span>
                        {order.customer_id_number && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FAF5FC] text-[#6D4BB8] font-medium text-[10px]">
                            C.C. {order.customer_id_number}
                          </span>
                        )}
                      </div>
                      {order.customer_email && (
                        <div className="text-[11px] text-[#6D4BB8] truncate max-w-[180px]">{order.customer_email}</div>
                      )}
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
                    <td className="py-3.5 px-4 font-bold text-[#2E2A3B] whitespace-nowrap">
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

                    {/* Acciones CRUD */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(order)}
                          title="Ver Detalle y Factura"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Detalle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(order)}
                          title="Editar Pedido / Cambiar productos o datos"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F0E8F2] hover:bg-[#E5D7EB] text-[#6D4BB8] text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          title="Eliminar Pedido"
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

        {/* Pagination Controls */}
        <AdminPagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="pedidos"
        />
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrder;
                    handleOpenEdit(ord);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F0E8F2] hover:bg-[#E5D7EB] text-[#6D4BB8] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full hover:bg-gray-100 text-[#7A7590]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

              {/* Status Change Selector */}
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
                    <option value="ajuste_anterior">Ajuste de pedido anterior (Histórico - No modifica stock)</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#7A7590]">
                  💡 <em>Regla de inventario:</em> &quot;Confirmado&quot; descuenta existencias; &quot;Ajuste de pedido anterior&quot;
                  registra histórico ya facturado sin descontar ni reintegrar existencias.
                </p>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                    Datos del Cliente
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedOrder)}
                    className="text-[11px] font-bold text-[#F472A8] hover:underline cursor-pointer"
                  >
                    Editar datos
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#F0E8F2] space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#7A7590]" />
                    <span className="font-bold text-[#2E2A3B]">{selectedOrder.customer_name}</span>
                  </div>
                  {selectedOrder.customer_id_number && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#7A7590]" />
                      <span className="text-[#2E2A3B]">Cédula: <strong>{selectedOrder.customer_id_number}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#7A7590]" />
                    <span className="text-[#2E2A3B]">{selectedOrder.customer_phone}</span>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#7A7590]" />
                      <span className="text-[#2E2A3B]">{selectedOrder.customer_email}</span>
                    </div>
                  )}
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

              {/* Transference status banners */}
              {selectedOrder.parent_order_code && (
                <div className="p-3.5 bg-[#FCE4EF]/80 border border-[#F6B8D6] rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-[#C02670] shrink-0" />
                    <span className="text-[#2E2A3B]">
                      Entrega complementaria de <strong className="text-[#C02670]">{selectedOrder.parent_order_code}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToOrder(selectedOrder.parent_order_code!)}
                    className="px-2.5 py-1 rounded-xl bg-white text-[#C02670] hover:bg-[#F472A8] hover:text-white font-bold text-xs border border-[#F6B8D6] transition-colors cursor-pointer shrink-0"
                  >
                    Ver origen
                  </button>
                </div>
              )}

              {(() => {
                const childCodes = Array.from(
                  new Set(
                    (selectedOrder.order_items || [])
                      .map((i) => i.transferred_to_code)
                      .filter(Boolean) as string[]
                  )
                );
                if (childCodes.length === 0) return null;
                return (
                  <div className="p-3.5 bg-[#EEEAFB] border border-[#D5CAFA] rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-[#6D4BB8] shrink-0" />
                      <span className="text-[#2E2A3B]">
                        Tiene pendientes transferidos a:{" "}
                        <strong className="text-[#6D4BB8]">{childCodes.join(", ")}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {childCodes.map((cc) => (
                        <button
                          key={cc}
                          type="button"
                          onClick={() => handleJumpToOrder(cc)}
                          className="px-2.5 py-1 rounded-xl bg-white text-[#6D4BB8] hover:bg-[#6D4BB8] hover:text-white font-bold text-xs border border-[#D5CAFA] transition-colors cursor-pointer"
                        >
                          Ir a {cc}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                    Productos del Pedido
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenSplitModal(selectedOrder)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6D4BB8] hover:text-[#5837A3] hover:underline cursor-pointer"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Despacho Parcial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedOrder)}
                      className="text-[11px] font-bold text-[#F472A8] hover:underline cursor-pointer"
                    >
                      Ajustar productos
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#F0E8F2] overflow-hidden divide-y divide-[#F7F2F9]">
                  {(selectedOrder.order_items || []).map((item) => {
                    const isTransferred = Boolean(item.transferred_to_code);
                    const isReceived = Boolean(item.transferred_from_code);

                    if (isTransferred) {
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-xs bg-[#FAF5FB]/80 border-l-4 border-l-[#6D4BB8]"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#7A7590] line-through">{item.product_name}</p>
                              <button
                                type="button"
                                onClick={() => handleJumpToOrder(item.transferred_to_code!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEEAFB] hover:bg-[#6D4BB8] text-[#6D4BB8] hover:text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Transferido a {item.transferred_to_code}</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-[#7A7590] line-through opacity-70">
                              {item.quantity} x {formatCOP(item.unit_price)} • (No suma al cobro actual)
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#7A7590] line-through opacity-70">
                              {formatCOP(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isReceived) {
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-xs bg-[#FFFBF7] border-l-4 border-l-[#F472A8]"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#2E2A3B]">{item.product_name}</p>
                              <button
                                type="button"
                                onClick={() => handleJumpToOrder(item.transferred_from_code!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCE4EF] hover:bg-[#F472A8] text-[#C02670] hover:text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>De {item.transferred_from_code}</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-[#7A7590]">
                              {item.quantity} x {formatCOP(item.unit_price)}
                            </p>
                          </div>
                          <span className="font-bold text-[#6D4BB8]">
                            {formatCOP(item.subtotal)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF5FB]/50 transition-colors">
                        <div>
                          <p className="font-bold text-[#2E2A3B]">{item.product_name}</p>
                          <p className="text-[11px] text-[#7A7590]">
                            {item.quantity} x {formatCOP(item.unit_price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#6D4BB8]">
                            {formatCOP(item.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenSplitModal(selectedOrder, item.id)}
                            title="Transferir este producto a un nuevo pedido pendiente"
                            className="p-1.5 rounded-lg hover:bg-[#EEEAFB] text-[#6D4BB8] transition-colors cursor-pointer"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  className="w-full py-2 bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingDetails && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingDetails ? "Guardando..." : "Guardar Envío y Notas"}</span>
                </button>
              </div>

              {/* View Public Invoice Button */}
              <div className="pt-2 space-y-2">
                <Link
                  href={`/pedido/${selectedOrder.code}?token=${selectedOrder.public_token}`}
                  target="_blank"
                  className="w-full py-3 rounded-xl bg-[#FCE4EF] hover:bg-[#F472A8] text-[#6D4BB8] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Factura Pública / Descargar PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Pedido Definitivamente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: EDITAR PEDIDO COMPLETO (CRUD) */}
      {/* ================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isSavingEdit && setEditingOrder(null)}
          />

          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-center text-[#6D4BB8]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                    Editar Pedido {editingOrder.code}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#7A7590]">
                    Modifica datos de entrega o ajusta los productos si el cliente cambió de opinión.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingOrder(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#7A7590] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              {/* Sección 1: Datos del Cliente y Envío */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px]">
                  1. Datos del Cliente y Destino
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      placeholder="Ej: 300 123 4567"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Cédula / Documento de Identidad
                    </label>
                    <input
                      type="text"
                      value={editCustomerIdNumber}
                      onChange={(e) => setEditCustomerIdNumber(e.target.value)}
                      placeholder="Ej: 1020789456"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editCustomerEmail}
                      onChange={(e) => setEditCustomerEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Ej: Bogotá"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Barrio *
                    </label>
                    <input
                      type="text"
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      placeholder="Ej: Cedritos"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Dirección exacta *
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Ej: Calle 140 # 12-34 Torre 2 Apto 501"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Modalidad de Entrega
                    </label>
                    <select
                      value={editDeliveryMethod}
                      onChange={(e) => setEditDeliveryMethod(e.target.value as "envio" | "recoger")}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    >
                      <option value="envio">Envío a domicilio</option>
                      <option value="recoger">Recoger en tienda / bodega</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Estado del Pedido
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="enviado">Enviado</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="ajuste_anterior">Ajuste de pedido anterior (Histórico - No modifica stock)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Productos del Pedido */}
              <div className="space-y-3 pt-4 border-t border-[#F0E8F2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px]">
                      2. Productos Solicitados ({editItems.length})
                    </h3>
                    <p className="text-[11px] text-[#7A7590]">
                      Ajusta la cantidad, elimina artículos descartados o transfiere productos pendientes a otro despacho.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenSplitModal(editingOrder)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEEAFB] hover:bg-[#6D4BB8] hover:text-white text-[#6D4BB8] text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Despacho Parcial / Transferir Pendientes</span>
                  </button>
                </div>

                {/* Selector para agregar producto desde catálogo con buscador y orden A-Z */}
                {products.length > 0 && (
                  <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#6D4BB8] uppercase tracking-wider">
                        Buscar o agregar producto al pedido (A-Z)
                      </span>
                      <span className="text-[10px] text-[#7A7590]">
                        {products.length} disponibles
                      </span>
                    </div>
                    <ProductSearchCombobox
                      products={products}
                      onSelectProduct={(p) => handleAddItemFromCatalog(p)}
                      placeholder="🔍 Escribe para buscar producto (ej: gorro, skala, óleo, champú)..."
                    />
                  </div>
                )}

                {/* Lista de productos en edición */}
                <div className="rounded-2xl border border-[#F0E8F2] divide-y divide-[#F7F2F9] overflow-hidden bg-white">
                  {editItems.map((item, index) => {
                    const isTransferred = Boolean(item.transferred_to_code);
                    const isReceived = Boolean(item.transferred_from_code);

                    if (isTransferred) {
                      return (
                        <div
                          key={item.id || index}
                          className="p-3 flex items-center justify-between gap-3 bg-[#FAF5FB]/80 border-l-4 border-l-[#6D4BB8]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-10 h-10 rounded-xl object-cover border border-[#F0E8F2] opacity-40 grayscale shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#7A7590] truncate line-through">
                                {item.product_name}
                              </p>
                              <p className="text-[11px] text-[#7A7590] line-through opacity-70">
                                {item.quantity} x {formatCOP(item.unit_price)} • (Transferido, no suma a esta factura)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleJumpToOrder(item.transferred_to_code!)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Ir a {item.transferred_to_code}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => item.id && handleRevertTransfer(editingOrder.id, item.id)}
                              title="Deshacer transferencia y volver a activar este producto en este pedido"
                              className="px-2.5 py-1.5 rounded-xl border border-[#F0E8F2] hover:bg-white text-[11px] font-bold text-[#7A7590] transition-colors cursor-pointer"
                            >
                              Deshacer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleItemRemove(index)}
                              title="Quitar producto"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id || index} className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF5FB]/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#F0E8F2] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-center text-[#6D4BB8] shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#2E2A3B] truncate">{item.product_name}</p>
                              {isReceived && (
                                <button
                                  type="button"
                                  onClick={() => handleJumpToOrder(item.transferred_from_code!)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FCE4EF] hover:bg-[#F472A8] text-[#C02670] hover:text-white text-[10px] font-bold cursor-pointer"
                                >
                                  <ArrowDownLeft className="w-2.5 h-2.5" />
                                  <span>De {item.transferred_from_code}</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-[#7A7590]">
                              Precio unitario: {formatCOP(item.unit_price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-1 bg-[#FAF5FB] rounded-xl border border-[#F0E8F2] p-1">
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(index, -1)}
                              disabled={item.quantity <= 1}
                              className="w-6 h-6 rounded-lg bg-white border border-[#F0E8F2] hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center text-[#2E2A3B] cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-extrabold text-[#2E2A3B] text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(index, 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-[#F0E8F2] hover:bg-gray-100 flex items-center justify-center text-[#2E2A3B] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Subtotal del ítem */}
                          <span className="font-extrabold text-[#6D4BB8] text-xs w-24 text-right">
                            {formatCOP(item.unit_price * item.quantity)}
                          </span>

                          {/* Botón transferir individual */}
                          <button
                            type="button"
                            onClick={() => handleOpenSplitModal(editingOrder, item.id)}
                            title="Transferir este producto a nuevo pedido pendiente"
                            className="p-1.5 rounded-lg text-[#6D4BB8] hover:bg-[#EEEAFB] transition-colors cursor-pointer"
                          >
                            <Split className="w-4 h-4" />
                          </button>

                          {/* Botón eliminar ítem */}
                          <button
                            type="button"
                            onClick={() => handleItemRemove(index)}
                            title="Quitar producto del pedido"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {editItems.length === 0 && (
                    <div className="p-6 text-center text-[#7A7590]">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      <p className="font-semibold text-xs text-rose-500">
                        No hay productos en este pedido. Debes agregar al menos uno.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 3: Costo de Envío, Notas y Resumen Financiero */}
              <div className="space-y-4 pt-4 border-t border-[#F0E8F2]">
                <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px]">
                  3. Envío, Notas y Totales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Costo de Envío (COP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editShippingCost}
                      onChange={(e) => setEditShippingCost(Number(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-extrabold text-[#2E2A3B] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas del Cliente
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Instrucciones adicionales del cliente"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas Internas del Equipo Alyshop
                    </label>
                    <textarea
                      rows={2}
                      value={editInternalNotes}
                      onChange={(e) => setEditInternalNotes(e.target.value)}
                      placeholder="Anotaciones privadas para seguimiento interno del despacho..."
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>
                </div>

                {/* Recuadro de Totales Recalculados */}
                <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#7A7590]">
                    <span>
                      Subtotal activos ({editItems.filter((i) => !i.transferred_to_code).reduce((a, b) => a + b.quantity, 0)} unidades):
                    </span>
                    <span className="font-bold text-[#2E2A3B]">{formatCOP(editSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#7A7590]">
                    <span>Costo de envío:</span>
                    <span className="font-bold text-[#2E2A3B]">{formatCOP(Number(editShippingCost) || 0)}</span>
                  </div>
                  {editItems.some((i) => i.transferred_to_code) && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium">
                      ℹ️ Los productos transferidos aparecen tachados y no suman al total de esta orden (se cobrarán en su orden respectiva).
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-[#F0E8F2]">
                    <span className="text-[#2E2A3B]">Total a Cobrar:</span>
                    <span className="text-[#6D4BB8] text-base">{formatCOP(editTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[#F0E8F2] bg-[#FAF5FB] flex items-center justify-end gap-3 sticky bottom-0 z-20">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveOrderEdit}
                className="px-6 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar Cambios del Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE PEDIDO (CRUD) */}
      {/* ================================================================= */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isDeletingOrder && setOrderToDelete(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#2E2A3B]">
                ¿Eliminar pedido {orderToDelete.code}?
              </h3>
              <p className="text-xs text-[#7A7590] leading-relaxed">
                Estás a punto de eliminar de forma permanente el pedido de{" "}
                <strong className="text-[#2E2A3B]">{orderToDelete.customer_name}</strong> por valor de{" "}
                <strong className="text-[#6D4BB8]">{formatCOP(orderToDelete.total)}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="p-3 bg-[#FAF5FB] rounded-xl border border-[#F0E8F2] text-xs text-[#7A7590]">
              <p>Código: <strong className="text-[#2E2A3B]">{orderToDelete.code}</strong></p>
              <p>Fecha: {new Date(orderToDelete.created_at).toLocaleDateString("es-CO")}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREAR NUEVO PEDIDO MANUAL */}
      {/* ================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isCreatingOrder && setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-gradient-to-r from-[#FAF5FB] to-white sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#6D4BB8]/10 text-[#6D4BB8] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#6D4BB8]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                    Crear Nuevo Pedido Manual
                  </h2>
                  <p className="text-xs text-[#7A7590]">
                    Registra pedidos de WhatsApp, teléfono, presencial o redes con cálculo automático.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isCreatingOrder}
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7A7590] hover:text-[#2E2A3B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Sección 1: Información del Cliente y Entrega */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Datos del Cliente y Despacho</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={createCustomerName}
                      onChange={(e) => setCreateCustomerName(e.target.value)}
                      placeholder="Ej: Laura Sofía Martínez"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs font-semibold focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Celular / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={createCustomerPhone}
                      onChange={(e) => setCreateCustomerPhone(e.target.value)}
                      placeholder="Ej: 3001234567"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs font-semibold focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Cédula / Documento de Identidad
                    </label>
                    <input
                      type="text"
                      value={createCustomerIdNumber}
                      onChange={(e) => setCreateCustomerIdNumber(e.target.value)}
                      placeholder="Ej: 1020789456 (Identifica clientes nuevos)"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs font-semibold focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Correo Electrónico (Para publicidad)
                    </label>
                    <input
                      type="email"
                      value={createCustomerEmail}
                      onChange={(e) => setCreateCustomerEmail(e.target.value)}
                      placeholder="Ej: cliente@correo.com"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs font-semibold focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={createCity}
                      onChange={(e) => setCreateCity(e.target.value)}
                      placeholder="Bogotá"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Barrio / Sector
                    </label>
                    <input
                      type="text"
                      value={createNeighborhood}
                      onChange={(e) => setCreateNeighborhood(e.target.value)}
                      placeholder="Ej: Chapinero, Usaquén, Suba..."
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Dirección de Entrega
                    </label>
                    <input
                      type="text"
                      value={createAddress}
                      onChange={(e) => setCreateAddress(e.target.value)}
                      placeholder={createDeliveryMethod === "recoger" ? "Recogida presencial en tienda" : "Ej: Calle 140 # 11-45 Apto 302"}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Método de Entrega
                    </label>
                    <select
                      value={createDeliveryMethod}
                      onChange={(e) => setCreateDeliveryMethod(e.target.value as "envio" | "recoger")}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs font-semibold focus:outline-none focus:border-[#F472A8]"
                    >
                      <option value="envio">Envío a Domicilio</option>
                      <option value="recoger">Recoger en Tienda / Punto Físico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Estado Inicial
                    </label>
                    <select
                      value={createStatus}
                      onChange={(e) => setCreateStatus(e.target.value as OrderStatus)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs font-semibold focus:outline-none focus:border-[#F472A8]"
                    >
                      <option value="confirmado">Confirmado (Descuenta Stock)</option>
                      <option value="ajuste_anterior">Ajuste de pedido anterior (Histórico - No descuenta stock)</option>
                      <option value="pendiente">Pendiente de Pago</option>
                      <option value="enviado">Enviado</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  {createStatus === "ajuste_anterior" && (
                    <div className="sm:col-span-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold">Modo: Ajuste de Pedido Anterior (Histórico)</p>
                        <p className="text-[11px] text-amber-800/90 leading-relaxed mt-0.5">
                          Ideal para subir ventas ya facturadas con anterioridad. <strong>No creará ni descontará existencias del inventario</strong>, y te permite agregar productos aunque figuren con 0 unidades disponibles sin alterar el stock de tu tienda.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 2: Productos del Pedido */}
              <div className="space-y-3 pt-4 border-t border-[#F0E8F2]">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>2. Productos del Catálogo ({createItems.length})</span>
                  </h3>
                </div>

                {/* Selector interactivo con buscador alfabético y similitud */}
                <div className="p-3 bg-[#FAF5FB] rounded-2xl border border-[#F0E8F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#6D4BB8] uppercase tracking-wider">
                      Buscar o agregar producto del catálogo (Orden A-Z)
                    </span>
                    <span className="text-[10px] text-[#7A7590]">
                      {products.length} productos en catálogo
                    </span>
                  </div>
                  <ProductSearchCombobox
                    products={products}
                    onSelectProduct={(p) => handleCreateAddItemFromCatalog(p)}
                    placeholder="🔍 Escribe para buscar producto (ej: gorro, skala, óleo, champú)..."
                  />
                </div>

                {/* Lista de productos agregados */}
                <div className="border border-[#F0E8F2] rounded-2xl overflow-hidden divide-y divide-[#F0E8F2]">
                  {createItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-[#FAF5FB] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#F0E8F2] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-center text-[#7A7590] shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#2E2A3B] truncate">
                            {item.product_name}
                          </p>
                          <p className="text-[11px] text-[#7A7590]">
                            {formatCOP(item.unit_price)} c/u
                          </p>
                        </div>
                      </div>

                      {/* Controles de Cantidad */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#FAF5FB] border border-[#F0E8F2] rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleCreateQtyChange(idx, -1)}
                            className="px-2 py-1 hover:bg-[#F0E8F2] text-[#2E2A3B] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-extrabold text-[#2E2A3B] min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCreateQtyChange(idx, 1)}
                            className="px-2 py-1 hover:bg-[#F0E8F2] text-[#2E2A3B] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-xs text-[#6D4BB8] min-w-[80px] text-right">
                          {formatCOP(item.unit_price * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCreateItemRemove(idx)}
                          title="Eliminar producto"
                          className="w-8 h-8 rounded-xl hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {createItems.length === 0 && (
                    <div className="p-6 text-center text-[#7A7590]">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      <p className="font-semibold text-xs text-rose-500">
                        No has seleccionado productos. Elige un producto arriba y haz clic en &quot;Agregar&quot;.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 3: Envío, Notas y Resumen Financiero */}
              <div className="space-y-4 pt-4 border-t border-[#F0E8F2]">
                <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>3. Envío, Notas y Totales</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Costo de Envío (COP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={createShippingCost}
                      onChange={(e) => setCreateShippingCost(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-extrabold text-[#2E2A3B] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas del Cliente
                    </label>
                    <input
                      type="text"
                      value={createNotes}
                      onChange={(e) => setCreateNotes(e.target.value)}
                      placeholder="Ej: Tocar timbre 302, dejar en portería"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas Internas Administrativas
                    </label>
                    <textarea
                      rows={2}
                      value={createInternalNotes}
                      onChange={(e) => setCreateInternalNotes(e.target.value)}
                      placeholder="Ej: Tomado por WhatsApp por la administradora. Pago por Nequi verificado."
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>
                </div>

                {/* Recuadro de Totales */}
                <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#7A7590]">
                    <span>Subtotal de productos ({createItems.reduce((a, b) => a + b.quantity, 0)} artículos):</span>
                    <span className="font-bold text-[#2E2A3B]">{formatCOP(createSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#7A7590]">
                    <span>Costo de envío:</span>
                    <span className="font-bold text-[#2E2A3B]">{formatCOP(Number(createShippingCost) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-[#F0E8F2]">
                    <span className="text-[#2E2A3B]">Total a Cobrar:</span>
                    <span className="text-[#6D4BB8] text-base">{formatCOP(createTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[#F0E8F2] bg-[#FAF5FB] flex items-center justify-end gap-3 sticky bottom-0 z-20">
              <button
                type="button"
                disabled={isCreatingOrder}
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isCreatingOrder || createItems.length === 0 || !createCustomerName.trim()}
                onClick={handleSaveCreateOrder}
                className="px-6 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando pedido...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Crear Pedido y Generar ALY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: DESPACHO PARCIAL / TRANSFERIR PRODUCTOS PENDIENTES */}
      {/* ================================================================= */}
      {splitModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isSplitting && setSplitModalOrder(null)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEEAFB] border border-[#D5CAFA] flex items-center justify-center text-[#6D4BB8]">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                    Despacho Parcial • Pedido {splitModalOrder.code}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#7A7590]">
                    Cliente: <strong>{splitModalOrder.customer_name}</strong> • Transfiere productos a una nueva orden pendiente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSplitting}
                onClick={() => setSplitModalOrder(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#7A7590] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto text-xs">
              {/* Notice Box */}
              <div className="p-3.5 bg-[#FAF5FB] rounded-2xl border border-[#F0E8F2] space-y-1 text-[#2E2A3B]">
                <p className="font-bold flex items-center gap-1.5 text-[#6D4BB8]">
                  <Package className="w-4 h-4" />
                  <span>¿Cómo funciona el despacho parcial?</span>
                </p>
                <p className="text-[11px] text-[#7A7590] leading-relaxed">
                  Los productos seleccionados se transferirán a una <strong>nueva orden pendiente</strong>. En la orden original ({splitModalOrder.code}) aparecerán tachados y <strong>no se sumarán al cobro de hoy</strong>, evitando duplicidad de productos y garantizando que el stock solo se descuente cuando los productos realmente lleguen.
                </p>
              </div>

              {/* Items Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px]">
                    1. Selecciona los productos a transferir
                  </h3>
                  <span className="text-[11px] text-[#7A7590]">
                    {Object.values(splitSelections).filter((q) => q > 0).length} seleccionados
                  </span>
                </div>

                <div className="rounded-2xl border border-[#F0E8F2] divide-y divide-[#F7F2F9] overflow-hidden bg-white">
                  {(splitModalOrder.order_items || [])
                    .filter((item) => !item.transferred_to_code)
                    .map((item) => {
                      const currentSelectedQty = splitSelections[item.id] || 0;
                      const isSelected = currentSelectedQty > 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                            isSelected ? "bg-[#FAF5FB]/80 border-l-4 border-l-[#6D4BB8]" : "hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSplitSelections((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.checked ? item.quantity : 0,
                                }));
                              }}
                              className="w-4 h-4 rounded text-[#6D4BB8] focus:ring-[#6D4BB8] cursor-pointer shrink-0"
                            />

                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-10 h-10 rounded-xl object-cover border border-[#F0E8F2] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-center text-[#6D4BB8] shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-bold text-[#2E2A3B] truncate">{item.product_name}</p>
                              <p className="text-[11px] text-[#7A7590]">
                                Total en pedido: {item.quantity} un. • {formatCOP(item.unit_price)} c/u
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {isSelected && (
                              <div className="flex items-center gap-1 bg-white rounded-xl border border-[#F0E8F2] p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSplitSelections((prev) => ({
                                      ...prev,
                                      [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                                    }));
                                  }}
                                  disabled={currentSelectedQty <= 1}
                                  className="w-6 h-6 rounded-lg bg-[#FAF5FB] hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center text-[#2E2A3B] cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center font-extrabold text-[#2E2A3B] text-xs">
                                  {currentSelectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSplitSelections((prev) => ({
                                      ...prev,
                                      [item.id]: Math.min(item.quantity, (prev[item.id] || 1) + 1),
                                    }));
                                  }}
                                  disabled={currentSelectedQty >= item.quantity}
                                  className="w-6 h-6 rounded-lg bg-[#FAF5FB] hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center text-[#2E2A3B] cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <span className="font-extrabold text-[#6D4BB8] text-xs w-24 text-right">
                              {formatCOP(item.unit_price * (isSelected ? currentSelectedQty : item.quantity))}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {(splitModalOrder.order_items || []).filter((i) => !i.transferred_to_code).length === 0 && (
                    <div className="p-6 text-center text-[#7A7590]">
                      <p>Todos los productos de este pedido ya han sido transferidos.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* New Order Options */}
              <div className="space-y-3 pt-3 border-t border-[#F0E8F2]">
                <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px]">
                  2. Configuración del Nuevo Pedido Pendiente
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Costo de Envío para el nuevo despacho (COP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={splitShippingCost}
                      onChange={(e) => setSplitShippingCost(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-extrabold text-[#2E2A3B] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                    <p className="text-[10px] text-[#7A7590] mt-1">
                      (Déjalo en $0 si Alyshop asume este flete por ser un pendiente de tienda)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas privadas para el segundo despacho
                    </label>
                    <input
                      type="text"
                      value={splitNotes}
                      onChange={(e) => setSplitNotes(e.target.value)}
                      placeholder="Ej: Avisar cuando llegue del proveedor..."
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] cursor-pointer hover:bg-[#F3EBF5] transition-colors">
                      <input
                        type="checkbox"
                        checked={splitIsAlreadyPaid}
                        onChange={(e) => setSplitIsAlreadyPaid(e.target.checked)}
                        className="w-4 h-4 rounded text-[#6D4BB8] focus:ring-[#6D4BB8] cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#2E2A3B] block">
                          El cliente ya pagó la totalidad por adelantado (Nequi, Daviplata o Bancolombia)
                        </span>
                        <span className="text-[11px] text-[#7A7590]">
                          La nueva orden indicará que el cobro en entrega al cliente es de $0.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Resumen comparativo en tiempo real */}
                {(() => {
                  const transferringItems = Object.entries(splitSelections).filter(([_, q]) => q > 0);
                  const transferringSubtotal = transferringItems.reduce((acc, [itemId, qty]) => {
                    const item = (splitModalOrder.order_items || []).find((i) => i.id === itemId);
                    return acc + (item ? item.unit_price * qty : 0);
                  }, 0);

                  const currentActiveSubtotal = (splitModalOrder.order_items || [])
                    .filter((i) => !i.transferred_to_code)
                    .reduce((acc, i) => acc + i.subtotal, 0);

                  const remainingOriginalSubtotal = Math.max(0, currentActiveSubtotal - transferringSubtotal);

                  return (
                    <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-2 text-xs">
                      <div className="flex justify-between text-[#7A7590]">
                        <span>Quedará en {splitModalOrder.code} (para entrega hoy):</span>
                        <strong className="text-[#2E2A3B]">{formatCOP(remainingOriginalSubtotal + splitModalOrder.shipping_cost)}</strong>
                      </div>
                      <div className="flex justify-between text-[#7A7590]">
                        <span>Se transferirá al nuevo pedido pendiente:</span>
                        <strong className="text-[#6D4BB8]">
                          {formatCOP(transferringSubtotal + Number(splitShippingCost || 0))}
                          {splitIsAlreadyPaid && " (Cobro al cliente: $0)"}
                        </strong>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[#F0E8F2] bg-[#FAF5FB] flex items-center justify-end gap-3 sticky bottom-0 z-20">
              <button
                type="button"
                disabled={isSplitting}
                onClick={() => setSplitModalOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  isSplitting ||
                  Object.values(splitSelections).filter((q) => q > 0).length === 0
                }
                onClick={handleConfirmSplitOrder}
                className="px-6 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSplitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando nuevo pedido...</span>
                  </>
                ) : (
                  <>
                    <Split className="w-4 h-4" />
                    <span>
                      Confirmar Despacho Parcial (
                      {Object.values(splitSelections).reduce((a, b) => a + b, 0)} unidades
                      )
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
