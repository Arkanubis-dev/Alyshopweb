import { createClient } from "./server";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_BANNERS,
} from "@/lib/mock-data";
import { Category, Product, BannerSlide } from "@/types";

/**
 * Helper to map DB record to Product interface
 */
/**
 * Helper to map DB record to Product interface
 */
function mapDbProduct(item: any, subcategoryMap?: Record<string, string>): Product {
  const images = (item.product_images || []).map((img: any) => ({
    id: img.id,
    url: img.url,
    sort_order: img.sort_order || 0,
    is_primary: Boolean(img.is_primary),
  })).sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

  return {
    id: item.id,
    category_id: item.category_id,
    category_name: item.categories?.name || "",
    subcategory: (subcategoryMap && subcategoryMap[item.id]) || "",
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
    images: images.length > 0 ? images : [
      { id: "fallback-img", url: "/placeholder.png", sort_order: 1, is_primary: true }
    ],
    created_at: item.created_at,
  };
}

/**
 * Helper to fetch subcategories configuration from settings
 */
async function getSubcategoriesConfigQuery(supabase: any): Promise<{
  categories: Record<string, string[]>;
  products: Record<string, string>;
}> {
  try {
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

async function getCategoryIconsConfigQuery(supabase: any): Promise<Record<string, string>> {
  try {
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

/**
 * Fetch all active categories from Supabase, ordered by sort_order.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return MOCK_CATEGORIES;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return MOCK_CATEGORIES;
    }

    const [subConfig, iconsConfig] = await Promise.all([
      getSubcategoriesConfigQuery(supabase),
      getCategoryIconsConfigQuery(supabase),
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
  } catch (err) {
    console.error("Error fetching categories from Supabase:", err);
    return MOCK_CATEGORIES;
  }
}

/**
 * Helper to fetch product display order array from settings
 */
async function getProductsDisplayOrder(supabase: any): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "products_display_order")
      .single();
    return data?.value?.order || [];
  } catch {
    return [];
  }
}

/**
 * Helper to sort products according to saved display order
 */
function sortProductsByDisplayOrder(products: Product[], orderList: string[]): Product[] {
  if (!orderList || orderList.length === 0) return products;
  const orderMap = new Map(orderList.map((id, index) => [id, index]));
  return [...products].sort((a, b) => {
    const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
    const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
    if (posA !== posB) return posA - posB;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

/**
 * Fetch featured products from Supabase with their primary images and category name.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return MOCK_PRODUCTS;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          name
        ),
        product_images (
          id,
          url,
          sort_order,
          is_primary
        )
      `)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS;
    }

    const [orderList, subConfig] = await Promise.all([
      getProductsDisplayOrder(supabase),
      getSubcategoriesConfigQuery(supabase),
    ]);
    const mapped = data.map((item: any) => mapDbProduct(item, subConfig.products));
    return sortProductsByDisplayOrder(mapped, orderList);
  } catch (err) {
    console.error("Error fetching products from Supabase:", err);
    return MOCK_PRODUCTS;
  }
}

/**
 * Fetch a single product by its slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
      return found || null;
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          name
        ),
        product_images (
          id,
          url,
          sort_order,
          is_primary
        )
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
      return found || null;
    }

    const subConfig = await getSubcategoriesConfigQuery(supabase);
    return mapDbProduct(data, subConfig.products);
  } catch (err) {
    console.error(`Error fetching product by slug ${slug}:`, err);
    const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
    return found || null;
  }
}

/**
 * Fetch products by category slug (or all products if slug === 'todos').
 */
export async function getProductsByCategory(
  categorySlug: string
): Promise<{ category: Category | null; products: Product[] }> {
  try {
    const categories = await getCategories();
    const isAll = categorySlug === "todos";
    const category = isAll
      ? {
          id: "all",
          name: "Todos los productos",
          slug: "todos",
          icon: "Grid",
          color: "#EEEAFB",
          sort_order: 0,
          is_active: true,
        }
      : categories.find((c) => c.slug === categorySlug) || null;

    const supabase = await createClient();
    if (!supabase) {
      const filtered = isAll
        ? MOCK_PRODUCTS
        : MOCK_PRODUCTS.filter((p) => p.category_id === category?.id);
      return { category, products: filtered };
    }

    let query = supabase
      .from("products")
      .select(`
        *,
        categories (
          name
        ),
        product_images (
          id,
          url,
          sort_order,
          is_primary
        )
      `)
      .eq("is_active", true);

    if (!isAll && category) {
      query = query.eq("category_id", category.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      const filtered = isAll
        ? MOCK_PRODUCTS
        : MOCK_PRODUCTS.filter((p) => p.category_id === category?.id);
      return { category, products: filtered };
    }

    const [orderList, subConfig] = await Promise.all([
      getProductsDisplayOrder(supabase),
      getSubcategoriesConfigQuery(supabase),
    ]);
    const mapped = data.map((item: any) => mapDbProduct(item, subConfig.products));
    return {
      category,
      products: sortProductsByDisplayOrder(mapped, orderList),
    };
  } catch (err) {
    console.error(`Error fetching products for category ${categorySlug}:`, err);
    const category = MOCK_CATEGORIES.find((c) => c.slug === categorySlug) || null;
    return {
      category,
      products: MOCK_PRODUCTS.filter((p) => p.category_id === category?.id),
    };
  }
}

/**
 * Fetch related products in the same category (excluding current product).
 */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit: number = 4
): Promise<Product[]> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return MOCK_PRODUCTS.filter(
        (p) => p.id !== excludeProductId && (p.category_id === categoryId || true)
      ).slice(0, limit);
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          name
        ),
        product_images (
          id,
          url,
          sort_order,
          is_primary
        )
      `)
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .neq("id", excludeProductId)
      .limit(limit);

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS.filter((p) => p.id !== excludeProductId).slice(0, limit);
    }

    return data.map((item: any) => mapDbProduct(item));
  } catch (err) {
    console.error("Error fetching related products:", err);
    return MOCK_PRODUCTS.filter((p) => p.id !== excludeProductId).slice(0, limit);
  }
}

/**
 * Search products by query across name, description, brand, and details.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  try {
    const supabase = await createClient();
    if (!supabase) {
      return MOCK_PRODUCTS.filter((p) => {
        return (
          p.name.toLowerCase().includes(clean) ||
          p.description.toLowerCase().includes(clean) ||
          p.detail.toLowerCase().includes(clean) ||
          (p.brand && p.brand.toLowerCase().includes(clean))
        );
      });
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          name
        ),
        product_images (
          id,
          url,
          sort_order,
          is_primary
        )
      `)
      .eq("is_active", true)
      .or(`name.ilike.%${clean}%,description.ilike.%${clean}%,detail.ilike.%${clean}%,brand.ilike.%${clean}%`)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS.filter((p) => {
        return (
          p.name.toLowerCase().includes(clean) ||
          p.description.toLowerCase().includes(clean) ||
          p.detail.toLowerCase().includes(clean) ||
          (p.brand && p.brand.toLowerCase().includes(clean))
        );
      });
    }

    const subConfig = await getSubcategoriesConfigQuery(supabase);
    return data.map((item: any) => mapDbProduct(item, subConfig.products));
  } catch (err) {
    console.error(`Error searching products for query "${query}":`, err);
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(clean));
  }
}

/**
 * Fetch active hero banners from Supabase.
 */
export async function getBanners(): Promise<BannerSlide[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return MOCK_BANNERS;

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return MOCK_BANNERS;
    }

    return data.map((b: any, index: number) => {
      const defaultGradients = [
        "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]",
        "from-[#EEEAFB] via-[#E0EEFB] to-[#FFFBF7]",
        "from-[#FFF1CC] via-[#DDF3EC] to-[#FFFBF7]",
      ];
      return {
        id: b.id,
        title: b.title,
        highlight_text: "",
        subtitle: b.subtitle,
        cta_text: b.cta_text || "¡Descubre más!",
        link: b.link || "/#productos",
        image_url: b.image_url,
        bg_gradient: defaultGradients[index % defaultGradients.length],
        sort_order: b.sort_order,
        is_active: b.is_active,
      };
    });
  } catch (err) {
    console.error("Error fetching banners from Supabase:", err);
    return MOCK_BANNERS;
  }
}

/**
 * Fetch settings from Supabase.
 */
export async function getStoreSettings(): Promise<Record<string, any>> {
  try {
    const supabase = await createClient();
    if (!supabase) return {};

    const { data, error } = await supabase.from("settings").select("*");
    if (error || !data) return {};

    const settingsMap: Record<string, any> = {};
    data.forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });
    return settingsMap;
  } catch (err) {
    console.error("Error fetching settings from Supabase:", err);
    return {};
  }
}
