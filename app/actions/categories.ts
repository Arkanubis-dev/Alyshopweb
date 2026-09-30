"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Category } from "@/types";
import { MOCK_CATEGORIES } from "@/lib/mock-data";

// Fallback in-memory categories store
const globalForCategories = global as unknown as { adminCategories: Category[] };
const adminCategoriesStore =
  globalForCategories.adminCategories || [...MOCK_CATEGORIES];

if (process.env.NODE_ENV !== "production") {
  globalForCategories.adminCategories = adminCategoriesStore;
}

export async function getAllAdminCategories(): Promise<Category[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          icon: item.icon || "Grid",
          color: item.color || "#FCE4EF",
          sort_order: item.sort_order || 0,
          is_active: item.is_active,
        }));
      }
    }
    return adminCategoriesStore;
  } catch (err) {
    console.error("Error in getAllAdminCategories:", err);
    return adminCategoriesStore;
  }
}

export async function saveCategoryAction(categoryData: Partial<Category>): Promise<{
  success: boolean;
  error?: string;
  category?: Category;
}> {
  try {
    const isNew = !categoryData.id || categoryData.id.startsWith("temp-");
    const categoryId = isNew ? `cat-${Date.now()}` : categoryData.id!;

    const supabase = createAdminClient();
    if (supabase) {
      const payload = {
        name: categoryData.name,
        slug: categoryData.slug,
        icon: categoryData.icon || "Grid",
        color: categoryData.color || "#FCE4EF",
        sort_order: categoryData.sort_order || 0,
        is_active: categoryData.is_active ?? true,
      };

      if (isNew) {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", categoryId);
        if (error) throw error;
      }
    }

    const newCategory: Category = {
      id: categoryId,
      name: categoryData.name || "Nueva categoría",
      slug: categoryData.slug || `categoria-${Date.now()}`,
      icon: categoryData.icon || "Grid",
      color: categoryData.color || "#FCE4EF",
      sort_order: categoryData.sort_order || 0,
      is_active: categoryData.is_active ?? true,
    };

    const idx = adminCategoriesStore.findIndex((c) => c.id === categoryId);
    if (idx >= 0) {
      adminCategoriesStore[idx] = newCategory;
    } else {
      adminCategoriesStore.push(newCategory);
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");
    return { success: true, category: newCategory };
  } catch (err: any) {
    console.error("Error saving category:", err);
    return { success: false, error: err.message || "Error al guardar categoría" };
  }
}

export async function deleteCategoryAction(
  categoryId: string,
  moveToCategoryId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      if (moveToCategoryId) {
        // Move products to new category before deleting
        await supabase
          .from("products")
          .update({ category_id: moveToCategoryId })
          .eq("category_id", categoryId);
      } else {
        // Check if there are products
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", categoryId);

        if (count && count > 0) {
          return {
            success: false,
            error: `Esta categoría tiene ${count} producto(s) asignado(s). Por favor selecciona a qué categoría moverlos antes de eliminarla.`,
          };
        }
      }

      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw error;
    }

    const idx = adminCategoriesStore.findIndex((c) => c.id === categoryId);
    if (idx >= 0) {
      adminCategoriesStore.splice(idx, 1);
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleCategoryStatusAction(
  categoryId: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from("categories")
        .update({ is_active })
        .eq("id", categoryId);
    }

    const item = adminCategoriesStore.find((c) => c.id === categoryId);
    if (item) {
      item.is_active = is_active;
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function reorderCategoriesAction(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase && orderedIds.length > 0) {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from("categories")
          .update({ sort_order: index + 1 })
          .eq("id", id)
      );
      await Promise.all(updates);
    }

    // Update in-memory fallback store
    orderedIds.forEach((id, index) => {
      const cat = adminCategoriesStore.find((c) => c.id === id);
      if (cat) {
        cat.sort_order = index + 1;
      }
    });
    adminCategoriesStore.sort((a, b) => a.sort_order - b.sort_order);

    revalidatePath("/admin/categorias");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error reordering categories:", err);
    return { success: false, error: err.message || "Error al reordenar categorías" };
  }
}

