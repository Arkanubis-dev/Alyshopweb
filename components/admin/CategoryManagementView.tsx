"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Category, Product } from "@/types";
import {
  saveCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
  reorderCategoriesAction,
} from "@/app/actions/categories";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    return products.filter((p) => p.category_id === catId).length;
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
    });
    setNewSubcategoryInput("");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory({
      ...category,
      subcategories: category.subcategories || [],
    });
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

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
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
                <th className="py-3 px-4 text-center w-24">Orden</th>
                <th className="py-3 px-4">Ícono / Color</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4 text-center">Productos</th>
                <th className="py-3 px-4 text-center">Activo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2F9]">
              {categories.map((cat, index) => {
                const iconObj = AVAILABLE_ICONS.find((i) => i.name === cat.icon) || AVAILABLE_ICONS[0];
                const IconComponent = iconObj.component;
                const count = getProductsCountForCategory(cat.id);
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index;

                return (
                  <tr
                    key={cat.id}
                    draggable
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
                          className="cursor-grab active:cursor-grabbing p-1 text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#EEEAFB] rounded-md transition-colors"
                          title="Arrastra para cambiar orden"
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
                            disabled={index === 0}
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
                            disabled={index === categories.length - 1}
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/5 shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <IconComponent className="w-5 h-5 text-[#6D4BB8]" strokeWidth={1.6} />
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

                    {/* Assigned Products Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF5FB] border border-[#F0E8F2] text-[#2E2A3B]">
                        {count} productos
                      </span>
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

                {/* Icon Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#2E2A3B]">
                    Ícono Lineal (Lucide)
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {AVAILABLE_ICONS.map((i) => {
                      const IconComp = i.component;
                      const isSelected = editingCategory.icon === i.name;
                      return (
                        <button
                          key={i.name}
                          type="button"
                          onClick={() => setEditingCategory({ ...editingCategory, icon: i.name })}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            isSelected
                              ? "border-[#6D4BB8] bg-[#EEEAFB] text-[#6D4BB8] shadow-xs"
                              : "border-[#F0E8F2] hover:bg-gray-50 text-[#7A7590]"
                          }`}
                        >
                          <IconComp className="w-5 h-5" strokeWidth={1.5} />
                          <span className="text-[10px] truncate max-w-full">{i.label}</span>
                        </button>
                      );
                    })}
                  </div>
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
    </div>
  );
}
