"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { BannerSlide } from "@/types";
import { MOCK_BANNERS } from "@/lib/mock-data";

const globalForBanners = global as unknown as { adminBanners: BannerSlide[] };
const adminBannersStore =
  globalForBanners.adminBanners || [...MOCK_BANNERS];

if (process.env.NODE_ENV !== "production") {
  globalForBanners.adminBanners = adminBannersStore;
}

export async function getAllAdminBannersAction(): Promise<BannerSlide[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((b: any, index: number) => {
          const gradients = [
            "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]",
            "from-[#EEEAFB] via-[#E0EEFB] to-[#FFFBF7]",
            "from-[#FFF1CC] via-[#DDF3EC] to-[#FFFBF7]",
          ];
          return {
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            highlight_text: "",
            cta_text: b.cta_text || "¡Descubre más!",
            link: b.link || "/#productos",
            image_url: b.image_url,
            bg_gradient: gradients[index % gradients.length],
            sort_order: b.sort_order || index + 1,
            is_active: b.is_active,
          };
        });
      }
    }
    return adminBannersStore;
  } catch (err) {
    console.error("Error in getAllAdminBannersAction:", err);
    return adminBannersStore;
  }
}

export async function saveBannerAction(bannerData: Partial<BannerSlide>): Promise<{
  success: boolean;
  error?: string;
  banner?: BannerSlide;
}> {
  try {
    const isNew = !bannerData.id || bannerData.id.startsWith("temp-");
    const bannerId = isNew ? `banner-${Date.now()}` : bannerData.id!;

    const supabase = createAdminClient();
    if (supabase) {
      const payload = {
        title: bannerData.title,
        subtitle: bannerData.subtitle,
        cta_text: bannerData.cta_text || "¡Descubre más!",
        link: bannerData.link || "/#productos",
        image_url: bannerData.image_url,
        sort_order: bannerData.sort_order || 1,
        is_active: bannerData.is_active ?? true,
      };

      if (isNew) {
        await supabase.from("banners").insert(payload);
      } else {
        await supabase.from("banners").update(payload).eq("id", bannerId);
      }
    }

    const newBanner: BannerSlide = {
      id: bannerId,
      title: bannerData.title || "Nuevo banner",
      subtitle: bannerData.subtitle || "",
      highlight_text: bannerData.highlight_text || "",
      cta_text: bannerData.cta_text || "¡Descubre más!",
      link: bannerData.link || "/#productos",
      image_url: bannerData.image_url || "",
      bg_gradient: bannerData.bg_gradient || "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]",
      sort_order: bannerData.sort_order || 1,
      is_active: bannerData.is_active ?? true,
    };

    const idx = adminBannersStore.findIndex((b) => b.id === bannerId);
    if (idx >= 0) {
      adminBannersStore[idx] = newBanner;
    } else {
      adminBannersStore.push(newBanner);
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true, banner: newBanner };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBannerAction(bannerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("banners").delete().eq("id", bannerId);
    }

    const idx = adminBannersStore.findIndex((b) => b.id === bannerId);
    if (idx >= 0) {
      adminBannersStore.splice(idx, 1);
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleBannerStatusAction(
  bannerId: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("banners").update({ is_active }).eq("id", bannerId);
    }

    const item = adminBannersStore.find((b) => b.id === bannerId);
    if (item) {
      item.is_active = is_active;
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
