"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Product } from "@/types";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { getSubcategoriesConfig, getAllAdminCategories } from "./categories";
import { getCanonicalSubcategoryName, normalizeSubcategory } from "@/lib/subcategories";

// Fallback products in-memory store for local demo mode
const globalForProducts = global as unknown as { adminProducts: Product[] };
const adminProductsStore =
  globalForProducts.adminProducts || [...MOCK_PRODUCTS];

if (process.env.NODE_ENV !== "production") {
  globalForProducts.adminProducts = adminProductsStore;
}

export async function getAllAdminProducts(): Promise<Product[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (name),
          product_images (*)
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const subConfig = await getSubcategoriesConfig(supabase);
        const mapped = data.map((item: any) => ({
          id: item.id,
          category_id: item.category_id,
          category_name: item.categories?.name || "",
          subcategory: subConfig.products[item.id] || item.subcategory || "",
          name: item.name,
          slug: item.slug,
          description: item.description || "",
          detail: item.detail || "",
          brand: item.brand,
          sku: item.sku,
          price: Number(item.price),
          compare_price: item.compare_price ? Number(item.compare_price) : undefined,
          cost: item.cost ? Number(item.cost) : undefined,
          stock: item.stock ?? 0,
          low_stock_threshold: item.low_stock_threshold ?? 3,
          is_active: item.is_active,
          is_featured: item.is_featured,
          rating_avg: Number(item.rating_avg) || 5.0,
          rating_count: item.rating_count || 0,
          images: (item.product_images || []).map((img: any) => ({
            id: img.id,
            url: img.url,
            sort_order: img.sort_order || 0,
            is_primary: Boolean(img.is_primary),
          })),
          created_at: item.created_at,
        }));

        // Fetch display order from settings
        const { data: orderData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "products_display_order")
          .single();

        const orderList: string[] = orderData?.value?.order || [];
        if (orderList.length > 0) {
          const orderMap = new Map(orderList.map((id, idx) => [id, idx]));
          return mapped.sort((a, b) => {
            const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
            const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
            if (posA !== posB) return posA - posB;
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
        }

        return mapped;
      }
    }
    return adminProductsStore;
  } catch (err) {
    console.error("Error in getAllAdminProducts:", err);
    return adminProductsStore;
  }
}

export async function saveProductAction(productData: Partial<Product>): Promise<{
  success: boolean;
  error?: string;
  product?: Product;
}> {
  try {
    const isNew = !productData.id || productData.id.startsWith("temp-");
    const productId = isNew ? `prod-${Date.now()}` : productData.id!;

    const supabase = createAdminClient();

    if (supabase) {
      // Supabase upsert
      const payload = {
        category_id: productData.category_id,
        name: productData.name,
        slug: productData.slug,
        description: productData.description || "",
        detail: productData.detail || "",
        brand: productData.brand || null,
        sku: productData.sku || null,
        price: productData.price,
        compare_price: productData.compare_price || null,
        cost: productData.cost || null,
        stock: productData.stock,
        low_stock_threshold: productData.low_stock_threshold || 3,
        is_active: productData.is_active ?? true,
        is_featured: productData.is_featured ?? false,
      };

      let finalId = productId;
      if (isNew) {
        const { data: inserted, error: insertErr } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (insertErr) throw insertErr;
        finalId = inserted.id;
      } else {
        const { error: updateErr } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (updateErr) throw updateErr;
      }

      // Upsert images
      if (productData.images && productData.images.length > 0) {
        await supabase.from("product_images").delete().eq("product_id", finalId);
        const imgRows = productData.images.map((img, idx) => ({
          product_id: finalId,
          url: img.url,
          sort_order: idx + 1,
          is_primary: img.is_primary || idx === 0,
        }));
        await supabase.from("product_images").insert(imgRows);
      }

      if (productData.subcategory !== undefined) {
        const subConfig = await getSubcategoriesConfig(supabase);
        if (productData.subcategory && productData.subcategory.trim()) {
          const canonical = getCanonicalSubcategoryName(productData.subcategory);
          subConfig.products[finalId] = canonical;
          if (productData.category_id) {
            const currentSubs = subConfig.categories[productData.category_id] || [];
            if (!currentSubs.some((s) => normalizeSubcategory(s) === normalizeSubcategory(canonical))) {
              subConfig.categories[productData.category_id] = [...currentSubs, canonical];
            }
          }
        } else {
          delete subConfig.products[finalId];
        }
        await supabase.from("settings").upsert({
          key: "subcategories_config",
          value: subConfig,
        });
      }
    }

    // Local in-memory update
    const newProduct: Product = {
      id: productId,
      category_id: productData.category_id || "",
      category_name: productData.category_name || "",
      subcategory: productData.subcategory || "",
      name: productData.name || "Nuevo producto",
      slug: productData.slug || `producto-${Date.now()}`,
      description: productData.description || "",
      detail: productData.detail || "",
      brand: productData.brand,
      sku: productData.sku,
      price: productData.price || 0,
      compare_price: productData.compare_price,
      cost: productData.cost,
      stock: productData.stock ?? 0,
      low_stock_threshold: productData.low_stock_threshold ?? 3,
      is_active: productData.is_active ?? true,
      is_featured: productData.is_featured ?? false,
      rating_avg: productData.rating_avg || 5.0,
      rating_count: productData.rating_count || 0,
      images: productData.images || [],
      created_at: new Date().toISOString(),
    };

    const idx = adminProductsStore.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      adminProductsStore[idx] = newProduct;
    } else {
      adminProductsStore.unshift(newProduct);
    }

    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true, product: newProduct };
  } catch (err: any) {
    console.error("Error saving product:", err);
    return { success: false, error: err.message || "Error al guardar producto" };
  }
}

export async function deleteProductAction(
  productId: string,
  deactivateOnly: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      if (deactivateOnly) {
        await supabase.from("products").update({ is_active: false }).eq("id", productId);
      } else {
        await supabase.from("products").delete().eq("id", productId);
        const subConfig = await getSubcategoriesConfig(supabase);
        if (subConfig.products[productId]) {
          delete subConfig.products[productId];
          await supabase.from("settings").upsert({
            key: "subcategories_config",
            value: subConfig,
          });
        }
      }
    }

    const idx = adminProductsStore.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      if (deactivateOnly) {
        adminProductsStore[idx].is_active = false;
      } else {
        adminProductsStore.splice(idx, 1);
      }
    }

    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function duplicateProductAction(productId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const original = adminProductsStore.find((p) => p.id === productId);
  if (!original) return { success: false, error: "Producto original no encontrado" };

  const duplicated: Partial<Product> = {
    ...original,
    id: undefined,
    name: `${original.name} (Copia)`,
    slug: `${original.slug}-copia-${Math.floor(Math.random() * 1000)}`,
    sku: original.sku ? `${original.sku}-COP` : undefined,
    is_active: false, // inactive initially
  };

  return saveProductAction(duplicated);
}

export async function toggleProductFieldAction(
  productId: string,
  field: "is_active" | "is_featured",
  newValue: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from("products")
        .update({ [field]: newValue })
        .eq("id", productId);
    }

    const item = adminProductsStore.find((p) => p.id === productId);
    if (item) {
      item[field] = newValue;
    }

    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Upload an image file to Supabase Storage bucket 'products'
 */
export async function uploadProductImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No se seleccionó archivo" };

    const supabase = createAdminClient();
    if (supabase) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { data, error } = await supabase.storage
        .from("products")
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.warn("Storage upload error in Supabase:", error);
      } else if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(data.path);
        return { success: true, url: publicUrl };
      }
    }

    // Fallback if Supabase storage is not yet active: generate base64 data url
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    return { success: true, url: base64 };
  } catch (err: any) {
    console.error("Upload error:", err);
    return { success: false, error: err.message || "Error al subir imagen" };
  }
}

export async function reorderProductsAction(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase && orderedIds.length > 0) {
      const { error } = await supabase.from("settings").upsert({
        key: "products_display_order",
        value: { order: orderedIds },
      });
      if (error) throw error;
    }

    // Update in-memory fallback store
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    adminProductsStore.sort((a, b) => {
      const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
      const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
      if (posA !== posB) return posA - posB;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    revalidatePath("/admin/productos");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error reordering products:", err);
    return { success: false, error: err.message || "Error al reordenar productos" };
  }
}

export async function bulkUpdateProductStatusAction(
  productIds: string[],
  isActive: boolean
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: true, count: 0 };
    }

    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .in("id", productIds);
      if (error) throw error;
    }

    // Update in-memory fallback
    for (let i = 0; i < adminProductsStore.length; i++) {
      if (productIds.includes(adminProductsStore[i].id)) {
        adminProductsStore[i] = { ...adminProductsStore[i], is_active: isActive };
      }
    }

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");
    return { success: true, count: productIds.length };
  } catch (err: any) {
    console.error("Error in bulkUpdateProductStatusAction:", err);
    return { success: false, count: 0, error: err.message || "Error al actualizar productos" };
  }
}

export async function bulkDeleteProductsAction(
  productIds: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: true, count: 0 };
    }

    const supabase = createAdminClient();
    if (supabase) {
      // 1. Delete images
      await supabase.from("product_images").delete().in("product_id", productIds);

      // 2. Delete products
      const { error } = await supabase.from("products").delete().in("id", productIds);
      if (error) throw error;

      // 3. Clean subcategories config
      const subConfig = await getSubcategoriesConfig(supabase);
      let changed = false;
      for (const id of productIds) {
        if (subConfig.products[id]) {
          delete subConfig.products[id];
          changed = true;
        }
      }
      if (changed) {
        await supabase.from("settings").upsert({
          key: "subcategories_config",
          value: subConfig,
        });
      }
    }

    // In-memory fallback
    for (let i = adminProductsStore.length - 1; i >= 0; i--) {
      if (productIds.includes(adminProductsStore[i].id)) {
        adminProductsStore.splice(i, 1);
      }
    }

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");
    return { success: true, count: productIds.length };
  } catch (err: any) {
    console.error("Error in bulkDeleteProductsAction:", err);
    return { success: false, count: 0, error: err.message || "Error al eliminar productos" };
  }
}

export async function bulkUpdateProductCategoryAction(
  productIds: string[],
  newCategoryId: string,
  newSubcategory?: string,
  updateCategoryOnly: boolean = false,
  updateSubcategoryOnly: boolean = false
): Promise<{
  success: boolean;
  count: number;
  error?: string;
  updatedProducts?: Array<{
    id: string;
    category_id: string;
    category_name: string;
    subcategory: string;
  }>;
}> {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: true, count: 0, updatedProducts: [] };
    }

    const supabase = createAdminClient();
    let catName = "";

    if (newCategoryId && !updateSubcategoryOnly) {
      const allCats = await getAllAdminCategories();
      const found = allCats.find((c) => c.id === newCategoryId);
      if (found) catName = found.name;
    }

    if (supabase) {
      // 1. Update category_id in products table
      if (!updateSubcategoryOnly && newCategoryId) {
        const { error: prodErr } = await supabase
          .from("products")
          .update({ category_id: newCategoryId })
          .in("id", productIds);
        if (prodErr) throw prodErr;
      }

      // 2. Update subcategories_config in settings
      if (!updateCategoryOnly && newSubcategory !== undefined) {
        const subConfig = await getSubcategoriesConfig(supabase);
        const canonicalSub =
          newSubcategory && newSubcategory.trim()
            ? getCanonicalSubcategoryName(newSubcategory.trim())
            : "";

        for (const id of productIds) {
          if (canonicalSub) {
            subConfig.products[id] = canonicalSub;
          } else {
            delete subConfig.products[id];
          }
        }

        if (canonicalSub && newCategoryId) {
          const cur = subConfig.categories[newCategoryId] || [];
          if (!cur.some((s) => normalizeSubcategory(s) === normalizeSubcategory(canonicalSub))) {
            subConfig.categories[newCategoryId] = [...cur, canonicalSub];
          }
        }

        await supabase.from("settings").upsert({
          key: "subcategories_config",
          value: subConfig,
        });
      }
    }

    // 3. Update in-memory fallback store
    const updatedProducts: Array<{
      id: string;
      category_id: string;
      category_name: string;
      subcategory: string;
    }> = [];

    for (let i = 0; i < adminProductsStore.length; i++) {
      const p = adminProductsStore[i];
      if (productIds.includes(p.id)) {
        const updatedCatId = updateSubcategoryOnly ? p.category_id : newCategoryId;
        const updatedCatName = updateSubcategoryOnly
          ? (p.category_name || "")
          : (catName || p.category_name || "");
        const updatedSub =
          !updateCategoryOnly && newSubcategory !== undefined
            ? newSubcategory.trim()
            : (p.subcategory || "");

        adminProductsStore[i] = {
          ...p,
          category_id: updatedCatId,
          category_name: updatedCatName,
          subcategory: updatedSub,
        };

        updatedProducts.push({
          id: p.id,
          category_id: updatedCatId,
          category_name: updatedCatName,
          subcategory: updatedSub,
        });
      }
    }

    revalidatePath("/admin/productos");
    revalidatePath("/admin/categorias");
    revalidatePath("/admin");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");

    return {
      success: true,
      count: productIds.length,
      updatedProducts,
    };
  } catch (err: any) {
    console.error("Error in bulkUpdateProductCategoryAction:", err);
    return {
      success: false,
      count: 0,
      error: err.message || "Error al actualizar categoría de productos",
    };
  }
}

export interface BulkProductInput {
  name: string;
  category_id: string;
  subcategory?: string;
  description?: string;
  detail?: string;
  brand?: string;
  sku?: string;
  price: number;
  compare_price?: number;
  cost?: number;
  stock: number;
  low_stock_threshold?: number;
  is_active?: boolean;
}

export async function bulkImportProductsAction(
  items: BulkProductInput[]
): Promise<{ success: boolean; count: number; error?: string; createdProducts?: Product[] }> {
  try {
    if (!items || items.length === 0) {
      return { success: true, count: 0, createdProducts: [] };
    }

    const supabase = createAdminClient();
    const createdList: Product[] = [];
    const subcategoryMap: Record<string, string> = {};

    const defaultPlaceholderImage =
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const baseSlug = (item.name || "producto")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const slug = `${baseSlug}-${Date.now().toString(36)}-${i}`;
      const sku = item.sku || `ALY-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        category_id: item.category_id,
        name: item.name,
        slug,
        description: item.description || "",
        detail: item.detail || "",
        brand: item.brand || null,
        sku,
        price: Number(item.price) || 0,
        compare_price: item.compare_price ? Number(item.compare_price) : null,
        cost: item.cost ? Number(item.cost) : null,
        stock: Number(item.stock) || 0,
        low_stock_threshold: item.low_stock_threshold || 3,
        is_active: item.is_active ?? true,
        is_featured: false,
      };

      let finalId = `prod-import-${Date.now()}-${i}`;

      if (supabase) {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) {
          console.error("Error inserting imported product:", error);
          continue;
        }
        finalId = inserted.id;

        // Insert placeholder image so it renders cleanly in catalog
        await supabase.from("product_images").insert({
          product_id: finalId,
          url: defaultPlaceholderImage,
          sort_order: 1,
          is_primary: true,
        });
      }

      const cleanSub =
        item.subcategory && item.subcategory.trim()
          ? getCanonicalSubcategoryName(item.subcategory.trim())
          : undefined;

      if (cleanSub) {
        subcategoryMap[finalId] = cleanSub;
      }

      const fullProduct: Product = {
        id: finalId,
        category_id: item.category_id,
        subcategory: cleanSub || "",
        name: item.name,
        slug,
        description: item.description || "",
        detail: item.detail || "",
        brand: item.brand,
        sku,
        price: Number(item.price) || 0,
        compare_price: item.compare_price ? Number(item.compare_price) : undefined,
        cost: item.cost ? Number(item.cost) : undefined,
        stock: Number(item.stock) || 0,
        low_stock_threshold: item.low_stock_threshold || 3,
        is_active: item.is_active ?? true,
        is_featured: false,
        rating_avg: 5.0,
        rating_count: 0,
        images: [
          {
            id: `img-${finalId}`,
            url: defaultPlaceholderImage,
            sort_order: 1,
            is_primary: true,
          },
        ],
        created_at: new Date().toISOString(),
      };

      createdList.push(fullProduct);
      adminProductsStore.unshift(fullProduct);
    }

    // Save subcategories if any
    if (supabase && Object.keys(subcategoryMap).length > 0) {
      const subConfig = await getSubcategoriesConfig(supabase);
      Object.assign(subConfig.products, subcategoryMap);

      // Auto-register imported subcategories in categories list
      for (const item of items) {
        if (item.subcategory && item.subcategory.trim() && item.category_id) {
          const canonical = getCanonicalSubcategoryName(item.subcategory.trim());
          const cur = subConfig.categories[item.category_id] || [];
          if (!cur.some((s) => normalizeSubcategory(s) === normalizeSubcategory(canonical))) {
            subConfig.categories[item.category_id] = [...cur, canonical];
          }
        }
      }

      await supabase.from("settings").upsert({
        key: "subcategories_config",
        value: subConfig,
      });
    }

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");

    return {
      success: true,
      count: createdList.length,
      createdProducts: createdList,
    };
  } catch (err: any) {
    console.error("Error in bulkImportProductsAction:", err);
    return { success: false, count: 0, error: err.message || "Error al importar productos" };
  }
}

export interface BulkImageAttachment {
  productId: string;
  imageUrl: string;
}

export async function bulkAttachProductImagesAction(
  attachments: BulkImageAttachment[]
): Promise<{ success: boolean; count: number; error?: string; updatedProducts?: Product[] }> {
  try {
    if (!attachments || attachments.length === 0) {
      return { success: true, count: 0, updatedProducts: [] };
    }

    const supabase = createAdminClient();
    const updatedProductList: Product[] = [];

    // Group images by productId
    const attachmentsByProduct = new Map<string, string[]>();
    for (const att of attachments) {
      if (att.productId && att.imageUrl) {
        const existing = attachmentsByProduct.get(att.productId) || [];
        existing.push(att.imageUrl);
        attachmentsByProduct.set(att.productId, existing);
      }
    }

    const targetProductIds = Array.from(attachmentsByProduct.keys());

    if (supabase) {
      for (const [prodId, newUrls] of attachmentsByProduct.entries()) {
        // Fetch current images for this product
        const { data: existingImages } = await supabase
          .from("product_images")
          .select("id, url, sort_order, is_primary")
          .eq("product_id", prodId);

        // Detect placeholder images (such as Unsplash default or placeholder URLs)
        const placeholderIds = (existingImages || [])
          .filter(
            (img: any) =>
              img.url?.includes("unsplash.com") ||
              img.url?.includes("placeholder")
          )
          .map((img: any) => img.id);

        if (placeholderIds.length > 0) {
          await supabase.from("product_images").delete().in("id", placeholderIds);
        }

        // Existing real images
        const realExisting = (existingImages || []).filter(
          (img: any) => !placeholderIds.includes(img.id)
        );

        // If there were real existing images, unmark them as primary
        if (realExisting.length > 0) {
          await supabase
            .from("product_images")
            .update({ is_primary: false })
            .eq("product_id", prodId);
        }

        // Insert new images
        const newRows = newUrls.map((url, idx) => ({
          product_id: prodId,
          url,
          sort_order: idx + 1,
          is_primary: idx === 0,
        }));

        await supabase.from("product_images").insert(newRows);
      }
    }

    // Update in-memory fallback store
    for (let i = 0; i < adminProductsStore.length; i++) {
      const p = adminProductsStore[i];
      if (attachmentsByProduct.has(p.id)) {
        const newUrls = attachmentsByProduct.get(p.id)!;
        const realExisting = (p.images || []).filter(
          (img) => !img.url.includes("unsplash.com") && !img.url.includes("placeholder")
        );

        const updatedImgs = [
          ...newUrls.map((url, idx) => ({
            id: `img-${p.id}-${Date.now()}-${idx}`,
            url,
            sort_order: idx + 1,
            is_primary: idx === 0,
          })),
          ...realExisting.map((img, idx) => ({
            ...img,
            sort_order: newUrls.length + idx + 1,
            is_primary: false,
          })),
        ];

        const updatedProd: Product = {
          ...p,
          images: updatedImgs,
        };

        adminProductsStore[i] = updatedProd;
        updatedProductList.push(updatedProd);
      }
    }

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/producto/[slug]", "page");
    revalidatePath("/");

    return {
      success: true,
      count: targetProductIds.length,
      updatedProducts: updatedProductList,
    };
  } catch (err: any) {
    console.error("Error in bulkAttachProductImagesAction:", err);
    return { success: false, count: 0, error: err.message || "Error al asociar imágenes masivas" };
  }
}



