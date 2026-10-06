"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import { AdminPagination, PageSizeOption } from "./AdminPagination";
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
  FileSpreadsheet,
  FileDown,
  PowerOff,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  FolderTree,
  Tag,
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
  bulkUpdateProductStatusAction,
  bulkDeleteProductsAction,
  bulkImportProductsAction,
  bulkAttachProductImagesAction,
  bulkUpdateProductCategoryAction,
  BulkProductInput,
} from "@/app/actions/products";
import { findBestMatchingProduct, MatchConfidence } from "@/lib/product-matcher";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Single delete modal state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Multi-selection state (Bulk Actions)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);

  // Bulk Category & Subcategory Update state
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState("");
  const [bulkTargetSubcategory, setBulkTargetSubcategory] = useState("");
  const [bulkCustomSubcategory, setBulkCustomSubcategory] = useState("");
  const [bulkCategoryMode, setBulkCategoryMode] = useState<"both" | "category_only" | "subcategory_only">("both");
  const [isUpdatingBulkCategory, setIsUpdatingBulkCategory] = useState(false);

  // Excel Bulk Import state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelParsedProducts, setExcelParsedProducts] = useState<BulkProductInput[]>([]);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Photos Upload State (Box of 50 photos max)
  const [isBulkPhotosOpen, setIsBulkPhotosOpen] = useState(false);
  const [bulkPhotosQueue, setBulkPhotosQueue] = useState<Array<{
    id: string;
    file: File;
    fileName: string;
    previewUrl: string;
    assignedProductId: string;
    confidence: MatchConfidence;
    reason?: string;
    status: "idle" | "uploading" | "success" | "error";
    error?: string;
  }>>([]);
  const [isUploadingBulkPhotos, setIsUploadingBulkPhotos] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  }>({ current: 0, total: 0, currentFileName: "" });
  const [isDraggingBulkPhotos, setIsDraggingBulkPhotos] = useState(false);
  const bulkPhotosInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorted products for the manual selection dropdowns
  const sortedCatalogProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [products]);

  // Clean up preview object URLs on unmount
  useEffect(() => {
    return () => {
      bulkPhotosQueue.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      });
    };
  }, [bulkPhotosQueue]);

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
  }, [products, selectedCategory, selectedSubcategory, stockFilter, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, stockFilter, search]);

  // Paginated products slice
  const paginatedProducts = useMemo(() => {
    if (pageSize === "all") return filteredProducts;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredProducts.slice(start, start + (pageSize as number));
  }, [filteredProducts, currentPage, pageSize]);

  // Bulk Selection Handlers (preserves multi-selection across pages)
  const isCurrentPageAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isCurrentPageAllSelected) {
      // Deselect all items on current page (preserves items selected on other pages)
      const pageIds = new Set(paginatedProducts.map((p) => p.id));
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      // Select all items on current page (accumulates with other pages)
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = async (isActive: boolean) => {
    if (selectedProductIds.length === 0) return;
    try {
      setIsBulkUpdatingStatus(true);
      const res = await bulkUpdateProductStatusAction(selectedProductIds, isActive);
      if (res.success) {
        showToast(
          `${selectedProductIds.length} productos ${isActive ? "activados" : "desactivados"} correctamente`
        );
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.includes(p.id) ? { ...p, is_active: isActive } : p
          )
        );
        setSelectedProductIds([]);
      } else {
        showToast(res.error || "Error al actualizar productos", "error");
      }
    } catch {
      showToast("Error inesperado al actualizar productos", "error");
    } finally {
      setIsBulkUpdatingStatus(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      const res = await bulkDeleteProductsAction(selectedProductIds);
      if (res.success) {
        showToast(`${selectedProductIds.length} productos eliminados correctamente`);
        setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
        setSelectedProductIds([]);
        setIsConfirmBulkDeleteOpen(false);
      } else {
        showToast(res.error || "Error al eliminar productos", "error");
      }
    } catch {
      showToast("Error inesperado al eliminar productos", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleConfirmBulkUpdateCategory = async () => {
    if (selectedProductIds.length === 0) return;
    if (bulkCategoryMode !== "subcategory_only" && !bulkTargetCategoryId) {
      showToast("Por favor selecciona una categoría de destino", "error");
      return;
    }

    const finalSubcategory =
      bulkTargetSubcategory === "__custom__"
        ? bulkCustomSubcategory.trim()
        : bulkTargetSubcategory;

    try {
      setIsUpdatingBulkCategory(true);
      const updateCatOnly = bulkCategoryMode === "category_only";
      const updateSubOnly = bulkCategoryMode === "subcategory_only";

      const res = await bulkUpdateProductCategoryAction(
        selectedProductIds,
        bulkTargetCategoryId,
        finalSubcategory,
        updateCatOnly,
        updateSubOnly
      );

      if (res.success && res.updatedProducts) {
        showToast(
          `¡Categoría/subcategoría de ${res.count} producto(s) actualizada correctamente!`
        );

        const updateMap = new Map(res.updatedProducts.map((p) => [p.id, p]));
        setProducts((prev) =>
          prev.map((p) => {
            const upd = updateMap.get(p.id);
            if (upd) {
              return {
                ...p,
                category_id: upd.category_id,
                category_name: upd.category_name,
                subcategory: upd.subcategory,
              };
            }
            return p;
          })
        );

        setSelectedProductIds([]);
        setIsBulkCategoryModalOpen(false);
      } else {
        showToast(res.error || "Error al actualizar categoría", "error");
      }
    } catch (err: any) {
      showToast("Error inesperado: " + err.message, "error");
    } finally {
      setIsUpdatingBulkCategory(false);
    }
  };

  // Excel Template Download Handler
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        Nombre: "Ej: Termo Acero Inoxidable 500 ml",
        Categoria: categories[0]?.name || "Hogar",
        Subcategoria: categories[0]?.subcategories?.[0] || "",
        Precio: 38000,
        Costo: 20000,
        Precio_Comparacion: 48000,
        Stock: 25,
        Detalle: "500 ml",
        Marca: "AlyHome",
        Descripcion: "Termo con doble capa térmica de acero inoxidable para frío y calor.",
        SKU: "ALY-TER-01",
      },
      {
        Nombre: "Ej: Perfume Amber Floral 100 ml",
        Categoria: "Perfumes",
        Subcategoria: "Mujer",
        Precio: 65000,
        Costo: 32000,
        Precio_Comparacion: 85000,
        Stock: 15,
        Detalle: "100 ml",
        Marca: "AlyShop",
        Descripcion: "Fragancia de larga duración con notas de jazmín y ámbar oriental.",
        SKU: "ALY-PER-02",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla_Productos");
    XLSX.writeFile(workbook, "plantilla_carga_masiva_productos_alyshop.xlsx");
    showToast("Plantilla Excel descargada exitosamente");
  };

  // Excel / CSV File Upload and Parser
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          showToast("El archivo está vacío o no contiene filas con datos", "error");
          return;
        }

        const parsed: BulkProductInput[] = [];
        for (const row of rawJson) {
          const name =
            row["Nombre"] ||
            row["nombre"] ||
            row["NOMBRE"] ||
            row["Producto"] ||
            row["producto"];
          if (!name) continue;

          const catName = row["Categoria"] || row["categoria"] || row["CATEGORIA"] || "";
          const subCat =
            row["Subcategoria"] ||
            row["subcategoria"] ||
            row["SUBCATEGORIA"] ||
            row["Subcategoría"] ||
            "";
          const price = Number(row["Precio"] || row["precio"] || row["PRECIO"] || 0);
          const cost =
            row["Costo"] !== undefined || row["costo"] !== undefined
              ? Number(row["Costo"] ?? row["costo"])
              : undefined;
          const comparePrice =
            row["Precio_Comparacion"] !== undefined ||
            row["precio_comparacion"] !== undefined ||
            row["Comparacion"] !== undefined
              ? Number(row["Precio_Comparacion"] ?? row["precio_comparacion"] ?? row["Comparacion"])
              : undefined;
          const stock = Number(row["Stock"] || row["stock"] || row["STOCK"] || 0);
          const detail = row["Detalle"] || row["detalle"] || row["DETALLE"] || "";
          const brand = row["Marca"] || row["marca"] || row["MARCA"] || "";
          const description =
            row["Descripcion"] || row["descripcion"] || row["DESCRIPCION"] || "";
          const sku = row["SKU"] || row["sku"] || "";

          let matchedCatId = categories[0]?.id || "";
          if (catName) {
            const found = categories.find(
              (c) =>
                c.name.toLowerCase() === String(catName).trim().toLowerCase() ||
                c.slug.toLowerCase() === String(catName).trim().toLowerCase()
            );
            if (found) matchedCatId = found.id;
          }

          parsed.push({
            name: String(name).trim(),
            category_id: matchedCatId,
            subcategory: subCat ? String(subCat).trim() : undefined,
            price: Math.max(0, price),
            cost: cost !== undefined && !isNaN(cost) ? Math.max(0, cost) : undefined,
            compare_price:
              comparePrice !== undefined && !isNaN(comparePrice)
                ? Math.max(0, comparePrice)
                : undefined,
            stock: Math.max(0, stock),
            detail: String(detail).trim(),
            brand: String(brand).trim(),
            description: String(description).trim(),
            sku: String(sku).trim(),
            is_active: true,
          });
        }

        if (parsed.length === 0) {
          showToast("No se encontraron productos válidos en el archivo", "error");
          return;
        }

        setExcelParsedProducts(parsed);
        setIsExcelModalOpen(true);
      } catch (err: any) {
        showToast("Error al leer el archivo Excel: " + err.message, "error");
      }
    };
    reader.readAsBinaryString(file);
    if (excelFileInputRef.current) excelFileInputRef.current.value = "";
  };

  const handleConfirmExcelImport = async () => {
    if (excelParsedProducts.length === 0) return;
    try {
      setIsImportingExcel(true);
      const res = await bulkImportProductsAction(excelParsedProducts);
      if (res.success && res.createdProducts) {
        showToast(`¡Se importaron ${res.count} productos exitosamente!`);
        setProducts((prev) => [...res.createdProducts!, ...prev]);
        setIsExcelModalOpen(false);
        setExcelParsedProducts([]);
      } else {
        showToast(res.error || "Error al importar productos", "error");
      }
    } catch {
      showToast("Error inesperado al importar productos", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  // =================================================================
  // BULK PHOTOS HANDLERS (HASTA 150 FOTOS)
  // =================================================================
  const handleAddFilesToBulkQueue = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) =>
      f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name)
    );

    if (imageFiles.length === 0) {
      showToast("Por favor selecciona archivos de imagen válidos (PNG, JPG, WEBP)", "error");
      return;
    }

    const MAX_LIMIT = 150;
    const currentCount = bulkPhotosQueue.length;
    const availableSlots = Math.max(0, MAX_LIMIT - currentCount);

    if (availableSlots <= 0) {
      showToast(
        "La caja ya tiene el límite de 150 fotos. Procesa o limpia el lote antes de agregar más.",
        "error"
      );
      return;
    }

    let filesToAdd = imageFiles;
    if (imageFiles.length > availableSlots) {
      filesToAdd = imageFiles.slice(0, availableSlots);
      showToast(
        `Se agregaron ${availableSlots} fotos (límite de 150 fotos por lote para evitar sobrecarga).`,
        "error"
      );
    } else {
      showToast(`Se agregaron ${filesToAdd.length} foto(s) a la caja de carga.`);
    }

    const newItems = filesToAdd.map((file, idx) => {
      const match = findBestMatchingProduct(file.name, products);
      return {
        id: `${file.name}-${Date.now()}-${idx}-${Math.random()}`,
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        assignedProductId: match.product ? match.product.id : "",
        confidence: match.confidence,
        reason: match.reason,
        status: "idle" as const,
      };
    });

    setBulkPhotosQueue((prev) => [...prev, ...newItems]);
    setIsBulkPhotosOpen(true);
  };

  const handleBulkPhotosFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFilesToBulkQueue(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemoveBulkPhotoItem = (id: string) => {
    setBulkPhotosQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClearBulkPhotos = () => {
    bulkPhotosQueue.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {}
    });
    setBulkPhotosQueue([]);
  };

  const handleAssignProductToPhoto = (photoId: string, newProductId: string) => {
    setBulkPhotosQueue((prev) =>
      prev.map((item) => {
        if (item.id === photoId) {
          const prod = products.find((p) => p.id === newProductId);
          return {
            ...item,
            assignedProductId: newProductId,
            confidence: newProductId ? ("exact" as MatchConfidence) : ("none" as MatchConfidence),
            reason: prod ? `Asignado manualmente: ${prod.name}` : undefined,
          };
        }
        return item;
      })
    );
  };

  const handleProcessBulkPhotos = async () => {
    const validItems = bulkPhotosQueue.filter((item) => Boolean(item.assignedProductId));

    if (validItems.length === 0) {
      showToast(
        "Ninguna foto tiene un producto asignado. Por favor asigna productos antes de subir.",
        "error"
      );
      return;
    }

    if (validItems.length < bulkPhotosQueue.length) {
      const unassignedCount = bulkPhotosQueue.length - validItems.length;
      const confirmContinue = window.confirm(
        `Hay ${unassignedCount} foto(s) sin producto asignado. Se subirán y asociarán las ${validItems.length} fotos que sí tienen producto asignado. ¿Deseas continuar?`
      );
      if (!confirmContinue) return;
    }

    setIsUploadingBulkPhotos(true);
    setBulkUploadProgress({
      current: 0,
      total: validItems.length,
      currentFileName: validItems[0].fileName,
    });

    const successfulAttachments: Array<{ productId: string; imageUrl: string }> = [];
    const CONCURRENCY = 3; // Process 3 at a time for optimal speed and memory stability with up to 150 photos

    try {
      for (let i = 0; i < validItems.length; i += CONCURRENCY) {
        const chunk = validItems.slice(i, i + CONCURRENCY);

        await Promise.all(
          chunk.map(async (item, chunkIndex) => {
            const currentIndex = i + chunkIndex + 1;
            setBulkUploadProgress({
              current: currentIndex,
              total: validItems.length,
              currentFileName: item.fileName,
            });

            // Set item status to uploading
            setBulkPhotosQueue((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p))
            );

            try {
              // Compress image client side (1000x1000 JPEG quality 0.85)
              const { file: compressedFile } = await compressAndResizeImage(
                item.file,
                1000,
                1000,
                0.85
              );

              const formData = new FormData();
              formData.append("file", compressedFile);

              const uploadRes = await uploadProductImageAction(formData);

              if (uploadRes.success && uploadRes.url) {
                successfulAttachments.push({
                  productId: item.assignedProductId,
                  imageUrl: uploadRes.url,
                });

                setBulkPhotosQueue((prev) =>
                  prev.map((p) =>
                    p.id === item.id ? { ...p, status: "success" } : p
                  )
                );
              } else {
                setBulkPhotosQueue((prev) =>
                  prev.map((p) =>
                    p.id === item.id
                      ? { ...p, status: "error", error: uploadRes.error || "Error al subir" }
                      : p
                  )
                );
              }
            } catch (err: any) {
              setBulkPhotosQueue((prev) =>
                prev.map((p) =>
                  p.id === item.id
                    ? { ...p, status: "error", error: err.message || "Error al procesar" }
                    : p
                )
              );
            }
          })
        );
      }

      if (successfulAttachments.length > 0) {
        const attachRes = await bulkAttachProductImagesAction(successfulAttachments);
        if (attachRes.success && attachRes.updatedProducts) {
          showToast(`¡${attachRes.count} fotos subidas y asociadas exitosamente a sus productos!`);

          // Update local products state
          const updatedMap = new Map(attachRes.updatedProducts.map((p) => [p.id, p]));
          setProducts((prev) => prev.map((p) => updatedMap.get(p.id) || p));

          // Clean up successful items
          setBulkPhotosQueue((prev) => {
            const remaining = prev.filter((item) => item.status !== "success");
            prev
              .filter((item) => item.status === "success")
              .forEach((item) => {
                try {
                  URL.revokeObjectURL(item.previewUrl);
                } catch {}
              });
            if (remaining.length === 0) {
              setIsBulkPhotosOpen(false);
            }
            return remaining;
          });
        } else {
          showToast(attachRes.error || "Error al asociar las fotos a los productos", "error");
        }
      } else {
        showToast("No se pudo subir ninguna foto. Revisa los errores.", "error");
      }
    } catch (err: any) {
      showToast("Error general durante la carga: " + err.message, "error");
    } finally {
      setIsUploadingBulkPhotos(false);
    }
  };

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
      const { file: compressedFile, dataUrl } = await compressAndResizeImage(file, 1000, 1000, 0.85);

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
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: nextVal } : p))
    );

    const res = await toggleProductFieldAction(productId, field, nextVal);
    if (!res.success) {
      showToast("No se pudo actualizar el estado", "error");
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

  const handleDeleteConfirm = async (onlyDeactivate: boolean) => {
    if (!deletingProductId) return;

    if (onlyDeactivate) {
      await handleToggle(deletingProductId, "is_active", true);
      setDeletingProductId(null);
      return;
    }

    const res = await deleteProductAction(deletingProductId);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== deletingProductId));
      showToast("Producto eliminado permanentemente");
      setDeletingProductId(null);
    } else {
      showToast(res.error || "Error al eliminar producto", "error");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Nombre",
      "Slug",
      "Categoria",
      "Precio",
      "Precio_Comparacion",
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
            Catálogo de alyshop: precios, costos, imágenes, inventario, carga masiva en Excel y acciones en lote.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Descargar Plantilla Excel */}
          <button
            type="button"
            onClick={handleDownloadExcelTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#F0E8F2] text-xs font-bold text-[#2E2A3B] shadow-2xs transition-colors cursor-pointer"
            title="Descargar plantilla de Excel con columnas listas para importar productos masivamente"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Plantilla Excel</span>
          </button>

          {/* Carga Masiva Excel */}
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs transition-colors cursor-pointer">
            <UploadCloud className="w-4 h-4 text-emerald-700" />
            <span>Carga Masiva Excel</span>
            <input
              ref={excelFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelFileUpload}
            />
          </label>

          {/* Carga Masiva Fotos (hasta 50) */}
          <button
            type="button"
            onClick={() => setIsBulkPhotosOpen(!isBulkPhotosOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold shadow-2xs transition-all cursor-pointer ${
              isBulkPhotosOpen
                ? "bg-[#6D4BB8] text-white border-[#5837A3]"
                : "bg-purple-50 hover:bg-purple-100 border-purple-200 text-[#6D4BB8]"
            }`}
            title="Subir lotes de hasta 150 imágenes y asociarlas automáticamente a los productos por nombre coincidente"
          >
            <ImageIcon className={`w-4 h-4 ${isBulkPhotosOpen ? "text-white" : "text-[#6D4BB8]"}`} />
            <span>Carga Masiva Fotos</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                isBulkPhotosOpen
                  ? "bg-white/20 text-white"
                  : "bg-[#6D4BB8] text-white"
              }`}
            >
              {bulkPhotosQueue.length > 0 ? `${bulkPhotosQueue.length}/150` : "Hasta 150"}
            </span>
          </button>

          {/* Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#F0E8F2] text-xs font-bold text-[#2E2A3B] shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#6D4BB8]" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Nuevo Producto */}
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

      {/* ================================================================= */}
      {/* CAJA DE CARGA MASIVA DE FOTOS (HASTA 50 FOTOS) */}
      {/* ================================================================= */}
      {isBulkPhotosOpen && (
        <div className="bg-white rounded-3xl border-2 border-[#D8C7F0] shadow-lg p-5 sm:p-6 space-y-5 animate-in slide-in-from-top-3 duration-200">
          {/* Header of Bulk Photos Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E8F2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF5FB] border border-[#E8DEF8] flex items-center justify-center text-[#6D4BB8] shrink-0">
                <ImageIcon className="w-5 h-5 text-[#6D4BB8]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#2E2A3B]">
                    Caja de Carga Masiva de Fotos
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FCE4EF] text-[#D83A7D] border border-[#F472A8]/30">
                    Lotes de hasta 150 fotos
                  </span>
                </div>
                <p className="text-xs text-[#7A7590]">
                  Asocia automáticamente las imágenes con tus productos comparando el nombre del archivo con el nombre o SKU del producto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {bulkPhotosQueue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBulkPhotos}
                  disabled={isUploadingBulkPhotos}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Limpiar Cola
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsBulkPhotosOpen(false)}
                disabled={isUploadingBulkPhotos}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cerrar caja"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Educational banner */}
          <div className="p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#E8DEF8] flex items-start gap-3 text-xs text-[#2E2A3B]">
            <Sparkles className="w-4 h-4 text-[#F472A8] shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p>
                <strong>¿Cómo funciona la coincidencia?</strong> Nombra tus archivos PNG, JPG o WEBP igual o muy parecido al producto cargado (ejemplo: <code className="bg-white px-1.5 py-0.5 rounded text-[#6D4BB8] font-bold border border-[#E8DEF8]">Termo Acero Inoxidable 500 ml.jpg</code> o con su SKU <code className="bg-white px-1.5 py-0.5 rounded text-[#6D4BB8] font-bold border border-[#E8DEF8]">ALY-TER-01.png</code>).
              </p>
              <p className="text-[#7A7590]">
                El sistema detectará el producto correspondiente automáticamente. Si alguna foto no tiene coincidencia o deseas cambiarla, podrás elegir el producto en la lista desplegable antes de guardar.
              </p>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingBulkPhotos(true);
            }}
            onDragLeave={() => setIsDraggingBulkPhotos(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBulkPhotos(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleAddFilesToBulkQueue(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDraggingBulkPhotos
                ? "border-[#6D4BB8] bg-[#F3ECFB] scale-[0.99]"
                : "border-[#D8C7F0] bg-[#FAF5FB]/60 hover:bg-[#FAF5FB] hover:border-[#6D4BB8]"
            }`}
          >
            <input
              ref={bulkPhotosInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleBulkPhotosFileInput}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-[#E8DEF8] flex items-center justify-center text-[#6D4BB8]">
                <UploadCloud className="w-6 h-6 text-[#6D4BB8]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#2E2A3B]">
                  Arrastra y suelta tus fotos aquí o{" "}
                  <button
                    type="button"
                    onClick={() => bulkPhotosInputRef.current?.click()}
                    disabled={isUploadingBulkPhotos}
                    className="text-[#6D4BB8] hover:underline font-extrabold cursor-pointer"
                  >
                    haz clic para explorar
                  </button>
                </p>
                <p className="text-[11px] text-[#7A7590] mt-1">
                  Formatos soportados: PNG, JPG, JPEG, WEBP. Máximo 150 fotos por lote para procesar rápidamente.
                </p>
              </div>

              {bulkPhotosQueue.length < 150 && (
                <button
                  type="button"
                  onClick={() => bulkPhotosInputRef.current?.click()}
                  disabled={isUploadingBulkPhotos}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Seleccionar Fotos (Lote hasta 150)</span>
                </button>
              )}
            </div>
          </div>

          {/* Queue Statistics & Action Trigger */}
          {bulkPhotosQueue.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#E8DEF8] shadow-2xs">
                {/* Stats */}
                <div className="flex items-center gap-2.5 flex-wrap text-xs">
                  <span className="font-extrabold text-[#2E2A3B]">
                    Cola de fotos: {bulkPhotosQueue.length}/150
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bulkPhotosQueue.filter((i) => Boolean(i.assignedProductId)).length} asociadas
                  </span>
                  {bulkPhotosQueue.some((i) => !i.assignedProductId) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {bulkPhotosQueue.filter((i) => !i.assignedProductId).length} sin asociar
                    </span>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingBulkPhotos || bulkPhotosQueue.filter((i) => Boolean(i.assignedProductId)).length === 0}
                    onClick={handleProcessBulkPhotos}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingBulkPhotos ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Subiendo {bulkUploadProgress.current} de {bulkUploadProgress.total}...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          Subir y Asociar {bulkPhotosQueue.filter((i) => Boolean(i.assignedProductId)).length} Foto(s)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress bar when uploading */}
              {isUploadingBulkPhotos && (
                <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#E8DEF8] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2E2A3B]">
                    <div className="flex items-center gap-2 truncate max-w-[80%]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6D4BB8] shrink-0" />
                      <span className="truncate">
                        Subiendo foto {bulkUploadProgress.current} de {bulkUploadProgress.total}:{" "}
                        <span className="text-[#6D4BB8]">{bulkUploadProgress.currentFileName}</span>
                      </span>
                    </div>
                    <span className="text-[#6D4BB8]">
                      {Math.round(
                        (bulkUploadProgress.current / Math.max(1, bulkUploadProgress.total)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#6D4BB8] to-[#F472A8] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          (bulkUploadProgress.current / Math.max(1, bulkUploadProgress.total)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Photos Cards Grid */}
              <div className="max-h-[460px] overflow-y-auto space-y-2.5 pr-1.5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {bulkPhotosQueue.map((item, index) => {
                    const assignedProd = products.find((p) => p.id === item.assignedProductId);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 relative ${
                          item.status === "uploading"
                            ? "border-[#6D4BB8] bg-purple-50/50"
                            : item.status === "success"
                            ? "border-emerald-300 bg-emerald-50/30"
                            : item.status === "error"
                            ? "border-rose-300 bg-rose-50/30"
                            : item.assignedProductId
                            ? "border-[#E8DEF8] bg-white hover:border-[#6D4BB8]/60"
                            : "border-amber-200 bg-amber-50/20"
                        }`}
                      >
                        {/* Remove item button */}
                        {!isUploadingBulkPhotos && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkPhotoItem(item.id)}
                            className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Quitar foto de la lista"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-tl">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Details and Product Match Selector */}
                        <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                          {/* File Name */}
                          <p
                            className="text-xs font-bold text-[#2E2A3B] truncate"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </p>

                          {/* Match / Status Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.status === "uploading" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6D4BB8]">
                                <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                              </span>
                            ) : item.status === "success" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> Asociada con éxito
                              </span>
                            ) : item.status === "error" ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700"
                                title={item.error}
                              >
                                <X className="w-3 h-3" /> Error: {item.error || "Fallo"}
                              </span>
                            ) : item.assignedProductId ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.confidence === "exact"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                                title={item.reason}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {item.confidence === "exact"
                                  ? "Coincidencia exacta"
                                  : "Coincidencia aproximada"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-3 h-3" /> Sin coincidencia automática
                              </span>
                            )}
                          </div>

                          {/* Product Selection Dropdown */}
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-bold text-[#7A7590] uppercase tracking-wider block">
                              Producto a vincular:
                            </label>
                            <select
                              value={item.assignedProductId}
                              onChange={(e) => handleAssignProductToPhoto(item.id, e.target.value)}
                              disabled={isUploadingBulkPhotos || item.status === "success"}
                              className={`w-full text-[11px] py-1 px-2 rounded-lg border font-semibold focus:outline-none focus:border-[#6D4BB8] ${
                                item.assignedProductId
                                  ? "bg-white text-[#2E2A3B] border-[#D8C7F0]"
                                  : "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                              }`}
                            >
                              <option value="">-- Seleccionar producto manual --</option>
                              {sortedCatalogProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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

          {/* Subcategory Filter */}
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
            <option value="disponibles">En stock (&gt;0)</option>
            <option value="bajas">Stock bajo (&le; umbral)</option>
            <option value="agotadas">Agotados (0)</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop Reorder Helper Notice */}
      <div className="bg-[#FAF5FB] px-4 py-2.5 rounded-2xl border border-[#F0E8F2] text-xs text-[#7A7590] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[#6D4BB8] shrink-0" />
          <span>
            {canDragReorder ? (
              <>
                <strong>Orden interactivo de productos:</strong> Arrastra las filas o usa las flechas (▲ / ▼) para fijar el orden de aparición en la tienda.
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
                {/* Bulk Select All Checkbox */}
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isCurrentPageAllSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Seleccionar todos"
                    className="w-4 h-4 rounded text-[#6D4BB8] accent-[#6D4BB8] cursor-pointer"
                    title={isCurrentPageAllSelected ? "Deseleccionar los de esta página" : "Seleccionar los de esta página"}
                  />
                </th>
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
              {paginatedProducts.map((p, index) => {
                const globalIndex = pageSize === "all" ? index : (currentPage - 1) * (pageSize as number) + index;
                const isOutOfStock = p.stock <= 0;
                const isLowStock = !isOutOfStock && p.stock <= p.low_stock_threshold;
                const primaryImg = p.images[0]?.url || "/placeholder.png";
                const isDragging = draggedIndex === globalIndex;
                const isDropTarget = dragOverIndex === globalIndex;
                const isSelected = selectedProductIds.includes(p.id);

                return (
                  <tr
                    key={p.id}
                    draggable={canDragReorder}
                    onDragStart={(e) => handleDragStart(e, globalIndex)}
                    onDragOver={(e) => handleDragOver(e, globalIndex)}
                    onDrop={(e) => handleDrop(e, globalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all select-none ${
                      isSelected
                        ? "bg-[#EEEAFB]/60"
                        : isDragging
                        ? "opacity-30 bg-[#FAF5FB]"
                        : isDropTarget
                        ? "border-t-2 border-[#6D4BB8] bg-[#EEEAFB]/40"
                        : "hover:bg-[#FFFBF7]/80"
                    }`}
                  >
                    {/* Individual Checkbox */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectProduct(p.id)}
                        aria-label={`Seleccionar ${p.name}`}
                        className="w-4 h-4 rounded text-[#6D4BB8] accent-[#6D4BB8] cursor-pointer"
                      />
                    </td>

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
                          #{globalIndex + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(globalIndex);
                            }}
                            disabled={!canDragReorder || globalIndex === 0}
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
                            disabled={!canDragReorder || globalIndex === filteredProducts.length - 1}
                            className="p-0.5 text-[#7A7590] hover:text-[#6D4BB8] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Bajar posición"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Producto (Image + Name + Detail) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF5FB] border border-[#F0E8F2] shrink-0">
                          <Image
                            src={primaryImg}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#2E2A3B] line-clamp-1">{p.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-[#7A7590]">
                            {p.brand && <span>{p.brand} • </span>}
                            <span>{p.detail || "Estándar"}</span>
                            {p.sku && <span className="font-mono text-[#6D4BB8]">({p.sku})</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría & Subcategoría */}
                    <td className="py-3.5 px-4 text-[#7A7590]">
                      <div>{p.category_name || "General"}</div>
                      {p.subcategory && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEAFB] text-[#6D4BB8] border border-[#E0D4F0]">
                          {p.subcategory}
                        </span>
                      )}
                    </td>

                    {/* Precio & Costo */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2E2A3B]">{formatCOP(p.price)}</div>
                      {p.cost && p.cost > 0 && (
                        <div className="text-[10px] text-[#7A7590]" title="Costo interno registrado">
                          Costo: {formatCOP(p.cost)}
                        </div>
                      )}
                      {p.compare_price && (
                        <div className="text-[10px] text-gray-400 line-through">
                          {formatCOP(p.compare_price)}
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700"
                            : isLowStock
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {p.stock} un.
                      </span>
                    </td>

                    {/* Activo Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "is_active", p.is_active)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          p.is_active ? "bg-[#6D4BB8]" : "bg-gray-200"
                        }`}
                        title={p.is_active ? "Desactivar de la tienda" : "Activar en la tienda"}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                            p.is_active ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Destacado Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "is_featured", p.is_featured)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          p.is_featured
                            ? "text-[#F472A8] bg-[#FCE4EF]"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                        title={p.is_featured ? "Quitar de destacados" : "Fijar en destacados"}
                      >
                        <Star className={`w-4 h-4 ${p.is_featured ? "fill-current" : ""}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 text-[#7A7590] hover:text-[#6D4BB8] transition-colors cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 text-[#7A7590] hover:text-[#2E2A3B] transition-colors cursor-pointer"
                          title="Duplicar producto"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingProductId(p.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-[#7A7590] hover:text-rose-600 transition-colors cursor-pointer"
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
          </div>
        )}

        {/* Pagination Controls */}
        <AdminPagination
          currentPage={currentPage}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="productos"
          selectedCount={selectedProductIds.length}
        />
      </div>

      {/* ================================================================= */}
      {/* STICKY BULK ACTIONS BAR (When 1 or more items are selected) */}
      {/* ================================================================= */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-3.5 rounded-2xl shadow-2xl border border-[#6D4BB8]/30 flex items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-[#F0E8F2]">
            <span className="w-6 h-6 rounded-full bg-[#6D4BB8] text-white text-xs font-black flex items-center justify-center">
              {selectedProductIds.length}
            </span>
            <span className="text-xs font-bold text-[#2E2A3B] hidden sm:inline">
              {selectedProductIds.length === 1 ? "seleccionado" : "seleccionados"}
            </span>
          </div>

          {selectedProductIds.length < filteredProducts.length && (
            <button
              type="button"
              onClick={() => setSelectedProductIds(filteredProducts.map((p) => p.id))}
              className="text-xs text-[#6D4BB8] hover:text-[#5837A3] font-bold underline cursor-pointer pr-1"
            >
              Seleccionar todos ({filteredProducts.length})
            </button>
          )}

          {/* Activar */}
          <button
            type="button"
            disabled={isBulkUpdatingStatus}
            onClick={() => handleBulkUpdateStatus(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Activar todos los productos seleccionados en la tienda"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Activar</span>
          </button>

          {/* Desactivar */}
          <button
            type="button"
            disabled={isBulkUpdatingStatus}
            onClick={() => handleBulkUpdateStatus(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Ocultar de la tienda los productos seleccionados"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>Desactivar</span>
          </button>

          {/* Cambiar Categoría / Subcategoría */}
          <button
            type="button"
            onClick={() => {
              const firstSelected = products.find((p) => p.id === selectedProductIds[0]);
              setBulkTargetCategoryId(firstSelected?.category_id || categories[0]?.id || "");
              setBulkTargetSubcategory(firstSelected?.subcategory || "");
              setBulkCustomSubcategory("");
              setBulkCategoryMode("both");
              setIsBulkCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6D4BB8] border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
            title="Cambiar categoría o subcategoría a los productos seleccionados"
          >
            <FolderTree className="w-3.5 h-3.5 text-[#6D4BB8]" />
            <span>Cambiar Categoría</span>
          </button>

          {/* Eliminar Masivo */}
          <button
            type="button"
            disabled={isBulkDeleting}
            onClick={() => setIsConfirmBulkDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Eliminar permanentemente todos los productos seleccionados"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          {/* Cancelar Selección */}
          <button
            type="button"
            onClick={() => setSelectedProductIds([])}
            className="text-xs text-[#7A7590] hover:text-[#2E2A3B] font-semibold underline cursor-pointer pl-1"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* EXCEL / CSV BULK IMPORT PREVIEW MODAL */}
      {/* ================================================================= */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isImportingExcel && setIsExcelModalOpen(false)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E8F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#2E2A3B]">
                    Carga Masiva de Productos ({excelParsedProducts.length} detectados)
                  </h3>
                  <p className="text-xs text-[#7A7590]">
                    Revisa la vista previa de los productos que se importarán al catálogo de alyshop.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isImportingExcel}
                onClick={() => setIsExcelModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#7A7590] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice about image upload */}
            <div className="my-4 p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center gap-3 text-xs text-[#6D4BB8]">
              <Sparkles className="w-5 h-5 shrink-0 text-[#F472A8]" />
              <span>
                <strong>Subida sin imagen:</strong> Los productos se crearán con una imagen base elegante. Podrás personalizar las fotos individuales cuando quieras desde el panel de edición.
              </span>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto border border-[#F0E8F2] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5FB] text-[11px] font-bold uppercase text-[#7A7590] sticky top-0 border-b border-[#F0E8F2]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Subcategoría</th>
                    <th className="py-2.5 px-3">Precio</th>
                    <th className="py-2.5 px-3">Costo</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F2F9]">
                  {excelParsedProducts.map((p, idx) => {
                    const catName = categories.find((c) => c.id === p.category_id)?.name || "General";
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-[#7A7590]">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-[#2E2A3B]">{p.name}</td>
                        <td className="py-2 px-3 text-[#7A7590]">{catName}</td>
                        <td className="py-2 px-3 text-[#6D4BB8] font-semibold">{p.subcategory || "-"}</td>
                        <td className="py-2 px-3 font-bold text-[#2E2A3B]">{formatCOP(p.price)}</td>
                        <td className="py-2 px-3 text-[#7A7590]">{p.cost ? formatCOP(p.cost) : "-"}</td>
                        <td className="py-2 px-3 text-center font-bold text-[#2E2A3B]">{p.stock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-[#F0E8F2] flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isImportingExcel}
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isImportingExcel}
                onClick={handleConfirmExcelImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isImportingExcel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando a la tienda...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Importar {excelParsedProducts.length} Productos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BULK DELETE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {isConfirmBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isBulkDeleting && setIsConfirmBulkDeleteOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl z-10 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-[#2E2A3B]">
                ¿Eliminar {selectedProductIds.length} productos seleccionados?
              </h3>
              <p className="text-xs text-[#7A7590] leading-relaxed">
                Esta acción eliminará de forma permanente los productos seleccionados y sus imágenes del catálogo de alyshop. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setIsConfirmBulkDeleteOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar {selectedProductIds.length} Productos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BULK CATEGORY / SUBCATEGORY UPDATE MODAL */}
      {/* ================================================================= */}
      {isBulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => !isUpdatingBulkCategory && setIsBulkCategoryModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 space-y-5 shadow-2xl z-10 animate-in zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#6D4BB8] flex items-center justify-center border border-purple-100 shrink-0">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#2E2A3B]">
                    Cambiar Categoría / Subcategoría en Lote
                  </h3>
                  <p className="text-xs text-[#7A7590]">
                    Reasigna rápidamente los <strong className="text-[#6D4BB8]">{selectedProductIds.length} productos</strong> seleccionados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUpdatingBulkCategory}
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E2A3B] block">
                  ¿Qué deseas modificar en los productos seleccionados?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkCategoryMode("both")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      bulkCategoryMode === "both"
                        ? "bg-[#6D4BB8] text-white border-[#5837A3] shadow-2xs"
                        : "bg-[#FAF5FB] text-[#7A7590] border-[#F0E8F2] hover:bg-gray-50"
                    }`}
                  >
                    Categoría y Subcategoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkCategoryMode("category_only")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      bulkCategoryMode === "category_only"
                        ? "bg-[#6D4BB8] text-white border-[#5837A3] shadow-2xs"
                        : "bg-[#FAF5FB] text-[#7A7590] border-[#F0E8F2] hover:bg-gray-50"
                    }`}
                  >
                    Solo Categoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkCategoryMode("subcategory_only")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      bulkCategoryMode === "subcategory_only"
                        ? "bg-[#6D4BB8] text-white border-[#5837A3] shadow-2xs"
                        : "bg-[#FAF5FB] text-[#7A7590] border-[#F0E8F2] hover:bg-gray-50"
                    }`}
                  >
                    Solo Subcategoría
                  </button>
                </div>
              </div>

              {/* Destination Category */}
              {bulkCategoryMode !== "subcategory_only" && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2]">
                  <label className="text-xs font-bold text-[#2E2A3B] flex items-center justify-between">
                    <span>Nueva Categoría de Destino *</span>
                    <span className="text-[10px] text-[#6D4BB8] font-bold">Obligatorio</span>
                  </label>
                  <select
                    value={bulkTargetCategoryId}
                    onChange={(e) => {
                      setBulkTargetCategoryId(e.target.value);
                      setBulkTargetSubcategory("");
                      setBulkCustomSubcategory("");
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Subcategory */}
              {bulkCategoryMode !== "category_only" && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2]">
                  <label className="text-xs font-bold text-[#2E2A3B] flex items-center justify-between">
                    <span>Nueva Subcategoría *</span>
                    <span className="text-[10px] text-[#7A7590]">Opcional / Flexible</span>
                  </label>
                  {(() => {
                    const catObj = categories.find((c) => c.id === bulkTargetCategoryId);
                    const subList = catObj?.subcategories || [];

                    return (
                      <div className="space-y-2">
                        <select
                          value={bulkTargetSubcategory}
                          onChange={(e) => setBulkTargetSubcategory(e.target.value)}
                          className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white border border-[#E0D4F0] focus:outline-none focus:border-[#6D4BB8] cursor-pointer"
                        >
                          <option value="">Sin subcategoría (General)</option>
                          {subList.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                          <option value="__custom__">+ Escribir nueva subcategoría personalizada...</option>
                        </select>

                        {bulkTargetSubcategory === "__custom__" && (
                          <input
                            type="text"
                            value={bulkCustomSubcategory}
                            onChange={(e) => setBulkCustomSubcategory(e.target.value)}
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

              {/* Selected Products Preview */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                  Productos que se modificarán ({selectedProductIds.length}):
                </span>
                <div className="max-h-40 overflow-y-auto border border-[#F0E8F2] rounded-2xl divide-y divide-[#F7F2F9]">
                  {products
                    .filter((p) => selectedProductIds.includes(p.id))
                    .map((p) => {
                      const currentCatName =
                        p.category_name ||
                        categories.find((c) => c.id === p.category_id)?.name ||
                        "Sin categoría";
                      const targetCatName =
                        categories.find((c) => c.id === bulkTargetCategoryId)?.name ||
                        currentCatName;

                      const nextSub =
                        bulkTargetSubcategory === "__custom__"
                          ? bulkCustomSubcategory.trim()
                          : bulkTargetSubcategory;

                      return (
                        <div
                          key={p.id}
                          className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF5FB]/50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.images[0]?.url || "/placeholder.png"}
                              alt={p.name}
                              className="w-7 h-7 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-[#2E2A3B] truncate max-w-[200px] sm:max-w-xs">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-[#7A7590] truncate">
                                {p.sku || "Sin SKU"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-[#7A7590] line-through block">
                              {currentCatName} {p.subcategory ? `(${p.subcategory})` : ""}
                            </span>
                            <span className="text-[10px] font-bold text-[#6D4BB8] block">
                              &rarr; {bulkCategoryMode === "subcategory_only" ? currentCatName : targetCatName}
                              {bulkCategoryMode !== "category_only" && nextSub ? ` (${nextSub})` : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E8F2]">
              <button
                type="button"
                disabled={isUpdatingBulkCategory}
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isUpdatingBulkCategory ||
                  (bulkCategoryMode !== "subcategory_only" && !bulkTargetCategoryId)
                }
                onClick={handleConfirmBulkUpdateCategory}
                className="px-5 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isUpdatingBulkCategory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Aplicar a {selectedProductIds.length} Productos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DRAWER: CREAR O EDITAR PRODUCTO */}
      {/* ================================================================= */}
      {isDrawerOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#F0E8F2] flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <h2 className="text-lg font-bold text-[#2E2A3B]">
                  {editingProduct.id ? "Editar Producto" : "Nuevo Producto"}
                </h2>
                <p className="text-xs text-[#7A7590]">
                  Ingresa datos del producto, precios, fotos e inventario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#7A7590]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 flex-1">
              {/* General Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                  Información Básica
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2E2A3B]">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Termo de Acero Inoxidable 500 ml"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#2E2A3B]">
                      Slug (URL amigable) *
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

                {/* Subcategoría selector */}
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
                  Precios, Costos y Ganancia
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
                    <label className="text-xs font-semibold text-[#2E2A3B]" title="Para calcular la inversión y ganancia en el Dashboard">
                      Costo Interno (Inversión)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.cost ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          cost: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="Ej: 15000"
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                    />
                  </div>
                </div>

                {/* Live Profit Margin Pill */}
                {editingProduct.price !== undefined &&
                  editingProduct.cost !== undefined &&
                  editingProduct.cost > 0 && (
                    <div className="p-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-between text-xs">
                      <span className="text-[#7A7590] font-semibold">Ganancia estimada por unidad:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#6D4BB8]">
                          +{formatCOP(Math.max(0, editingProduct.price - editingProduct.cost))}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEAFB] text-[#6D4BB8]">
                          Margen:{" "}
                          {editingProduct.price > 0
                            ? (((editingProduct.price - editingProduct.cost) / editingProduct.price) * 100).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  )}

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

              {/* Images */}
              <div className="space-y-4 pt-4 border-t border-[#F0E8F2]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                      Galería de Imágenes ({editingProduct.images?.length || 0}/5)
                    </h3>
                    <p className="text-[11px] text-[#7A7590]">
                      Formatos JPG, PNG, WEBP. Se optimizan automáticamente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {(editingProduct.images || []).map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 group ${
                        img.is_primary ? "border-[#F472A8]" : "border-[#F0E8F2]"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt="Product upload"
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                        {!img.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="px-2 py-0.5 rounded bg-white text-[9px] font-bold text-[#6D4BB8] hover:bg-gray-100 cursor-pointer"
                          >
                            Principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {img.is_primary && (
                        <div className="absolute top-1 left-1 bg-[#F472A8] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                          Portada
                        </div>
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
                  className="flex-1 py-3 rounded-xl border border-[#F0E8F2] text-xs font-bold text-[#7A7590] hover:bg-gray-50 cursor-pointer"
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
      {/* DELETE / DEACTIVATE CONFIRMATION MODAL (Single Product) */}
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
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Solo Desactivar (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(false)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Eliminar Permanentemente
              </button>
              <button
                type="button"
                onClick={() => setDeletingProductId(null)}
                className="w-full py-2 text-xs font-semibold text-[#7A7590] hover:text-[#2E2A3B] cursor-pointer"
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
