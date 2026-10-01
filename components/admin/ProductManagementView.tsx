"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit2,
  Check,
  X,
  Star,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  Loader2,
  UploadCloud,
  ChevronRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Product, Category } from "@/types";
import { formatCOP } from "@/lib/utils";
import { compressAndResizeImage } from "@/lib/image-compress";
import {
  saveProductAction,
  deleteProductAction,
  duplicateProductAction,
  toggleProductFieldAction,
  uploadProductImageAction,
  reorderProductsAction,
} from "@/app/actions/products";

interface ProductManagementViewProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ProductManagementView({
  initialProducts,
  categories,
}: ProductManagementViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedSubcategory, setSelectedSubcategory] = useState("todas");
  const [stockFilter, setStockFilter] = useState("todos");

  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete modal state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // Drag and Drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const canDragReorder = !search.trim() && stockFilter === "todos";

  const handleReorder = async (newFilteredList: Product[]) => {
    let newProductsOrder: Product[];
    if (selectedCategory === "todas") {
      newProductsOrder = newFilteredList;
    } else {
      const remaining = products.filter((p) => p.category_id !== selectedCategory);
      newProductsOrder = [...newFilteredList, ...remaining];
    }

    setProducts(newProductsOrder);
    setIsReordering(true);
    try {
      const res = await reorderProductsAction(newProductsOrder.map((p) => p.id));
      if (res.success) {
        showToast("Orden de productos actualizado");
      } else {
        showToast(res.error || "Error al actualizar orden", "error");
      }
    } catch (err: any) {
      showToast("Error al reordenar: " + err.message, "error");
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canDragReorder) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canDragReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!canDragReorder) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...filteredProducts];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);
    handleReorder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (!canDragReorder || index <= 0) return;
    const updated = [...filteredProducts];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    handleReorder(updated);
  };

  const handleMoveDown = (index: number) => {
    if (!canDragReorder || index >= filteredProducts.length - 1) return;
    const updated = [...filteredProducts];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    handleReorder(updated);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "todas" && p.category_id !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== "todas" && p.subcategory !== selectedSubcategory) {
        return false;
      }
      // Stock filter
      if (stockFilter === "disponibles" && p.stock <= 0) return false;
      if (stockFilter === "bajas" && (p.stock <= 0 || p.stock > p.low_stock_threshold)) return false;
      if (stockFilter === "agotadas" && p.stock > 0) return false;

      // Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.brand && p.brand.toLowerCase().includes(query)) ||
          p.detail.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [products, selectedCategory, stockFilter, search]);

  const handleOpenCreate = () => {
    setEditingProduct({
      name: "",
      slug: "",
      description: "",
      detail: "",
      category_id: categories[0]?.id || "",
      subcategory: "",
      brand: "",
      sku: `ALY-${Math.floor(100 + Math.random() * 900)}`,
      price: 25000,
      compare_price: 32000,
      cost: 12000,
      stock: 10,
      low_stock_threshold: 3,
      is_active: true,
      is_featured: false,
      images: [],
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct({
      ...product,
      subcategory: product.subcategory || "",
    });
    setIsDrawerOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setEditingProduct((prev) => (prev ? { ...prev, name, slug: prev.id ? prev.slug : slug } : null));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    if ((editingProduct.images?.length || 0) >= 5) {
      showToast("Máximo 5 imágenes por producto", "error");
      return;
    }

    try {
      setIsUploadingImage(true);
      // 1. Client canvas compression
      const { file: compressedFile, dataUrl } = await compressAndResizeImage(file, 1000, 1000, 0.85);

      // 2. Upload
      const formData = new FormData();
      formData.append("file", compressedFile);

      const result = await uploadProductImageAction(formData);
      const finalUrl = result.url || dataUrl;

      const newImage = {
        id: `img-${Date.now()}`,
        url: finalUrl,
        sort_order: (editingProduct.images?.length || 0) + 1,
        is_primary: (editingProduct.images?.length || 0) === 0,
      };

      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              images: [...(prev.images || []), newImage],
            }
          : null
      );
      showToast("Imagen subida con éxito");
    } catch (err: any) {
      showToast("Error al subir imagen: " + err.message, "error");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (!editingProduct?.images) return;
    const updated = editingProduct.images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    setEditingProduct({ ...editingProduct, images: updated });
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct?.images) return;
    const updated = editingProduct.images.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((i) => i.is_primary)) {
      updated[0].is_primary = true;
    }
    setEditingProduct({ ...editingProduct, images: updated });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim()) {
      showToast("El nombre del producto es obligatorio", "error");
      return;
    }

    try {
      setIsSaving(true);
      const cat = categories.find((c) => c.id === editingProduct.category_id);
      const payload: Partial<Product> = {
        ...editingProduct,
        category_name: cat?.name || "",
      };

      const result = await saveProductAction(payload);
      if (result.success && result.product) {
        showToast("Producto guardado exitosamente");
        // Update local state
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p.id === result.product!.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = result.product!;
            return copy;
          }
          return [result.product!, ...prev];
        });
        setIsDrawerOpen(false);
      } else {
        showToast(result.error || "Error al guardar producto", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (productId: string, field: "is_active" | "is_featured", currentVal: boolean) => {
    const nextVal = !currentVal;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: nextVal } : p))
    );

    const res = await toggleProductFieldAction(productId, field, nextVal);
    if (!res.success) {
      showToast("No se pudo actualizar el estado", "error");
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, [field]: currentVal } : p))
      );
    } else {
      showToast(field === "is_active" ? "Estado activo actualizado" : "Estado destacado actualizado");
    }
  };

  const handleDuplicate = async (productId: string) => {
    const res = await duplicateProductAction(productId);
    if (res.success) {
      showToast("Producto duplicado exitosamente");
      window.location.reload();
    } else {
      showToast(res.error || "Error al duplicar", "error");
    }
  };

  const handleDeleteConfirm = async (deactivateOnly: boolean) => {
    if (!deletingProductId) return;
    const res = await deleteProductAction(deletingProductId, deactivateOnly);
    if (res.success) {
      if (deactivateOnly) {
        setProducts((prev) =>
          prev.map((p) => (p.id === deletingProductId ? { ...p, is_active: false } : p))
        );
        showToast("Producto desactivado correctamente");
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== deletingProductId));
        showToast("Producto eliminado del catálogo");
      }
      setDeletingProductId(null);
    } else {
      showToast(res.error || "Error al eliminar", "error");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Nombre",
      "Slug",
      "Categoría",
      "Precio",
      "Precio_Comparación",
      "Costo",
      "Stock",
      "SKU",
      "Detalle",
      "Activo",
      "Destacado",
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.slug}"`,
      `"${p.category_name || ""}"`,
      p.price,
      p.compare_price || "",
      p.cost || "",
      p.stock,
      `"${p.sku || ""}"`,
      `"${p.detail || ""}"`,
      p.is_active ? "SI" : "NO",
      p.is_featured ? "SI" : "NO",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `productos_alyshop_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exportado correctamente");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            notification.type === "success"
              ? "bg-[#6D4BB8] text-white border-[#5837A3]"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {notification.type === "success" ? (
            <Check className="w-4 h-4 text-[#F472A8]" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F0E8F2]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2E2A3B] tracking-tight">
            Gestión de Productos
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590]">
            Administra el catálogo de alyshop: precios, imágenes, inventario y destacados.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#F0E8F2] text-xs font-bold text-[#2E2A3B] shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#6D4BB8]" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F0E8F2] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#7A7590] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("todas");
            }}
            className="text-xs font-semibold text-[#2E2A3B] bg-[#FAF5FB] border border-[#F0E8F2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F472A8] cursor-pointer"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subcategory Filter (when category is selected and has subcategories) */}
          {(() => {
            const catObj = categories.find((c) => c.id === selectedCategory);
            if (catObj && catObj.subcategories && catObj.subcategories.length > 0) {
              return (
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="text-xs font-semibold text-[#6D4BB8] bg-[#EEEAFB] border border-[#E0D4F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#6D4BB8] cursor-pointer"
                >
                  <option value="todas">Todas las subcategorías</option>
                  {catObj.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              );
            }
            return null;
          })()}

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="text-xs font-semibold text-[#2E2A3B] bg-[#FAF5FB] border border-[#F0E8F2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F472A8] cursor-pointer"
          >
            <option value="todos">Todos los stocks</option>
            <option value="disponibles">Con stock (&gt;0)</option>
            <option value="bajas">Pocas unidades (&le;umbral)</option>
            <option value="agotadas">Agotados (0)</option>
          </select>
        </div>
      </div>

      {/* Tip Banner for Drag and Drop */}
      <div className="flex items-center justify-between gap-3 text-xs text-[#7A7590] bg-[#FAF5FB] border border-[#F0E8F2] px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[#6D4BB8] shrink-0" />
          <span>
            {canDragReorder ? (
              <>
                <strong>Orden interactivo de productos:</strong> Arrastra las filas o usa las flechas (▲ / ▼) para fijar el orden de aparición en la tienda. Se renumera solo sin duplicados.
              </>
            ) : (
              <>
                <strong>Modo de filtro activo:</strong> Para reordenar productos arrastrando, desactiva la búsqueda y pon el filtro de stock en &quot;Todos los stocks&quot;.
              </>
            )}
          </span>
        </div>
        {isReordering && (
          <span className="flex items-center gap-1.5 text-[#6D4BB8] font-bold text-[11px] shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Guardando orden...
          </span>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FAF5FB] border-b border-[#F0E8F2] text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                <th className="py-3 px-4 text-center w-24">Orden</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Precio (COP)</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Activo</th>
                <th className="py-3 px-4 text-center">Destacado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2F9]">
              {filteredProducts.map((p, index) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = !isOutOfStock && p.stock <= p.low_stock_threshold;
                const primaryImg = p.images[0]?.url || "/placeholder.png";
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index;

                return (
                  <tr
                    key={p.id}
                    draggable={canDragReorder}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all select-none ${
                      isDragging
                        ? "opacity-30 bg-[#FAF5FB]"
                        : isDropTarget
                        ? "border-t-2 border-[#6D4BB8] bg-[#EEEAFB]/40"
                        : "hover:bg-[#FFFBF7]/80"
                    }`}
                  >
                    {/* Interactive Order & Drag Handle */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className={`p-1 text-[#7A7590] rounded-md transition-colors ${
                            canDragReorder
                              ? "cursor-grab active:cursor-grabbing hover:text-[#6D4BB8] hover:bg-[#EEEAFB]"
                              : "opacity-30 cursor-not-allowed"
                          }`}
                          title={canDragReorder ? "Arrastra para cambiar orden" : "Limpia filtros para reordenar"}
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[#6D4BB8] min-w-6 text-center text-xs bg-[#EEEAFB] px-2 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(index);
                            }}
                            disabled={!canDragReorder || index === 0}
                            className="p-0.5 text-[#7A7590] hover:text-[#6D4BB8] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Subir posición"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveDown(index);
                            }}
                            disabled={!canDragReorder || index === filteredProducts.length - 1}
                            className="p-0.5 text-[#7A7590] hover:text-[#6D4BB8] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Bajar posición"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    {/* Producto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF5FB] border border-[#F0E8F2] shrink-0">
                          <Image
                            src={primaryImg}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-[#2E2A3B] truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-[#7A7590]">
                            {p.detail && <span>{p.detail}</span>}
                            {p.sku && <span>• SKU: {p.sku}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría y Subcategoría */}
                    <td className="py-3 px-4 text-xs text-[#7A7590]">
                      <div className="space-y-1">
                        <span className="px-2.5 py-1 rounded-lg bg-[#EEEAFB] text-[#6D4BB8] font-semibold text-[11px] inline-block">
                          {p.category_name || "Sin categoría"}
                        </span>
                        {p.subcategory && (
                          <span className="block text-[10px] font-bold text-[#F472A8] bg-[#FCE4EF] px-2 py-0.5 rounded-md w-fit">
                            {p.subcategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2E2A3B]">{formatCOP(p.price)}</div>
                      {p.compare_price && (
                        <div className="text-[11px] text-[#7A7590] line-through">
                          {formatCOP(p.compare_price)}
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Agotado (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pocas ({p.stock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.stock} unid.
                        </span>
                      )}
                    </td>

                    {/* Activo switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "is_active", p.is_active)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors inline-flex items-center cursor-pointer ${
                          p.is_active ? "bg-[#28795A]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            p.is_active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Destacado switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "is_featured", p.is_featured)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          p.is_featured ? "text-[#F5A623]" : "text-gray-300 hover:text-gray-400"
                        }`}
                        title={p.is_featured ? "Producto destacado" : "Marcar como destacado"}
                      >
                        <Star className={`w-4 h-4 ${p.is_featured ? "fill-[#F5A623]" : ""}`} />
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#EEEAFB] rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#EEEAFB] rounded-lg transition-colors"
                          title="Duplicar producto"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProductId(p.id)}
                          className="p-1.5 text-[#7A7590] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar o desactivar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-[#7A7590] space-y-2">
            <Package className="w-8 h-8 mx-auto text-[#6D4BB8]/40" />
            <p className="text-sm font-semibold">No se encontraron productos con estos filtros</p>
            <p className="text-xs">Prueba borrando el término de búsqueda o cambiando de categoría.</p>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* DRAWER / MODAL: CREAR O EDITAR PRODUCTO */}
      {/* ================================================================= */}
      {isDrawerOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-20">
              <div>
                <h2 className="text-lg font-bold text-[#2E2A3B]">
                  {editingProduct.id ? "Editar Producto" : "Nuevo Producto"}
                </h2>
                <p className="text-xs text-[#7A7590]">
                  Completa los detalles, sube fotos y define precios y stock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-[#7A7590] hover:text-[#2E2A3B] rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 flex-1">
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                  Información Básica
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2E2A3B]">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Termo de acero inoxidable 500 ml"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">
                      Slug (URL amigable)
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.slug || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, slug: e.target.value })
                      }
                      placeholder="termo-de-acero-inoxidable-500-ml"
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">Categoría *</label>
                    <select
                      value={editingProduct.category_id || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category_id: e.target.value,
                          subcategory: "",
                        })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subcategoría selector (si la categoría seleccionada tiene subcategorías) */}
                {(() => {
                  const currentCat = categories.find((c) => c.id === editingProduct.category_id);
                  if (currentCat && currentCat.subcategories && currentCat.subcategories.length > 0) {
                    return (
                      <div className="space-y-1 p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]">
                        <label className="text-xs font-semibold text-[#2E2A3B] flex items-center justify-between">
                          <span>Subcategoría (Opcional)</span>
                          <span className="text-[10px] text-[#6D4BB8] font-bold">No obligatorio</span>
                        </label>
                        <select
                          value={editingProduct.subcategory || ""}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, subcategory: e.target.value })
                          }
                          className="w-full text-xs p-2.5 rounded-lg bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8]"
                        >
                          <option value="">Sin subcategoría (General)</option>
                          {currentCat.subcategories.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">
                      Detalle corto / variante
                    </label>
                    <input
                      type="text"
                      value={editingProduct.detail || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, detail: e.target.value })
                      }
                      placeholder="Ej: 500 ml, x5 unidades, Rojo"
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">Marca</label>
                    <input
                      type="text"
                      value={editingProduct.brand || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, brand: e.target.value })
                      }
                      placeholder="Ej: AlyHome"
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2E2A3B]">Descripción</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    placeholder="Detalles sobre materiales, uso, garantía..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4 pt-4 border-t border-[#F0E8F2]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                  Precios e Inventario
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">Precio Venta (COP) *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price ?? ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">
                      Precio Comparación (Tachado)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.compare_price ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          compare_price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">Costo Interno (Opcional)</label>
                    <input
                      type="number"
                      value={editingProduct.cost ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          cost: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">Stock Actual *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.stock ?? 0}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">Umbral Stock Bajo</label>
                    <input
                      type="number"
                      value={editingProduct.low_stock_threshold ?? 3}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          low_stock_threshold: Number(e.target.value),
                        })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">SKU</label>
                    <input
                      type="text"
                      value={editingProduct.sku || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, sku: e.target.value })
                      }
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                    />
                  </div>
                </div>
              </div>

              {/* Images Gallery */}
              <div className="space-y-3 pt-4 border-t border-[#F0E8F2]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                    Imágenes del Producto ({editingProduct.images?.length || 0} / 5)
                  </h3>
                  <span className="text-[11px] text-[#7A7590]">
                    Se comprimen automáticamente antes de subir
                  </span>
                </div>

                {/* Images list */}
                <div className="grid grid-cols-5 gap-3">
                  {(editingProduct.images || []).map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 group ${
                        img.is_primary ? "border-[#F472A8] ring-2 ring-[#FCE4EF]" : "border-[#F0E8F2]"
                      }`}
                    >
                      <Image src={img.url} alt="Producto" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="p-1 rounded bg-white text-xs text-[#2E2A3B] hover:text-[#6D4BB8]"
                          title="Marcar principal"
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded bg-white text-xs text-rose-600 hover:bg-rose-50"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                      {img.is_primary && (
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-center bg-[#F472A8] text-white rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}

                  {(editingProduct.images?.length || 0) < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-[#F0E8F2] hover:border-[#F472A8] flex flex-col items-center justify-center gap-1 cursor-pointer bg-[#FAF5FB] hover:bg-[#FCE4EF]/20 transition-colors">
                      {isUploadingImage ? (
                        <Loader2 className="w-5 h-5 text-[#6D4BB8] animate-spin" />
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5 text-[#7A7590]" />
                          <span className="text-[10px] text-[#7A7590] font-semibold">Subir foto</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Switches: Activo / Destacado */}
              <div className="pt-4 border-t border-[#F0E8F2] flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-bold text-[#2E2A3B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#F472A8] accent-[#F472A8]"
                  />
                  <span>Producto Activo (Visible en tienda)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#2E2A3B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured ?? false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#F472A8] accent-[#F472A8]"
                  />
                  <span>Producto Destacado en Inicio</span>
                </label>
              </div>

              {/* Drawer Submit Buttons */}
              <div className="pt-6 border-t border-[#F0E8F2] flex gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Producto</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setDeletingProductId(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl z-10 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#2E2A3B]">¿Qué deseas hacer con el producto?</h3>
              <p className="text-xs text-[#7A7590]">
                Si el producto ya tiene pedidos asociados, se recomienda <strong>desactivarlo</strong> para mantener el historial intacto.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteConfirm(true)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Solo Desactivar (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(false)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Eliminar Permanentemente
              </button>
              <button
                type="button"
                onClick={() => setDeletingProductId(null)}
                className="w-full py-2 text-xs font-semibold text-[#7A7590] hover:text-[#2E2A3B]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
