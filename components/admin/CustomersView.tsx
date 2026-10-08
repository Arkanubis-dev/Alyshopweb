"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MessageCircle,
  Download,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  X,
  CreditCard,
  MapPin,
  Calendar,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Send,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Customer, Order } from "@/types";
import { formatCOP } from "@/lib/utils";
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "@/app/actions/customers";
import { AdminPagination, PageSizeOption } from "./AdminPagination";

interface CustomersViewProps {
  initialCustomers: Customer[];
  orders?: Order[];
}

export function CustomersView({
  initialCustomers,
  orders = [],
}: CustomersViewProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "todos" | "nuevos" | "recurrentes" | "con_correo" | "con_celular"
  >("todos");
  const [sortBy, setSortBy] = useState<
    "recientes" | "antiguos" | "mayor_compras" | "mas_pedidos" | "alfabetico"
  >("recientes");

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3800);
  };

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createIdNumber, setCreateIdNumber] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createCity, setCreateCity] = useState("Bogotá");
  const [createNeighborhood, setCreateNeighborhood] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal form fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Copy state feedback
  const [copiedType, setCopiedType] = useState<"emails" | "phones" | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, sortBy]);

  // Statistics
  const totalCustomers = customers.length;
  const customersWithEmail = customers.filter(
    (c) => c.email && c.email.includes("@")
  ).length;
  const customersWithPhone = customers.filter(
    (c) => c.phone && c.phone.trim().length >= 7
  ).length;
  const totalSalesFromCustomers = customers.reduce(
    (acc, c) => acc + (Number(c.total_spent) || 0),
    0
  );

  // Filtered & Sorted list
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Category filter
        if (filterType === "nuevos" && (c.orders_count || 1) > 1) return false;
        if (filterType === "recurrentes" && (c.orders_count || 1) <= 1) return false;
        if (filterType === "con_correo" && (!c.email || !c.email.includes("@")))
          return false;
        if (filterType === "con_celular" && (!c.phone || c.phone.trim().length < 7))
          return false;

        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchId = (c.id_number || "").toLowerCase().includes(q);
          const matchName = (c.name || "").toLowerCase().includes(q);
          const matchEmail = (c.email || "").toLowerCase().includes(q);
          const matchPhone = (c.phone || "").includes(q);
          const matchCity = (c.city || "").toLowerCase().includes(q);
          return matchId || matchName || matchEmail || matchPhone || matchCity;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recientes") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "antiguos") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === "mayor_compras") {
          return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
        }
        if (sortBy === "mas_pedidos") {
          return (Number(b.orders_count) || 0) - (Number(a.orders_count) || 0);
        }
        if (sortBy === "alfabetico") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [customers, search, filterType, sortBy]);

  // Paginated list
  const paginatedCustomers = useMemo(() => {
    if (pageSize === "all") return filteredCustomers;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredCustomers.slice(start, start + (pageSize as number));
  }, [filteredCustomers, currentPage, pageSize]);

  // Customer orders matching selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanId = (selectedCustomer.id_number || "").trim().toLowerCase();
    const cleanPhone = (selectedCustomer.phone || "").replace(/\D/g, "");

    return orders.filter((o) => {
      const matchId =
        cleanId &&
        o.customer_id_number &&
        o.customer_id_number.trim().toLowerCase() === cleanId;
      const matchPhone =
        cleanPhone &&
        o.customer_phone &&
        o.customer_phone.replace(/\D/g, "") === cleanPhone;
      return matchId || matchPhone;
    });
  }, [selectedCustomer, orders]);

  // Copy all emails
  const handleCopyEmails = () => {
    const emails = customers
      .map((c) => c.email?.trim())
      .filter((e) => e && e.includes("@"));

    const uniqueEmails = Array.from(new Set(emails));
    if (uniqueEmails.length === 0) {
      showToast("No hay correos registrados para copiar", "error");
      return;
    }

    navigator.clipboard.writeText(uniqueEmails.join(", "));
    setCopiedType("emails");
    showToast(
      `¡${uniqueEmails.length} correos copiados al portapapeles listos para tu campaña publicitaria!`
    );
    setTimeout(() => setCopiedType(null), 3000);
  };

  // Copy all phones for WhatsApp Broadcast
  const handleCopyPhones = () => {
    const phones = customers
      .map((c) => c.phone?.trim())
      .filter((p) => p && p.length >= 7);

    const uniquePhones = Array.from(new Set(phones));
    if (uniquePhones.length === 0) {
      showToast("No hay números registrados para copiar", "error");
      return;
    }

    navigator.clipboard.writeText(uniquePhones.join(", "));
    setCopiedType("phones");
    showToast(
      `¡${uniquePhones.length} teléfonos copiados para difusión en WhatsApp!`
    );
    setTimeout(() => setCopiedType(null), 3000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast("No hay datos de clientes para exportar", "error");
      return;
    }

    const headers = [
      "Cédula",
      "Nombre Completo",
      "Correo Electrónico",
      "Celular",
      "Ciudad",
      "Barrio",
      "Dirección",
      "Total Pedidos",
      "Total Comprado (COP)",
      "Fecha Primer Pedido",
      "Fecha Último Pedido",
      "Notas Publicitarias",
    ];

    const rows = customers.map((c) => [
      `"${c.id_number || ""}"`,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${(c.city || "").replace(/"/g, '""')}"`,
      `"${(c.neighborhood || "").replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      c.orders_count || 1,
      Number(c.total_spent) || 0,
      `"${c.first_order_date || c.created_at || ""}"`,
      `"${c.last_order_date || c.created_at || ""}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes_alyshop_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("¡Archivo CSV exportado exitosamente!");
  };

  // Open Edit
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditEmail(customer.email || "");
    setEditPhone(customer.phone || "");
    setEditCity(customer.city || "Bogotá");
    setEditNeighborhood(customer.neighborhood || "");
    setEditAddress(customer.address || "");
    setEditNotes(customer.notes || "");
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editName.trim()) {
      showToast("El nombre del cliente es obligatorio", "error");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await updateCustomerAction(editingCustomer.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        neighborhood: editNeighborhood.trim() || undefined,
        address: editAddress.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });

      if (res.success && res.customer) {
        showToast("Cliente actualizado correctamente");
        const updated = res.customer;
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        if (selectedCustomer && selectedCustomer.id === updated.id) {
          setSelectedCustomer(updated);
        }
        setEditingCustomer(null);
      } else {
        showToast(res.error || "Error al actualizar cliente", "error");
      }
    } catch {
      showToast("Error inesperado al guardar los cambios", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit Create
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createIdNumber.trim() || !createName.trim()) {
      showToast("La cédula y el nombre son campos obligatorios", "error");
      return;
    }

    try {
      setIsCreating(true);
      const res = await createCustomerAction({
        id_number: createIdNumber.trim(),
        name: createName.trim(),
        email: createEmail.trim(),
        phone: createPhone.trim(),
        city: createCity.trim() || "Bogotá",
        neighborhood: createNeighborhood.trim() || undefined,
        address: createAddress.trim() || undefined,
        notes: createNotes.trim() || undefined,
      });

      if (res.success && res.customer) {
        showToast("¡Cliente nuevo registrado con éxito!");
        setCustomers((prev) => [res.customer!, ...prev]);
        setIsCreateModalOpen(false);
        // Reset form
        setCreateIdNumber("");
        setCreateName("");
        setCreateEmail("");
        setCreatePhone("");
        setCreateCity("Bogotá");
        setCreateNeighborhood("");
        setCreateAddress("");
        setCreateNotes("");
      } else {
        showToast(res.error || "No se pudo registrar el cliente", "error");
      }
    } catch {
      showToast("Error inesperado al registrar el cliente", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      setIsDeleting(true);
      const res = await deleteCustomerAction(customerToDelete.id);
      if (res.success) {
        showToast("Cliente eliminado del registro");
        setCustomers((prev) =>
          prev.filter((c) => c.id !== customerToDelete.id)
        );
        if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
          setSelectedCustomer(null);
        }
        setCustomerToDelete(null);
      } else {
        showToast(res.error || "Error al eliminar cliente", "error");
      }
    } catch {
      showToast("Error inesperado al eliminar cliente", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all animate-in slide-in-from-bottom-3 ${
            notification.type === "success"
              ? "bg-[#2E2A3B] text-white border border-[#6D4BB8]/30"
              : "bg-rose-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFB] text-xs font-bold text-[#6D4BB8] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F472A8]" />
            <span>Módulo de Clientes y Publicidad</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E2A3B] tracking-tight">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590] mt-1 max-w-2xl">
            Base de datos organizada por cédula para identificar clientes nuevos vs. recurrentes,
            diseñada para tus campañas publicitarias por correo electrónico y difusiones de WhatsApp.
          </p>
        </div>

        {/* Marketing Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-[#6D4BB8] border border-[#F0E8F2] hover:bg-[#FAF5FB] hover:border-[#6D4BB8]/40 shadow-xs transition-all cursor-pointer"
            title="Copiar lista de correos separados por comas para enviar campañas"
          >
            {copiedType === "emails" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-[#6D4BB8]" />
            )}
            <span>Copiar Correos</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPhones}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-[#25D366] border border-[#F0E8F2] hover:bg-[#FAF5FB] hover:border-[#25D366]/40 shadow-xs transition-all cursor-pointer"
            title="Copiar números para listas de difusión de WhatsApp"
          >
            {copiedType === "phones" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            )}
            <span>Copiar Celulares</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-[#2E2A3B] border border-[#F0E8F2] hover:bg-[#FAF5FB] hover:border-[#7A7590] shadow-xs transition-all cursor-pointer"
            title="Descargar base de clientes en formato CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#7A7590]" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#6D4BB8] text-white hover:bg-[#5C3EA0] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Clientes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#F0E8F2] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#7A7590] uppercase tracking-wider">
              Total Clientes
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#2E2A3B]">
              {totalCustomers}
            </div>
            <p className="text-[11px] text-[#7A7590]">Identificados por cédula única</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EEEAFB] text-[#6D4BB8] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Para Email Marketing */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#F0E8F2] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#7A7590] uppercase tracking-wider">
              Email Marketing
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#6D4BB8]">
              {customersWithEmail}
            </div>
            <p className="text-[11px] text-[#7A7590]">
              {totalCustomers > 0
                ? `${Math.round((customersWithEmail / totalCustomers) * 100)}% con correo registrado`
                : "Sin correos"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FCE4EF] text-[#F472A8] flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Difusión WhatsApp */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#F0E8F2] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#7A7590] uppercase tracking-wider">
              Difusión WhatsApp
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#28795A]">
              {customersWithPhone}
            </div>
            <p className="text-[11px] text-[#7A7590]">Listos para mensajes de catálogo</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#DDF3EC] text-[#28795A] flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Ventas Generadas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#F0E8F2] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#7A7590] uppercase tracking-wider">
              Ventas Totales
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#2E2A3B] truncate max-w-[170px]">
              {formatCOP(totalSalesFromCustomers)}
            </div>
            <p className="text-[11px] text-[#7A7590]">Facturación acumulada</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1CC] text-[#B38300] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search, Filter Chips and Sorter */}
      <div className="p-4 rounded-3xl bg-white border border-[#F0E8F2] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#7A7590] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cédula, nombre, correo, teléfono o ciudad..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-xs sm:text-sm text-[#2E2A3B] placeholder-[#7A7590]/70 focus:outline-none focus:border-[#F472A8]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7590] hover:text-[#2E2A3B]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <span className="text-xs text-[#7A7590] font-semibold whitespace-nowrap">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="flex-1 md:flex-none text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="mayor_compras">Mayor compra acumulada</option>
              <option value="mas_pedidos">Más pedidos realizados</option>
              <option value="alfabetico">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-[#7A7590] uppercase tracking-wider mr-1">
            Filtros:
          </span>

          <button
            type="button"
            onClick={() => setFilterType("todos")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === "todos"
                ? "bg-[#6D4BB8] text-white"
                : "bg-[#FAF5FB] text-[#7A7590] hover:bg-[#EEEAFB] hover:text-[#6D4BB8]"
            }`}
          >
            Todos ({totalCustomers})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("nuevos")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === "nuevos"
                ? "bg-[#6D4BB8] text-white"
                : "bg-[#FAF5FB] text-[#7A7590] hover:bg-[#EEEAFB] hover:text-[#6D4BB8]"
            }`}
          >
            Clientes Nuevos (1 pedido)
          </button>

          <button
            type="button"
            onClick={() => setFilterType("recurrentes")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === "recurrentes"
                ? "bg-[#6D4BB8] text-white"
                : "bg-[#FAF5FB] text-[#7A7590] hover:bg-[#EEEAFB] hover:text-[#6D4BB8]"
            }`}
          >
            Clientes Recurrentes (2+ pedidos)
          </button>

          <button
            type="button"
            onClick={() => setFilterType("con_correo")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === "con_correo"
                ? "bg-[#6D4BB8] text-white"
                : "bg-[#FAF5FB] text-[#7A7590] hover:bg-[#EEEAFB] hover:text-[#6D4BB8]"
            }`}
          >
            Con Correo ({customersWithEmail})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("con_celular")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === "con_celular"
                ? "bg-[#6D4BB8] text-white"
                : "bg-[#FAF5FB] text-[#7A7590] hover:bg-[#EEEAFB] hover:text-[#6D4BB8]"
            }`}
          >
            Con WhatsApp ({customersWithPhone})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FB] text-[#7A7590] font-bold uppercase tracking-wider text-[11px] border-b border-[#F0E8F2]">
              <tr>
                <th className="py-3.5 px-4">Cédula / Documento</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Correo Electrónico</th>
                <th className="py-3.5 px-4">Celular / WhatsApp</th>
                <th className="py-3.5 px-4">Pedidos & Compras</th>
                <th className="py-3.5 px-4">Registro</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8F2]">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A7590]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-10 h-10 text-[#7A7590]/40 mx-auto" />
                      <p className="font-bold text-[#2E2A3B]">
                        No se encontraron clientes
                      </p>
                      <p className="text-xs">
                        {search
                          ? "Intenta con otro término de búsqueda o limpia los filtros."
                          : "Los clientes nuevos se registrarán automáticamente cuando hagan pedidos por la tienda."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => {
                  const isNew = (customer.orders_count || 1) <= 1;
                  const cleanPhone = (customer.phone || "").replace(/\D/g, "");
                  const waNumber = cleanPhone.startsWith("57")
                    ? cleanPhone
                    : `57${cleanPhone}`;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-[#FFFBF7]/70 transition-colors"
                    >
                      {/* Cédula */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#6D4BB8]">
                            {customer.id_number}
                          </span>
                          {isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF3EC] text-[#28795A] border border-[#28795A]/20">
                              Nuevo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nombre y Ciudad */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2E2A3B]">
                          {customer.name}
                        </div>
                        <div className="text-[11px] text-[#7A7590] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#F472A8]" />
                          <span>
                            {customer.city}
                            {customer.neighborhood
                              ? ` • Barrio ${customer.neighborhood}`
                              : ""}
                          </span>
                        </div>
                      </td>

                      {/* Correo Electrónico */}
                      <td className="py-3.5 px-4">
                        {customer.email ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${customer.email}`}
                              className="text-[#6D4BB8] hover:underline font-medium truncate max-w-[200px]"
                              title={`Enviar correo a ${customer.email}`}
                            >
                              {customer.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(customer.email);
                                showToast(`Correo copiado: ${customer.email}`);
                              }}
                              className="p-1 rounded-md hover:bg-[#EEEAFB] text-[#7A7590] hover:text-[#6D4BB8] transition-colors cursor-pointer"
                              title="Copiar correo"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#7A7590]/60 italic">
                            No registrado
                          </span>
                        )}
                      </td>

                      {/* Celular / WhatsApp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {customer.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#2E2A3B]">
                              {customer.phone}
                            </span>
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-[#DDF3EC] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
                              title="Abrir chat en WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[#7A7590]/60 italic">
                            No registrado
                          </span>
                        )}
                      </td>

                      {/* Pedidos & Monto Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#2E2A3B]">
                          {formatCOP(customer.total_spent || 0)}
                        </div>
                        <div className="text-[11px] text-[#7A7590]">
                          {customer.orders_count || 1}{" "}
                          {(customer.orders_count || 1) === 1
                            ? "pedido"
                            : "pedidos"}
                        </div>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 px-4 text-[#7A7590] whitespace-nowrap text-[11px]">
                        {new Date(customer.created_at).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-2 rounded-xl text-[#6D4BB8] hover:bg-[#EEEAFB] transition-colors cursor-pointer"
                            title="Ver detalles e historial de compras"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(customer)}
                            className="p-2 rounded-xl text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] transition-colors cursor-pointer"
                            title="Editar datos del cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(customer)}
                            className="p-2 rounded-xl text-[#7A7590] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="p-4 border-t border-[#F0E8F2]">
            <AdminPagination
              currentPage={currentPage}
              totalItems={filteredCustomers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="clientes"
            />
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL: VER DETALLE DEL CLIENTE */}
      {/* ================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-gradient-to-r from-[#FAF5FB] to-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#6D4BB8] text-white flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                      {selectedCustomer.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEAFB] text-[#6D4BB8]">
                      C.C. {selectedCustomer.id_number}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7590]">
                    Cliente registrado el{" "}
                    {new Date(selectedCustomer.created_at).toLocaleDateString(
                      "es-CO",
                      { day: "2-digit", month: "long", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7A7590] hover:text-[#2E2A3B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
              {/* Quick Contact & Marketing Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Send Email */}
                {selectedCustomer.email && (
                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    className="p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] hover:border-[#6D4BB8] flex items-center justify-between transition-all group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#7A7590]">
                        Correo Electrónico
                      </span>
                      <p className="font-bold text-[#6D4BB8] truncate max-w-[220px]">
                        {selectedCustomer.email}
                      </p>
                    </div>
                    <Send className="w-4 h-4 text-[#6D4BB8] group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}

                {/* Send WhatsApp */}
                {selectedCustomer.phone && (
                  <a
                    href={`https://wa.me/${
                      selectedCustomer.phone.startsWith("57")
                        ? selectedCustomer.phone
                        : `57${selectedCustomer.phone}`
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-[#DDF3EC]/50 border border-[#28795A]/20 hover:border-[#25D366] flex items-center justify-between transition-all group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#28795A]">
                        WhatsApp Comercial
                      </span>
                      <p className="font-bold text-[#25D366]">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
                  </a>
                )}
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FFFBF7] border border-[#F0E8F2]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7590] block">
                    Ciudad y Dirección
                  </span>
                  <p className="font-bold text-[#2E2A3B] mt-0.5">
                    {selectedCustomer.city}
                    {selectedCustomer.neighborhood
                      ? ` • Barrio ${selectedCustomer.neighborhood}`
                      : ""}
                  </p>
                  <p className="text-[#7A7590]">
                    {selectedCustomer.address || "Sin dirección registrada"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A7590] block">
                    Resumen de Compras
                  </span>
                  <p className="font-bold text-[#6D4BB8] text-base mt-0.5">
                    {formatCOP(selectedCustomer.total_spent || 0)}
                  </p>
                  <p className="text-[#7A7590]">
                    {selectedCustomer.orders_count || 1}{" "}
                    {(selectedCustomer.orders_count || 1) === 1
                      ? "pedido registrado"
                      : "pedidos registrados"}
                  </p>
                </div>

                {selectedCustomer.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-[#F0E8F2]">
                    <span className="text-[10px] uppercase font-bold text-[#7A7590] block">
                      Notas de Campañas / Intereses
                    </span>
                    <p className="text-[#2E2A3B] mt-0.5 font-medium">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Pedidos Asociados a este Cliente */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#6D4BB8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Historial de Pedidos ({customerOrders.length})</span>
                  </h3>
                  <span className="text-[11px] text-[#7A7590]">
                    Asociados por Cédula / Celular
                  </span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FAF5FB] text-center text-[#7A7590]">
                    <p>No se encontraron pedidos registrados con esta cédula.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-2xl bg-white border border-[#F0E8F2] flex items-center justify-between hover:border-[#6D4BB8]/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#6D4BB8]">
                              {ord.code}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                ord.status === "entregado"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : ord.status === "confirmado"
                                  ? "bg-blue-50 text-blue-800"
                                  : ord.status === "cancelado"
                                  ? "bg-rose-50 text-rose-800"
                                  : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A7590]">
                            {new Date(ord.created_at).toLocaleDateString(
                              "es-CO",
                              { day: "2-digit", month: "short", year: "numeric" }
                            )}{" "}
                            • {ord.delivery_method === "envio" ? "Envío" : "Recoger"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-[#2E2A3B] block">
                            {formatCOP(ord.total)}
                          </span>
                          <Link
                            href={`/pedido/${ord.code}?token=${ord.public_token}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] text-[#6D4BB8] hover:underline"
                          >
                            <span>Ver factura</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F0E8F2] flex items-center justify-between bg-[#FAF5FB]">
              <button
                type="button"
                onClick={() => {
                  const cust = selectedCustomer;
                  setSelectedCustomer(null);
                  handleOpenEdit(cust);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6D4BB8] hover:bg-[#EEEAFB] cursor-pointer"
              >
                Editar información
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6D4BB8] text-white hover:bg-[#5C3EA0] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: REGISTRAR NUEVO CLIENTE MANUALMENTE */}
      {/* ================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isCreating && setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-gradient-to-r from-[#FAF5FB] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#6D4BB8]/10 text-[#6D4BB8] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#6D4BB8]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                    Registrar Nuevo Cliente
                  </h2>
                  <p className="text-xs text-[#7A7590]">
                    Se registrará con su número de cédula único para campañas comerciales.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isCreating}
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7A7590] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCustomer} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cédula */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Número de Cédula / Documento de Identidad *
                    </label>
                    <input
                      type="text"
                      required
                      value={createIdNumber}
                      onChange={(e) => setCreateIdNumber(e.target.value)}
                      placeholder="Ej: 1020789456 (Evita duplicados)"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Nombre y Apellido Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Ej: Carolina Gómez"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Correo Electrónico (Para Publicidad)
                    </label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="carolina@ejemplo.com"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Celular */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Celular (WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      placeholder="Ej: 3105551234"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={createCity}
                      onChange={(e) => setCreateCity(e.target.value)}
                      placeholder="Ej: Bogotá"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Barrio */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Barrio
                    </label>
                    <input
                      type="text"
                      value={createNeighborhood}
                      onChange={(e) => setCreateNeighborhood(e.target.value)}
                      placeholder="Ej: Usaquén"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Dirección (Opcional)
                    </label>
                    <input
                      type="text"
                      value={createAddress}
                      onChange={(e) => setCreateAddress(e.target.value)}
                      placeholder="Ej: Calle 140 # 11-45"
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Notas publicitarias */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas Comerciales / Preferencias de Publicidad
                    </label>
                    <textarea
                      rows={2}
                      value={createNotes}
                      onChange={(e) => setCreateNotes(e.target.value)}
                      placeholder="Ej: Interesada en ofertas de belleza y hogar. Enviar catálogo los fines de semana."
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#F0E8F2] flex items-center justify-end gap-2 bg-[#FAF5FB]">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A7590] hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#6D4BB8] text-white hover:bg-[#5C3EA0] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Registrar Cliente</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: EDITAR CLIENTE */}
      {/* ================================================================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isSavingEdit && setEditingCustomer(null)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-gradient-to-r from-[#FAF5FB] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#6D4BB8]/10 text-[#6D4BB8] flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-[#6D4BB8]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                    Editar Datos del Cliente
                  </h2>
                  <p className="text-xs text-[#7A7590]">
                    Cédula: {editingCustomer.id_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingCustomer(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7A7590] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Celular */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Celular / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Barrio */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Barrio
                    </label>
                    <input
                      type="text"
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  {/* Notas publicitarias */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#7A7590] mb-1">
                      Notas de Campañas Comerciales
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#F0E8F2] flex items-center justify-end gap-2 bg-[#FAF5FB]">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A7590] hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#6D4BB8] text-white hover:bg-[#5C3EA0] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Actualizar Datos</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINAR CLIENTE */}
      {/* ================================================================= */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isDeleting && setCustomerToDelete(null)}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#2E2A3B]">
                ¿Eliminar cliente del registro?
              </h3>
              <p className="text-xs text-[#7A7590]">
                Vas a retirar a{" "}
                <strong className="text-[#2E2A3B]">
                  {customerToDelete.name}
                </strong>{" "}
                (C.C. {customerToDelete.id_number}) de la base de datos comercial.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A7590] hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
