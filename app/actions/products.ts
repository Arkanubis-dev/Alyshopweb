"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Product } from "@/types";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { getSubcategoriesConfig } from "./categories";

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
          subcategory: subConfig.products[item.id] || "",
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
        if (productData.subcategory) {
          subConfig.products[finalId] = productData.subcategory;
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

