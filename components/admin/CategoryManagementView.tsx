"use client";

import { useState, useMemo } from "react";
import { AdminPagination, PageSizeOption } from "./AdminPagination";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  FolderTree,
  Home,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Headphones,
  Gamepad2,
  BookOpen,
  Dumbbell,
  PawPrint,
  Grid,
  Gift,
  Tag,
  Heart,
  Loader2,
  ArrowRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Search,
  ArrowRightLeft,
  Layers,
  Filter,
} from "lucide-react";
import { Category, Product } from "@/types";
import {
  saveCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
  reorderCategoriesAction,
  bulkAddSubcategoryAction,
  validateAndSyncSubcategoriesAction,
} from "@/app/actions/categories";
import { isSubcategoryMatch, getCanonicalSubcategoryName } from "@/lib/subcategories";
import {
  uploadProductImageAction,
  bulkUpdateProductCategoryAction,
} from "@/app/actions/products";

import { PerfumeIcon } from "@/components/tienda/PerfumeIcon";

const AVAILABLE_ICONS = [
  { name: "Perfume", component: PerfumeIcon, label: "Perfumes" },
  { name: "Home", component: Home, label: "Hogar" },
  { name: "UtensilsCrossed", component: UtensilsCrossed, label: "Cocina" },
  { name: "Shirt", component: Shirt, label: "Ropa" },
  { name: "Sparkles", component: Sparkles, label: "Belleza" },
  { name: "Headphones", component: Headphones, label: "Tecnología" },
  { name: "Gamepad2", component: Gamepad2, label: "Juegos" },
  { name: "BookOpen", component: BookOpen, label: "Papelería" },
  { name: "Dumbbell", component: Dumbbell, label: "Deportes" },
  { name: "PawPrint", component: PawPrint, label: "Mascotas" },
  { name: "Grid", component: Grid, label: "General" },
  { name: "Gift", component: Gift, label: "Regalos" },
  { name: "Tag", component: Tag, label: "Ofertas" },
  { name: "Heart", component: Heart, label: "Favoritos" },
];

const PASTEL_COLORS = [
  { hex: "#FCE4EF", name: "Rosa Pastel" },
  { hex: "#EEEAFB", name: "Lila Pastel" },
  { hex: "#DDF3EC", name: "Menta Pastel" },
  { hex: "#FDE8DD", name: "Durazno Pastel" },
  { hex: "#E0EEFB", name: "Celeste Pastel" },
  { hex: "#FFF1CC", name: "Amarillo Pastel" },
];

interface CategoryManagementViewProps {
  initialCategories: Category[];
  products: Product[];
}

export function CategoryManagementView({
  initialCategories,
  products,
}: CategoryManagementViewProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  const paginatedCategories = useMemo(() => {
    if (pageSize === "all") return categories;
    const start = (currentPage - 1) * (pageSize as number);
    return categories.slice(start, start + (pageSize as number));
  }, [categories, currentPage, pageSize]);

  // Category Multi-selection state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignSourceCategoryId, setReassignSourceCategoryId] = useState<string>("all");
  const [reassignSearch, setReassignSearch] = useState("");
  const [reassignSubFilter, setReassignSubFilter] = useState("all");
  const [reassignSelectedProductIds, setReassignSelectedProductIds] = useState<string[]>([]);
  const [reassignTargetCategoryId, setReassignTargetCategoryId] = useState<string>("");
  const [reassignTargetSubcategory, setReassignTargetSubcategory] = useState<string>("");
  const [reassignCustomSubcategory, setReassignCustomSubcategory] = useState<string>("");
  const [reassignMode, setReassignMode] = useState<"all" | "category_only" | "subcategory_only">("all");
  const [isExecutingReassign, setIsExecutingReassign] = useState(false);

  // Bulk Add Subcategory Modal State
  const [isBulkAddSubModalOpen, setIsBulkAddSubModalOpen] = useState(false);
  const [bulkAddSubInput, setBulkAddSubInput] = useState("");
  const [isSavingBulkAddSub, setIsSavingBulkAddSub] = useState(false);

  // Subcategory Sync State
  const [isValidatingSubs, setIsValidatingSubs] = useState(false);

  const handleValidateAndSyncSubs = async () => {
    try {
      setIsValidatingSubs(true);
      const res = await validateAndSyncSubcategoriesAction();
      if (res.success) {
        if (res.categories) {
          setCategories(res.categories);
        }
        setLocalProducts((prev) =>
          prev.map((p) => ({
            ...p,
            subcategory: p.subcategory ? getCanonicalSubcategoryName(p.subcategory) : "",
          }))
        );
        showToast(
          res.fixedCount > 0
            ? `¡Se validaron y sincronizaron ${res.fixedCount} subcategorías con éxito!`
            : "¡Todas las subcategorías ya se encuentran perfectamente sincronizadas!"
        );
      } else {
        showToast(res.error || "Error al sincronizar subcategorías", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error al sincronizar", "error");
    } finally {
      setIsValidatingSubs(false);
    }
  };

  const totalProductsInSelected = useMemo(() => {
    return localProducts.filter((p) => selectedCategoryIds.includes(p.category_id)).length;
  }, [localProducts, selectedCategoryIds]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryIconTab, setCategoryIconTab] = useState<"icon" | "png">("icon");
  const [isUploadingCategoryIcon, setIsUploadingCategoryIcon] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUploadCategoryIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCategoryIcon(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadProductImageAction(formData);
      if (res.success && res.url) {
        setEditingCategory((prev) => (prev ? { ...prev, image_url: res.url } : null));
        setCategoryIconTab("png");
        showToast("Logo PNG de categoría subido correctamente");
      } else {
        showToast(res.error || "Error al subir la imagen", "error");
      }
    } catch {
      showToast("Error inesperado al subir imagen", "error");
    } finally {
      setIsUploadingCategoryIcon(false);
    }
  };

  // Delete modal with move products support
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [targetMoveCategoryId, setTargetMoveCategoryId] = useState<string>("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async (newList: Category[]) => {
    const updated = newList.map((cat, idx) => ({
      ...cat,
      sort_order: idx + 1,
    }));
    setCategories(updated);
    setIsReordering(true);
    try {
      const res = await reorderCategoriesAction(updated.map((c) => c.id));
      if (res.success) {
        showToast("Orden de categorías actualizado");
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
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...categories];
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
    if (index <= 0) return;
    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    handleReorder(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    handleReorder(updated);
  };

  const getProductsCountForCategory = (catId: string) => {
    return localProducts.filter((p) => p.category_id === catId).length;
  };

  // Reassignment handlers
  const handleOpenReassignModal = (sourceCatId?: string) => {
    const defaultSource = sourceCatId
      ? sourceCatId
      : selectedCategoryIds.length === 1
      ? selectedCategoryIds[0]
      : "all";
    setReassignSourceCategoryId(defaultSource);
    setReassignSearch("");
    setReassignSubFilter("all");
    setReassignSelectedProductIds([]);

    const targetCandidate = categories.find((c) => c.id !== defaultSource) || categories[0];
    setReassignTargetCategoryId(targetCandidate?.id || "");
    setReassignTargetSubcategory("");
    setReassignCustomSubcategory("");
    setReassignMode("all");
    setIsReassignModalOpen(true);
  };

  const reassignFilteredProducts = useMemo(() => {
    return localProducts.filter((p) => {
      // Source filter
      if (reassignSourceCategoryId !== "all") {
        if (p.category_id !== reassignSourceCategoryId) return false;
      } else if (selectedCategoryIds.length > 0) {
        // If "all" is selected but categories were checked in table, restrict to those checked
        if (!selectedCategoryIds.includes(p.category_id)) return false;
      }

      // Subcategory filter
      if (reassignSubFilter !== "all") {
        if (reassignSubFilter === "__empty__") {
          if (p.subcategory && p.subcategory.trim()) return false;
        } else if (!isSubcategoryMatch(p.subcategory, reassignSubFilter)) {
          return false;
        }
      }

      // Search filter
      if (reassignSearch.trim()) {
        const query = reassignSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(query) : false;
        const matchesSub = p.subcategory ? p.subcategory.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesSku && !matchesSub) return false;
      }

      return true;
    });
  }, [localProducts, reassignSourceCategoryId, selectedCategoryIds, reassignSubFilter, reassignSearch]);

  const handleSelectAllReassignProducts = () => {
    if (reassignSelectedProductIds.length === reassignFilteredProducts.length) {
      setReassignSelectedProductIds([]);
    } else {
      setReassignSelectedProductIds(reassignFilteredProducts.map((p) => p.id));
    }
  };

  const handleToggleReassignProduct = (id: string) => {
    setReassignSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirmReassign = async () => {
    if (reassignSelectedProductIds.length === 0) {
      showToast("Selecciona al menos un producto para reasignar", "error");
      return;
    }

    if (reassignMode !== "subcategory_only" && !reassignTargetCategoryId) {
      showToast("Selecciona la categoría de destino", "error");
      return;
    }

    const finalSub =
      reassignTargetSubcategory === "__custom__"
        ? reassignCustomSubcategory.trim()
        : reassignTargetSubcategory.trim();

    try {
      setIsExecutingReassign(true);
      const res = await bulkUpdateProductCategoryAction(
        reassignSelectedProductIds,
        reassignTargetCategoryId,
        finalSub,
        reassignMode === "category_only",
        reassignMode === "subcategory_only"
      );

      if (res.success) {
        // Update localProducts
        setLocalProducts((prev) =>
          prev.map((p) => {
            if (reassignSelectedProductIds.includes(p.id)) {
              const targetCat = categories.find((c) => c.id === reassignTargetCategoryId);
              return {
                ...p,
                category_id:
                  reassignMode === "subcategory_only" ? p.category_id : reassignTargetCategoryId,
                category_name:
                  reassignMode === "subcategory_only"
                    ? p.category_name
                    : targetCat?.name || p.category_name,
                subcategory: reassignMode === "category_only" ? p.subcategory : finalSub,
              };
            }
            return p;
          })
        );

        // If custom subcategory was entered, add to category in memory
        if (finalSub && reassignTargetCategoryId) {
          setCategories((prev) =>
            prev.map((c) => {
              if (c.id === reassignTargetCategoryId) {
                const existing = c.subcategories || [];
                if (!existing.includes(finalSub)) {
                  return { ...c, subcategories: [...existing, finalSub] };
                }
              }
              return c;
            })
          );
        }

        showToast(
          `¡${reassignSelectedProductIds.length} producto(s) actualizados correctamente!`
        );
        setIsReassignModalOpen(false);
        setReassignSelectedProductIds([]);
      } else {
        showToast(res.error || "Error al reasignar productos", "error");
      }
    } catch (err: any) {
      showToast("Error inesperado: " + err.message, "error");
    } finally {
      setIsExecutingReassign(false);
    }
  };

  const handleConfirmBulkAddSubcategory = async () => {
    const trimmed = bulkAddSubInput.trim();
    if (!trimmed) {
      showToast("Escribe el nombre de la subcategoría", "error");
      return;
    }
    if (selectedCategoryIds.length === 0) {
      showToast("Selecciona al menos una categoría", "error");
      return;
    }

    try {
      setIsSavingBulkAddSub(true);
      const res = await bulkAddSubcategoryAction(selectedCategoryIds, trimmed);
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => {
            if (selectedCategoryIds.includes(c.id)) {
              const subs = c.subcategories || [];
              if (!subs.includes(trimmed)) {
                return { ...c, subcategories: [...subs, trimmed] };
              }
            }
            return c;
          })
        );
        showToast(
          `Subcategoría "${trimmed}" agregada a ${selectedCategoryIds.length} categoría(s)`
        );
        setIsBulkAddSubModalOpen(false);
        setBulkAddSubInput("");
      } else {
        showToast(res.error || "Error al agregar subcategoría", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSavingBulkAddSub(false);
    }
  };

  const [newSubcategoryInput, setNewSubcategoryInput] = useState("");

  const handleAddSubcategory = () => {
    const trimmed = newSubcategoryInput.trim();
    if (!trimmed || !editingCategory) return;
    const current = editingCategory.subcategories || [];
    if (current.includes(trimmed)) {
      showToast("Esa subcategoría ya existe", "error");
      return;
    }
    setEditingCategory({
      ...editingCategory,
      subcategories: [...current, trimmed],
    });
    setNewSubcategoryInput("");
  };

  const handleRemoveSubcategory = (index: number) => {
    if (!editingCategory?.subcategories) return;
    const current = [...editingCategory.subcategories];
    current.splice(index, 1);
    setEditingCategory({
      ...editingCategory,
      subcategories: current,
    });
  };

  const handleOpenCreate = () => {
    setEditingCategory({
      name: "",
      slug: "",
      icon: "Grid",
      color: "#FCE4EF",
      sort_order: categories.length + 1,
      is_active: true,
      subcategories: [],
      image_url: undefined,
    });
    setCategoryIconTab("icon");
    setNewSubcategoryInput("");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory({
      ...category,
      subcategories: category.subcategories || [],
    });
    setCategoryIconTab(category.image_url ? "png" : "icon");
    setNewSubcategoryInput("");
    setIsDrawerOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setEditingCategory((prev) =>
      prev ? { ...prev, name, slug: prev.id ? prev.slug : slug } : null
    );
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) {
      showToast("El nombre de la categoría es obligatorio", "error");
      return;
    }

    try {
      setIsSaving(true);
      const res = await saveCategoryAction(editingCategory);
      if (res.success && res.category) {
        showToast("Categoría guardada exitosamente");
        setCategories((prev) => {
          const idx = prev.findIndex((c) => c.id === res.category!.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = res.category!;
            return copy;
          }
          return [...prev, res.category!];
        });
        setIsDrawerOpen(false);
      } else {
        showToast(res.error || "Error al guardar categoría", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (categoryId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, is_active: nextVal } : c))
    );

    const res = await toggleCategoryStatusAction(categoryId, nextVal);
    if (!res.success) {
      showToast("No se pudo actualizar el estado", "error");
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, is_active: currentVal } : c))
      );
    } else {
      showToast("Estado actualizado correctamente");
    }
  };

  const handleDeleteClick = (category: Category) => {
    const assignedProductsCount = getProductsCountForCategory(category.id);
    setDeletingCategory(category);
    if (assignedProductsCount > 0) {
      // pre-select another category
      const other = categories.find((c) => c.id !== category.id);
      setTargetMoveCategoryId(other?.id || "");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    const count = getProductsCountForCategory(deletingCategory.id);

    if (count > 0 && !targetMoveCategoryId) {
      showToast("Selecciona a qué categoría transferir los productos", "error");
      return;
    }

    const res = await deleteCategoryAction(
      deletingCategory.id,
      count > 0 ? targetMoveCategoryId : undefined
    );

    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showToast(
        count > 0
          ? `Categoría eliminada y ${count} producto(s) reasignados`
          : "Categoría eliminada exitosamente"
      );
      setDeletingCategory(null);
    } else {
      showToast(res.error || "Error al eliminar categoría", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
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
            Gestión de Categorías
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590]">
            Organiza las secciones del menú, íconos lineales y colores pastel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={isValidatingSubs}
            onClick={handleValidateAndSyncSubs}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6D4BB8] border border-purple-200 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Validar y sincronizar todas las subcategorías con sus categorías correspondientes"
          >
            {isValidatingSubs ? (
              <Loader2 className="w-4 h-4 text-[#6D4BB8] animate-spin" />
            ) : (
              <Layers className="w-4 h-4 text-[#6D4BB8]" />
            )}
            <span>Sincronizar Subcategorías</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenReassignModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF5FB] text-[#6D4BB8] border border-[#6D4BB8]/30 hover:border-[#6D4BB8] text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Mover o reasignar productos que quedaron en la categoría incorrecta"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#6D4BB8]" />
            <span>Reasignar Productos</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Tip Banner for Drag and Drop */}
      <div className="flex items-center justify-between gap-3 text-xs text-[#7A7590] bg-[#FAF5FB] border border-[#F0E8F2] px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[#6D4BB8] shrink-0" />
          <span>
            <strong>Orden interactivo:</strong> Arrastra las filas o usa las flechas (▲ / ▼) para definir la posición exacta en la tienda. Los números se ajustan solos sin duplicados.
          </span>
        </div>
        {isReordering && (
          <span className="flex items-center gap-1.5 text-[#6D4BB8] font-bold text-[11px] shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Guardando orden...
          </span>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FAF5FB] border-b border-[#F0E8F2] text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedCategories.length > 0 &&
                      paginatedCategories.every((c) => selectedCategoryIds.includes(c.id))
                    }
                    onChange={() => {
                      const pageIds = paginatedCategories.map((c) => c.id);
                      const allSelected = pageIds.every((id) => selectedCategoryIds.includes(id));
                      if (allSelected) {
                        setSelectedCategoryIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                      } else {
                        setSelectedCategoryIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                      }
                    }}
                    className="w-4 h-4 rounded text-[#6D4BB8] accent-[#6D4BB8] cursor-pointer"
                    title="Seleccionar todas las categorías visibles"
                  />
                </th>
                <th className="py-3 px-3 text-center w-20">Orden</th>
                <th className="py-3 px-4">Ícono / Color</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4 text-center">Productos</th>
                <th className="py-3 px-4 text-center">Activo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2F9]">
              {paginatedCategories.map((cat, index) => {
                const globalIndex = pageSize === "all" ? index : (currentPage - 1) * (pageSize as number) + index;
                const iconObj = AVAILABLE_ICONS.find((i) => i.name === cat.icon) || AVAILABLE_ICONS[0];
                const IconComponent = iconObj.component;
                const count = getProductsCountForCategory(cat.id);
                const isDragging = draggedIndex === globalIndex;
                const isDropTarget = dragOverIndex === globalIndex;
                const isCategorySelected = selectedCategoryIds.includes(cat.id);

                return (
                  <tr
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, globalIndex)}
                    onDragOver={(e) => handleDragOver(e, globalIndex)}
                    onDrop={(e) => handleDrop(e, globalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all select-none ${
                      isDragging
                        ? "opacity-30 bg-[#FAF5FB]"
                        : isDropTarget
                        ? "border-t-2 border-[#6D4BB8] bg-[#EEEAFB]/40"
                        : isCategorySelected
                        ? "bg-[#FAF5FB]/80 border-l-4 border-l-[#6D4BB8]"
                        : "hover:bg-[#FFFBF7]/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isCategorySelected}
                        onChange={() => {
                          setSelectedCategoryIds((prev) =>
                            prev.includes(cat.id)
                              ? prev.filter((id) => id !== cat.id)
                              : [...prev, cat.id]
                          );
                        }}
                        className="w-4 h-4 rounded text-[#6D4BB8] accent-[#6D4BB8] cursor-pointer"
                      />
                    </td>

                    {/* Interactive Order & Drag Handle */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#EEEAFB] rounded-md transition-colors"
                          title="Arrastra para cambiar orden"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[#6D4BB8] min-w-6 text-center text-xs bg-[#EEEAFB] px-2 py-0.5 rounded-full">
                          #{globalIndex + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(globalIndex);
                            }}
                            disabled={globalIndex === 0}
                            className="p-0.5 text-[#7A7590] hover:text-[#6D4BB8] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Subir posición"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveDown(globalIndex);
                            }}
                            disabled={globalIndex === categories.length - 1}
                            className="p-0.5 text-[#7A7590] hover:text-[#6D4BB8] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Bajar posición"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Icon & Color Badge */}
                    <td className="py-3 px-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/5 shadow-2xs overflow-hidden"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <IconComponent className="w-5 h-5 text-[#6D4BB8]" strokeWidth={1.6} />
                        )}
                      </div>
                    </td>

                    {/* Name and Subcategories */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#2E2A3B]">{cat.name}</p>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cat.subcategories.map((sub) => (
                            <span
                              key={sub}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF5FB] border border-[#F0E8F2] text-[#6D4BB8] font-medium"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 text-xs font-mono text-[#7A7590]">
                      {cat.slug}
                    </td>

                    {/* Assigned Products Count - Interactive */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenReassignModal(cat.id)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5FB] hover:bg-[#EEEAFB] border border-[#F0E8F2] hover:border-[#6D4BB8]/40 text-[#2E2A3B] hover:text-[#6D4BB8] transition-all cursor-pointer"
                        title={`Reasignar o mover los ${count} productos de "${cat.name}"`}
                      >
                        <span>{count} productos</span>
                        <ArrowRightLeft className="w-3 h-3 text-[#7A7590] group-hover:text-[#6D4BB8] transition-colors" />
                      </button>
                    </td>

                    {/* Active toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(cat.id, cat.is_active)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors inline-flex items-center cursor-pointer ${
                          cat.is_active ? "bg-[#28795A]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            cat.is_active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#EEEAFB] rounded-lg transition-colors cursor-pointer"
                          title="Editar categoría"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(cat)}
                          className="p-1.5 text-[#7A7590] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar categoría"
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

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalItems={categories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="categorías"
        />
      </div>

      {/* ================================================================= */}
      {/* DRAWER: CREAR O EDITAR CATEGORÍA */}
      {/* ================================================================= */}
      {isDrawerOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between sticky top-0 bg-white z-20">
              <h2 className="text-base font-bold text-[#2E2A3B]">
                {editingCategory.id ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-[#7A7590] hover:text-[#2E2A3B] rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-6 flex-1">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2E2A3B]">
                    Nombre de la categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Cocina y comedor"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2E2A3B]">
                    Slug (URL de navegación) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.slug || ""}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, slug: e.target.value })
                    }
                    placeholder="cocina-y-comedor"
                    className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] font-mono"
                  />
                </div>

                {/* Selector de Ícono o Imagen PNG Personalizada */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#2E2A3B]">
                      Logo o Ícono de la Categoría
                    </label>
                    <div className="flex items-center bg-white rounded-xl p-0.5 border border-[#F0E8F2] text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setCategoryIconTab("icon")}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          categoryIconTab === "icon"
                            ? "bg-[#6D4BB8] text-white shadow-xs"
                            : "text-[#7A7590] hover:text-[#2E2A3B]"
                        }`}
                      >
                        Ícono Lucide
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryIconTab("png")}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          categoryIconTab === "png"
                            ? "bg-[#6D4BB8] text-white shadow-xs"
                            : "text-[#7A7590] hover:text-[#2E2A3B]"
                        }`}
                      >
                        Subir PNG / Imagen
                      </button>
                    </div>
                  </div>

                  {/* Vista Previa del Ícono con su Color de Fondo */}
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#F0E8F2]">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border border-black/5 shadow-2xs overflow-hidden shrink-0"
                      style={{ backgroundColor: editingCategory.color || "#FCE4EF" }}
                    >
                      {editingCategory.image_url ? (
                        <img
                          src={editingCategory.image_url}
                          alt="Previa logo categoría"
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        (() => {
                          const IconComp = (AVAILABLE_ICONS.find((i) => i.name === editingCategory.icon) || AVAILABLE_ICONS[0]).component;
                          return <IconComp className="w-6 h-6 text-[#6D4BB8]" strokeWidth={1.5} />;
                        })()
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-[#2E2A3B]">
                        {editingCategory.image_url ? "Logo PNG personalizado activo" : `Ícono lineal: ${editingCategory.icon || "Grid"}`}
                      </p>
                      <p className="text-[11px] text-[#7A7590]">
                        Se muestra con el color de fondo elegido
                      </p>
                    </div>
                    {editingCategory.image_url && (
                      <button
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, image_url: undefined })}
                        className="ml-auto text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Quitar PNG
                      </button>
                    )}
                  </div>

                  {categoryIconTab === "icon" ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-[#7A7590]">Elige un ícono de la librería:</p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
                        {AVAILABLE_ICONS.map((i) => {
                          const IconComp = i.component;
                          const isSelected = editingCategory.icon === i.name && !editingCategory.image_url;
                          return (
                            <button
                              key={i.name}
                              type="button"
                              onClick={() => setEditingCategory({ ...editingCategory, icon: i.name, image_url: undefined })}
                              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[#6D4BB8] bg-[#EEEAFB] text-[#6D4BB8] shadow-xs"
                                  : "border-[#F0E8F2] bg-white hover:bg-gray-50 text-[#7A7590]"
                              }`}
                            >
                              <IconComp className="w-5 h-5" strokeWidth={1.5} />
                              <span className="text-[10px] truncate max-w-full">{i.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#F0E8F2]">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#7A7590] uppercase block">
                          Subir Archivo PNG / SVG
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#F0E8F2] hover:border-[#6D4BB8] rounded-xl bg-[#FAF5FB] hover:bg-[#EEEAFB]/30 transition-colors">
                            {isUploadingCategoryIcon ? (
                              <Loader2 className="w-4 h-4 text-[#6D4BB8] animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 text-[#6D4BB8]" />
                            )}
                            <span className="text-xs font-semibold text-[#6D4BB8]">
                              {isUploadingCategoryIcon ? "Subiendo imagen PNG..." : "Seleccionar imagen PNG desde tu equipo"}
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/webp,image/jpeg"
                              disabled={isUploadingCategoryIcon}
                              onChange={handleUploadCategoryIcon}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-[#7A7590] mt-1">
                          Recomendado: archivo PNG con fondo transparente, dimensiones cuadradas (128x128 o 256x256 px).
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#7A7590] uppercase block">
                          O ingresa la URL directa de la imagen
                        </label>
                        <input
                          type="url"
                          value={editingCategory.image_url || ""}
                          onChange={(e) => setEditingCategory({ ...editingCategory, image_url: e.target.value })}
                          placeholder="https://ejemplo.com/icono-perfume.png"
                          className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Color Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#2E2A3B]">
                    Color Pastel de Fondo
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PASTEL_COLORS.map((c) => {
                      const isSelected = editingCategory.color === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setEditingCategory({ ...editingCategory, color: c.hex })}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            isSelected ? "ring-2 ring-[#6D4BB8] ring-offset-2" : "border-black/5"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          <span className="text-[9px] font-bold text-[#2E2A3B]">{c.name.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subcategorías (Opcionales) */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#2E2A3B]">
                      Subcategorías (Opcional)
                    </label>
                    <span className="text-[10px] text-[#7A7590] bg-white px-2 py-0.5 rounded-full border border-[#F0E8F2]">
                      {editingCategory.subcategories?.length || 0} agregadas
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A7590]">
                    Crea subdivisiones para organizar productos dentro de esta categoría (ej: Hombre, Mujer, Splash).
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcategoryInput}
                      onChange={(e) => setNewSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                      placeholder="Ej: Hombre, Mujer, Unisex..."
                      className="flex-1 text-xs p-2.5 rounded-xl bg-white border border-[#F0E8F2] focus:outline-none focus:border-[#6D4BB8]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="px-3 py-2 bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      + Agregar
                    </button>
                  </div>

                  {/* Chips de subcategorías */}
                  {editingCategory.subcategories && editingCategory.subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editingCategory.subcategories.map((sub, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E4D9EB] text-xs font-medium text-[#6D4BB8]"
                        >
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(idx)}
                            className="text-gray-400 hover:text-rose-600 rounded-full cursor-pointer"
                            title="Quitar subcategoría"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic pt-1">
                      Sin subcategorías (los productos se mostrarán directamente en la categoría principal).
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#2E2A3B]">
                    <span>Orden en la tienda</span>
                    <span className="font-bold text-[#6D4BB8] bg-[#EEEAFB] px-2.5 py-0.5 rounded-full">
                      Posición #{editingCategory.sort_order ?? categories.length + 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A7590]">
                    El orden se organiza automáticamente arrastrando las categorías en la tabla o con las flechas, evitando números duplicados.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-[#2E2A3B] cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={editingCategory.is_active ?? true}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#F472A8] accent-[#F472A8]"
                  />
                  <span>Categoría Activa (Visible en tienda)</span>
                </label>
              </div>

              <div className="pt-6 border-t border-[#F0E8F2] flex gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Guardar</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ELIMINAR CATEGORÍA & REASIGNAR PRODUCTOS */}
      {/* ================================================================= */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setDeletingCategory(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl z-10 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#2E2A3B]">
                Eliminar categoría &quot;{deletingCategory.name}&quot;
              </h3>

              {getProductsCountForCategory(deletingCategory.id) > 0 ? (
                <div className="space-y-3 pt-2 text-left bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                  <p>
                    ⚠️ Esta categoría tiene{" "}
                    <strong>{getProductsCountForCategory(deletingCategory.id)} producto(s)</strong>{" "}
                    asignados.
                  </p>
                  <p>
                    Para no dejar productos huérfanos, selecciona a qué categoría deseas transferirlos:
                  </p>
                  <select
                    value={targetMoveCategoryId}
                    onChange={(e) => setTargetMoveCategoryId(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-white border border-amber-300 font-semibold"
                  >
                    {categories
                      .filter((c) => c.id !== deletingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          Mover a: {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-[#7A7590]">
                  Esta categoría no tiene productos asociados. Se puede eliminar de forma segura.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-semibold text-[#7A7590]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BARRA FLOTANTE DE ACCIONES MASIVAS DE CATEGORÍAS */}
      {/* ================================================================= */}
      {selectedCategoryIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#2E2A3B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-wrap items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F472A8] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold">
              {selectedCategoryIds.length} categoría{selectedCategoryIds.length > 1 ? "s" : ""} seleccionada{selectedCategoryIds.length > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-white/60">
              ({totalProductsInSelected} productos)
            </span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenReassignModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Mover / Reasignar Productos ({totalProductsInSelected})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkAddSubModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Agregar Subcategoría</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryIds([])}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: REASIGNACIÓN MASIVA DE PRODUCTOS ENTRE CATEGORÍAS */}
      {/* ================================================================= */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isExecutingReassign && setIsReassignModalOpen(false)}
          />

          <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEEAFB] text-[#6D4BB8] flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2E2A3B]">
                    Reasignar Productos entre Categorías y Subcategorías
                  </h3>
                  <p className="text-xs text-[#7A7590]">
                    Corrige productos subidos por archivo plano o reorganiza tu inventario masivamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isExecutingReassign}
                onClick={() => setIsReassignModalOpen(false)}
                className="p-2 text-[#7A7590] hover:text-[#2E2A3B] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* SECCIÓN 1: FILTROS DE ORIGEN Y LISTADO DE PRODUCTOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2E2A3B] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#6D4BB8] text-white flex items-center justify-center text-[10px] font-extrabold">1</span>
                    Seleccionar Productos a Modificar
                  </span>
                  <span className="text-[11px] text-[#7A7590]">
                    {reassignSelectedProductIds.length} de {reassignFilteredProducts.length} seleccionados
                  </span>
                </div>

                {/* Filtros de búsqueda y origen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2]">
                  {/* Categoría Origen */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#7A7590]">
                      Categoría de Origen
                    </label>
                    <select
                      value={reassignSourceCategoryId}
                      onChange={(e) => {
                        setReassignSourceCategoryId(e.target.value);
                        setReassignSubFilter("all");
                        setReassignSelectedProductIds([]);
                      }}
                      className="w-full text-xs font-semibold p-2 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8]"
                    >
                      <option value="all">
                        {selectedCategoryIds.length > 0
                          ? `Categorías seleccionadas (${totalProductsInSelected} prods)`
                          : `Todas las categorías (${localProducts.length} prods)`}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({getProductsCountForCategory(c.id)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategoría Filtro */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#7A7590]">
                      Filtrar por Subcategoría
                    </label>
                    <select
                      value={reassignSubFilter}
                      onChange={(e) => setReassignSubFilter(e.target.value)}
                      className="w-full text-xs font-semibold p-2 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8]"
                    >
                      <option value="all">Todas las subcategorías</option>
                      <option value="__empty__">Sin subcategoría asignada</option>
                      {(() => {
                        // Gather subcategories for options
                        const sourceCat = categories.find((c) => c.id === reassignSourceCategoryId);
                        const subList = sourceCat?.subcategories || [];
                        return subList.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Búsqueda por texto */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#7A7590]">
                      Buscar Producto o SKU
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A7590]" />
                      <input
                        type="text"
                        value={reassignSearch}
                        onChange={(e) => setReassignSearch(e.target.value)}
                        placeholder="Nombre, perfume, SKU..."
                        className="w-full text-xs p-2 pl-8 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8]"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de selección rápida */}
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllReassignProducts}
                      className="text-[#6D4BB8] font-bold hover:underline cursor-pointer"
                    >
                      {reassignSelectedProductIds.length === reassignFilteredProducts.length && reassignFilteredProducts.length > 0
                        ? "Deseleccionar todos"
                        : `Seleccionar todos (${reassignFilteredProducts.length})`}
                    </button>
                    {reassignSelectedProductIds.length > 0 && (
                      <span className="text-[#7A7590]">
                        • {reassignSelectedProductIds.length} marcados
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#7A7590]">
                    Haz clic en una fila para marcarla o desmarcarla
                  </span>
                </div>

                {/* Lista de productos con scroll */}
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-[#F0E8F2] divide-y divide-[#F7F2F9] bg-[#FAF5FB]/30">
                  {reassignFilteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-[#7A7590] space-y-1">
                      <p className="font-semibold">No se encontraron productos con estos filtros.</p>
                      <p className="text-[11px]">Prueba cambiando la categoría de origen o el término de búsqueda.</p>
                    </div>
                  ) : (
                    reassignFilteredProducts.map((p) => {
                      const isChecked = reassignSelectedProductIds.includes(p.id);
                      const catName =
                        categories.find((c) => c.id === p.category_id)?.name ||
                        p.category_name ||
                        "Sin categoría";

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleReassignProduct(p.id)}
                          className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-[#EEEAFB]/60 font-semibold"
                              : "hover:bg-white bg-white/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleReassignProduct(p.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded text-[#6D4BB8] accent-[#6D4BB8] cursor-pointer"
                            />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.images?.[0]?.url || "/placeholder.png"}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-[#2E2A3B] truncate max-w-[200px] sm:max-w-md">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-[#7A7590] truncate">
                                SKU: {p.sku || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E0D4F0] text-[#6D4BB8] font-semibold">
                              {catName}
                            </span>
                            {p.subcategory && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF5FB] border border-[#F0E8F2] text-[#7A7590]">
                                {p.subcategory}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: DEFINIR DESTINO (CATEGORÍA Y SUBCATEGORÍA) */}
              <div className="space-y-4 pt-3 border-t border-[#F0E8F2]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2E2A3B] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#6D4BB8] text-white flex items-center justify-center text-[10px] font-extrabold">2</span>
                    Definir Nueva Categoría y Subcategoría
                  </span>
                </div>

                {/* Selector de Modo */}
                <div className="grid grid-cols-3 gap-2 bg-[#FAF5FB] p-1 rounded-2xl border border-[#F0E8F2] text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setReassignMode("all")}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      reassignMode === "all"
                        ? "bg-[#6D4BB8] text-white shadow-xs"
                        : "text-[#7A7590] hover:text-[#2E2A3B]"
                    }`}
                  >
                    Categoría y Subcategoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setReassignMode("category_only")}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      reassignMode === "category_only"
                        ? "bg-[#6D4BB8] text-white shadow-xs"
                        : "text-[#7A7590] hover:text-[#2E2A3B]"
                    }`}
                  >
                    Solo Categoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setReassignMode("subcategory_only")}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      reassignMode === "subcategory_only"
                        ? "bg-[#6D4BB8] text-white shadow-xs"
                        : "text-[#7A7590] hover:text-[#2E2A3B]"
                    }`}
                  >
                    Solo Subcategoría
                  </button>
                </div>

                {/* Campos de Destino */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nueva Categoría */}
                  {reassignMode !== "subcategory_only" && (
                    <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2]">
                      <label className="text-xs font-bold text-[#2E2A3B] flex items-center justify-between">
                        <span>Categoría de Destino *</span>
                        <span className="text-[10px] text-[#6D4BB8] font-bold">Requerido</span>
                      </label>
                      <select
                        value={reassignTargetCategoryId}
                        onChange={(e) => {
                          setReassignTargetCategoryId(e.target.value);
                          setReassignTargetSubcategory("");
                          setReassignCustomSubcategory("");
                        }}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8]"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Nueva Subcategoría */}
                  {reassignMode !== "category_only" && (
                    <div
                      className={`space-y-1.5 p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] ${
                        reassignMode === "subcategory_only" ? "sm:col-span-2" : ""
                      }`}
                    >
                      <label className="text-xs font-bold text-[#2E2A3B] flex items-center justify-between">
                        <span>Nueva Subcategoría</span>
                        <span className="text-[10px] text-[#7A7590]">Opcional</span>
                      </label>

                      {(() => {
                        const targetCat = categories.find((c) => c.id === reassignTargetCategoryId);
                        const subList = targetCat?.subcategories || [];

                        return (
                          <div className="space-y-2">
                            <select
                              value={reassignTargetSubcategory}
                              onChange={(e) => setReassignTargetSubcategory(e.target.value)}
                              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8]"
                            >
                              <option value="">Sin subcategoría (General)</option>
                              {subList.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                              <option value="__custom__">+ Escribir nueva subcategoría personalizada...</option>
                            </select>

                            {reassignTargetSubcategory === "__custom__" && (
                              <input
                                type="text"
                                value={reassignCustomSubcategory}
                                onChange={(e) => setReassignCustomSubcategory(e.target.value)}
                                placeholder="Escribe el nombre de la nueva subcategoría..."
                                className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#6D4BB8] focus:outline-none focus:ring-1 focus:ring-[#6D4BB8]"
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Resumen de cambios */}
                {reassignSelectedProductIds.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#EEEAFB] border border-[#E0D4F0] text-[#2E2A3B] text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#6D4BB8]">
                        Resumen de la modificación:
                      </p>
                      <p className="text-[11px] text-[#7A7590] mt-0.5">
                        Se actualizarán <strong>{reassignSelectedProductIds.length}</strong> producto(s) a:{" "}
                        {reassignMode !== "subcategory_only" && (
                          <strong className="text-[#2E2A3B]">
                            {categories.find((c) => c.id === reassignTargetCategoryId)?.name || "Categoría destino"}
                          </strong>
                        )}
                        {reassignMode === "all" && " > "}
                        {reassignMode !== "category_only" && (
                          <span className="font-semibold text-[#6D4BB8]">
                            {reassignTargetSubcategory === "__custom__"
                              ? reassignCustomSubcategory.trim() || "(Nueva subcategoría)"
                              : reassignTargetSubcategory.trim() || "(Sin subcategoría)"}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[11px] bg-white px-2.5 py-1 rounded-full font-extrabold text-[#6D4BB8] border border-[#E0D4F0] shrink-0">
                      {reassignSelectedProductIds.length} productos
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F0E8F2] flex items-center justify-end gap-3 bg-white shrink-0">
              <button
                type="button"
                disabled={isExecutingReassign}
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isExecutingReassign ||
                  reassignSelectedProductIds.length === 0 ||
                  (reassignMode !== "subcategory_only" && !reassignTargetCategoryId)
                }
                onClick={handleConfirmReassign}
                className="px-5 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isExecutingReassign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reasignando productos...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Reasignación ({reassignSelectedProductIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: AGREGAR SUBCATEGORÍA MASIVAMENTE A CATEGORÍAS */}
      {/* ================================================================= */}
      {isBulkAddSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => !isSavingBulkAddSub && setIsBulkAddSubModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl z-10 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFB] text-[#6D4BB8] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#2E2A3B]">
                Agregar Subcategoría a {selectedCategoryIds.length} Categorías
              </h3>
              <p className="text-xs text-[#7A7590]">
                Crea una nueva subcategoría en todas las categorías seleccionadas al mismo tiempo.
              </p>
            </div>

            <div className="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto p-2 bg-[#FAF5FB] rounded-xl border border-[#F0E8F2]">
              {categories
                .filter((c) => selectedCategoryIds.includes(c.id))
                .map((c) => (
                  <span
                    key={c.id}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E0D4F0] text-[#6D4BB8] font-semibold"
                  >
                    {c.name}
                  </span>
                ))}
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-[#2E2A3B]">
                Nombre de la nueva subcategoría *
              </label>
              <input
                type="text"
                value={bulkAddSubInput}
                onChange={(e) => setBulkAddSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmBulkAddSubcategory();
                  }
                }}
                placeholder="Ej: Hombre, Mujer, Ofertas, Temporada..."
                className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#6D4BB8]"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSavingBulkAddSub}
                onClick={() => setIsBulkAddSubModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-semibold text-[#7A7590]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingBulkAddSub || !bulkAddSubInput.trim()}
                onClick={handleConfirmBulkAddSubcategory}
                className="flex-1 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSavingBulkAddSub ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar en Todas</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
