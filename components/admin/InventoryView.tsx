"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { AdminPagination, PageSizeOption } from "./AdminPagination";
import {
  Boxes,
  Minus,
  Plus,
  History,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  Search,
  Check,
  X,
  Loader2,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { Product, InventoryMovement } from "@/types";
import { updateProductStockAction } from "@/app/actions/inventory";

interface InventoryViewProps {
  initialProducts: Product[];
  initialMovements: InventoryMovement[];
}

export function InventoryView({
  initialProducts,
  initialMovements,
}: InventoryViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<InventoryMovement[]>(initialMovements);
  const [activeTab, setActiveTab] = useState<"stock" | "movimientos">("stock");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "bajas" | "agotadas">("todos");

  // Quick movement modal
  const [movementModalProduct, setMovementModalProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<"entrada" | "salida" | "ajuste" | "devolucion">("entrada");
  const [movementQty, setMovementQty] = useState<number>(5);
  const [movementReason, setMovementReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredProducts = products.filter((p) => {
    if (filterType === "bajas" && (p.stock <= 0 || p.stock > p.low_stock_threshold)) return false;
    if (filterType === "agotadas" && p.stock > 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Pagination State for Stock Tab
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  // Pagination State for Movements Tab
  const [currentMovementsPage, setCurrentMovementsPage] = useState(1);
  const [movementsPageSize, setMovementsPageSize] = useState<PageSizeOption>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  const paginatedProducts = useMemo(() => {
    if (pageSize === "all") return filteredProducts;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredProducts.slice(start, start + (pageSize as number));
  }, [filteredProducts, currentPage, pageSize]);

  const paginatedMovements = useMemo(() => {
    if (movementsPageSize === "all") return movements;
    const start = (currentMovementsPage - 1) * (movementsPageSize as number);
    return movements.slice(start, start + (movementsPageSize as number));
  }, [movements, currentMovementsPage, movementsPageSize]);

  // Fast inline stock adjustment (+ / -)
  const handleQuickAdjust = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    if (nextStock === product.stock) return;

    // Optimistic
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p))
    );

    const type = delta > 0 ? "entrada" : "salida";
    const reason = `Ajuste rápido en línea (${delta > 0 ? `+${delta}` : delta})`;
    const res = await updateProductStockAction(product.id, nextStock, reason, type);

    if (res.success) {
      showToast(`Stock de "${product.name}" actualizado a ${nextStock}`);
    } else {
      showToast(res.error || "Error al actualizar", "error");
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: product.stock } : p))
      );
    }
  };

  const handleDirectStockChange = async (product: Product, newStockValue: number) => {
    if (isNaN(newStockValue) || newStockValue < 0) return;
    if (newStockValue === product.stock) return;

    const delta = newStockValue - product.stock;
    const type = delta > 0 ? "entrada" : delta < 0 ? "salida" : "ajuste";

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStockValue } : p))
    );

    const res = await updateProductStockAction(
      product.id,
      newStockValue,
      `Modificación directa a ${newStockValue}`,
      type
    );

    if (res.success) {
      showToast(`Stock actualizado a ${newStockValue}`);
    } else {
      showToast(res.error || "Error", "error");
    }
  };

  const handleSaveMovementModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModalProduct) return;

    try {
      setIsProcessing(true);
      let nextStock = movementModalProduct.stock;
      if (movementType === "entrada" || movementType === "devolucion") {
        nextStock += movementQty;
      } else if (movementType === "salida") {
        nextStock = Math.max(0, nextStock - movementQty);
      } else if (movementType === "ajuste") {
        nextStock = movementQty;
      }

      const res = await updateProductStockAction(
        movementModalProduct.id,
        nextStock,
        movementReason || `Movimiento de ${movementType}`,
        movementType
      );

      if (res.success) {
        showToast("Movimiento registrado en kárdex");
        setProducts((prev) =>
          prev.map((p) => (p.id === movementModalProduct.id ? { ...p, stock: nextStock } : p))
        );
        setMovements((prev) => [
          {
            id: `mov-${Date.now()}`,
            product_id: movementModalProduct.id,
            product_name: movementModalProduct.name,
            type: movementType,
            quantity: movementQty,
            reason: movementReason || `Movimiento de ${movementType}`,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setMovementModalProduct(null);
      } else {
        showToast(res.error || "Error al registrar", "error");
      }
    } finally {
      setIsProcessing(false);
    }
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
            Control de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590]">
            Edición rápida en línea (+ / −), registro de movimientos y kárdex de existencias.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-xl border border-[#F0E8F2] shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "stock"
                ? "bg-[#6D4BB8] text-white shadow-xs"
                : "text-[#7A7590] hover:text-[#2E2A3B]"
            }`}
          >
            Existencias Actuales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("movimientos")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "movimientos"
                ? "bg-[#6D4BB8] text-white shadow-xs"
                : "text-[#7A7590] hover:text-[#2E2A3B]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Kárdex / Movimientos ({movements.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "stock" ? (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-[#F0E8F2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-[#7A7590] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por producto o SKU..."
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterType("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  filterType === "todos"
                    ? "bg-[#6D4BB8] text-white border-[#6D4BB8]"
                    : "bg-white text-[#7A7590] border-[#F0E8F2] hover:bg-gray-50"
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("bajas")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  filterType === "bajas"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Stock bajo</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType("agotadas")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  filterType === "agotadas"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                }`}
              >
                <PackageX className="w-3 h-3" />
                <span>Agotados</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#FAF5FB] border-b border-[#F0E8F2] text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Umbral Alerta</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F2F9]">
                  {paginatedProducts.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLowStock = !isOutOfStock && p.stock <= p.low_stock_threshold;

                    return (
                      <tr key={p.id} className="hover:bg-[#FFFBF7]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#FAF5FB] border border-[#F0E8F2] shrink-0">
                              <Image
                                src={p.images[0]?.url || "/placeholder.png"}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-[#2E2A3B] truncate">{p.name}</p>
                              <p className="text-[11px] text-[#7A7590]">SKU: {p.sku || "N/A"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs text-[#7A7590]">
                          {p.category_name || "General"}
                        </td>

                        <td className="py-3 px-4 text-center text-xs text-[#7A7590]">
                          &le; {p.low_stock_threshold} unid.
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Agotado
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Pocas unidades
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Disponible
                            </span>
                          )}
                        </td>

                        {/* Inline Stock Editing: (-) Input (+) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-[#FAF5FB] border border-[#F0E8F2] p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(p, -1)}
                              disabled={p.stock <= 0}
                              aria-label="Restar 1"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E2A3B] hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input
                              type="number"
                              min={0}
                              value={p.stock}
                              onChange={(e) =>
                                handleDirectStockChange(p, parseInt(e.target.value) || 0)
                              }
                              className="w-14 text-center font-extrabold text-sm text-[#2E2A3B] bg-transparent focus:outline-none focus:bg-white rounded"
                            />

                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(p, 1)}
                              aria-label="Sumar 1"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E2A3B] hover:bg-white transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Registrar Movimiento Button */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setMovementModalProduct(p);
                              setMovementQty(10);
                              setMovementType("entrada");
                              setMovementReason("Reabastecimiento de bodega");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EEEAFB] hover:bg-[#6D4BB8] hover:text-white text-[#6D4BB8] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>Movimiento</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination for Stock */}
            <AdminPagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="productos en stock"
            />
          </div>
        </div>
      ) : (
        /* Kárdex Tab */
        <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F0E8F2] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#2E2A3B]">
              Historial de Movimientos de Inventario (Kárdex)
            </h2>
            <span className="text-xs text-[#7A7590]">
              Auditoría de entradas, salidas, ajustes y devoluciones
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#FAF5FB] border-b border-[#F0E8F2] text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4">Motivo / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F2F9]">
                {paginatedMovements.map((m) => {
                  const typeStyles = {
                    entrada: "bg-emerald-50 text-emerald-800 border-emerald-200",
                    salida: "bg-amber-50 text-amber-800 border-amber-200",
                    ajuste: "bg-blue-50 text-blue-800 border-blue-200",
                    devolucion: "bg-purple-50 text-purple-800 border-purple-200",
                  }[m.type] || "bg-gray-50 text-gray-800";

                  return (
                    <tr key={m.id} className="hover:bg-[#FFFBF7]/60 transition-colors">
                      <td className="py-3 px-4 text-xs text-[#7A7590] whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#2E2A3B]">
                        {m.product_name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyles}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        {m.type === "entrada" || m.type === "devolucion" ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#7A7590]">
                        {m.reason}
                        {m.order_id && ` (Pedido ${m.order_id})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination for Movements */}
          <AdminPagination
            currentPage={currentMovementsPage}
            totalItems={movements.length}
            pageSize={movementsPageSize}
            onPageChange={setCurrentMovementsPage}
            onPageSizeChange={(newSize) => {
              setMovementsPageSize(newSize);
              setCurrentMovementsPage(1);
            }}
            itemLabel="movimientos de kárdex"
          />
        </div>
      )}

      {/* Movement Modal */}
      {movementModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setMovementModalProduct(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8F2]">
              <div>
                <h3 className="text-base font-bold text-[#2E2A3B]">
                  Registrar Movimiento de Inventario
                </h3>
                <p className="text-xs text-[#7A7590] truncate max-w-xs">
                  {movementModalProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovementModalProduct(null)}
                className="p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-[#7A7590]" />
              </button>
            </div>

            <form onSubmit={handleSaveMovementModal} className="space-y-4">
              <div className="p-3 bg-[#FAF5FB] rounded-xl border border-[#F0E8F2] flex items-center justify-between">
                <span className="text-xs text-[#7A7590]">Stock actual en bodega:</span>
                <span className="text-base font-extrabold text-[#6D4BB8]">
                  {movementModalProduct.stock} unidades
                </span>
              </div>

              {/* Movement Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2E2A3B]">Tipo de Movimiento</label>
                <select
                  value={movementType}
                  onChange={(e: any) => setMovementType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                >
                  <option value="entrada">Entrada (+) - Compra o reposición</option>
                  <option value="salida">Salida (-) - Venta directa o descarte</option>
                  <option value="ajuste">Ajuste (=) - Corrección por inventario físico</option>
                  <option value="devolucion">Devolución (+) - Reintegro de cliente</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2E2A3B]">
                  {movementType === "ajuste" ? "Nuevo Stock Exacto" : "Cantidad a mover"}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-bold"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2E2A3B]">Motivo / Justificación</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ej: Llegada de pedido proveedor Factura #123"
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMovementModalProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Guardar</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
