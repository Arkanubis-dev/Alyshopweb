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

export async function getSubcategoriesConfig(supabaseClient?: any): Promise<{
  categories: Record<string, string[]>;
  products: Record<string, string>;
}> {
  try {
    const supabase = supabaseClient || createAdminClient();
    if (!supabase) return { categories: {}, products: {} };
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "subcategories_config")
      .single();
    return {
      categories: data?.value?.categories || {},
      products: data?.value?.products || {},
    };
  } catch {
    return { categories: {}, products: {} };
  }
}

export async function getCategoryIconsConfig(supabaseClient?: any): Promise<Record<string, string>> {
  try {
    const supabase = supabaseClient || createAdminClient();
    if (!supabase) return {};
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "category_icons_config")
      .single();
    return data?.value?.icons || {};
  } catch {
    return {};
  }
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
        const [subConfig, iconsConfig] = await Promise.all([
          getSubcategoriesConfig(supabase),
          getCategoryIconsConfig(supabase),
        ]);

        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          icon: item.icon || "Grid",
          color: item.color || "#FCE4EF",
          sort_order: item.sort_order || 0,
          is_active: item.is_active,
          subcategories: subConfig.categories[item.id] || [],
          image_url: iconsConfig[item.id] || item.image_url || undefined,
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
      const payload: Record<string, any> = {
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

      if (categoryData.subcategories !== undefined) {
        const subConfig = await getSubcategoriesConfig(supabase);
        subConfig.categories[categoryId] = categoryData.subcategories;
        await supabase.from("settings").upsert({
          key: "subcategories_config",
          value: subConfig,
        });
      }

      if (categoryData.image_url !== undefined) {
        const iconsConfig = await getCategoryIconsConfig(supabase);
        if (categoryData.image_url) {
          iconsConfig[categoryId] = categoryData.image_url;
        } else {
          delete iconsConfig[categoryId];
        }
        await supabase.from("settings").upsert({
          key: "category_icons_config",
          value: { icons: iconsConfig },
        });
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
      subcategories: categoryData.subcategories || [],
      image_url: categoryData.image_url || undefined,
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

      const subConfig = await getSubcategoriesConfig(supabase);
      if (subConfig.categories[categoryId]) {
        delete subConfig.categories[categoryId];
        await supabase.from("settings").upsert({
          key: "subcategories_config",
          value: subConfig,
        });
      }
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

export async function bulkAddSubcategoryAction(
  categoryIds: string[],
  subcategoryName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = subcategoryName.trim();
    if (!trimmed || !categoryIds || categoryIds.length === 0) {
      return { success: false, error: "Datos de subcategoría inválidos" };
    }

    const supabase = createAdminClient();
    if (supabase) {
      const subConfig = await getSubcategoriesConfig(supabase);
      for (const catId of categoryIds) {
        const currentSubs = subConfig.categories[catId] || [];
        if (!currentSubs.includes(trimmed)) {
          subConfig.categories[catId] = [...currentSubs, trimmed];
        }
      }
      await supabase.from("settings").upsert({
        key: "subcategories_config",
        value: subConfig,
      });
    }

    // Update fallback memory store
    for (const catId of categoryIds) {
      const cat = adminCategoriesStore.find((c) => c.id === catId);
      if (cat) {
        const subs = cat.subcategories || [];
        if (!subs.includes(trimmed)) {
          cat.subcategories = [...subs, trimmed];
        }
      }
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in bulkAddSubcategoryAction:", err);
    return { success: false, error: err.message || "Error al agregar subcategoría masiva" };
  }
}

export async function getActiveCategoriesAction(): Promise<Category[]> {
  try {
    const all = await getAllAdminCategories();
    return all.filter((c) => c.is_active !== false);
  } catch (err) {
    console.error("Error in getActiveCategoriesAction:", err);
    return [];
  }
}



