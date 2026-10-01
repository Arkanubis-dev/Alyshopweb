"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { StoreSettings } from "@/types";

const DEFAULT_SETTINGS: StoreSettings = {
  name: "alyshop",
  slogan: "Todo lo que necesitas, en un solo lugar",
  city: "Bogotá",
  whatsapp_number: "573213052913",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  default_shipping_cost: 0,
  low_stock_threshold: 3,
  footer_invoice_text:
    "Gracias por tu compra en alyshop. Resumen de pedido para gestión interna de la tienda y no constituye una factura electrónica ante la DIAN.",
  logo_url: "",
  color_palette: "pastel-morado",
  primary_color: "#6D4BB8",
  secondary_color: "#F472A8",
  header_bg_color: "#FFFFFF",
  text_color: "#2E2A3B",
};

const globalForSettings = global as unknown as { adminSettings: StoreSettings };
const adminSettingsStore =
  globalForSettings.adminSettings || { ...DEFAULT_SETTINGS };

if (process.env.NODE_ENV !== "production") {
  globalForSettings.adminSettings = adminSettingsStore;
}

export async function getAdminSettingsAction(): Promise<StoreSettings> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from("settings").select("*");
      if (!error && data && data.length > 0) {
        const map: Record<string, any> = {};
        data.forEach((r: any) => {
          map[r.key] = r.value;
        });

        return {
          name: map.store_info?.name || DEFAULT_SETTINGS.name,
          slogan: map.store_info?.slogan || DEFAULT_SETTINGS.slogan,
          city: map.store_info?.city || DEFAULT_SETTINGS.city,
          whatsapp_number: map.whatsapp?.number || DEFAULT_SETTINGS.whatsapp_number,
          instagram_url: map.social?.instagram ?? (process.env.NEXT_PUBLIC_INSTAGRAM_URL || ""),
          facebook_url: map.social?.facebook ?? (process.env.NEXT_PUBLIC_FACEBOOK_URL || ""),
          tiktok_url: map.social?.tiktok ?? (process.env.NEXT_PUBLIC_TIKTOK_URL || ""),
          default_shipping_cost: Number(map.shipping?.default_cost ?? 0),
          low_stock_threshold: Number(map.store_info?.low_stock_threshold ?? 3),
          footer_invoice_text:
            map.store_info?.footer_note || DEFAULT_SETTINGS.footer_invoice_text,
          logo_url: map.store_info?.logo_url || "",
          color_palette: map.theme?.palette || DEFAULT_SETTINGS.color_palette,
          primary_color: map.theme?.primary_color || DEFAULT_SETTINGS.primary_color,
          secondary_color: map.theme?.secondary_color || DEFAULT_SETTINGS.secondary_color,
          header_bg_color: map.theme?.header_bg_color || DEFAULT_SETTINGS.header_bg_color,
          text_color: map.theme?.text_color || DEFAULT_SETTINGS.text_color,
        };
      }
    }
    return adminSettingsStore;
  } catch (err) {
    console.error("Error in getAdminSettingsAction:", err);
    return adminSettingsStore;
  }
}

export async function saveAdminSettingsAction(
  newSettings: StoreSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("settings").upsert([
        {
          key: "store_info",
          value: {
            name: newSettings.name,
            slogan: newSettings.slogan,
            city: newSettings.city,
            low_stock_threshold: newSettings.low_stock_threshold,
            footer_note: newSettings.footer_invoice_text,
            logo_url: newSettings.logo_url || "",
          },
        },
        {
          key: "theme",
          value: {
            palette: newSettings.color_palette || "pastel-morado",
            primary_color: newSettings.primary_color || "#6D4BB8",
            secondary_color: newSettings.secondary_color || "#F472A8",
            header_bg_color: newSettings.header_bg_color || "#FFFFFF",
            text_color: newSettings.text_color || "#2E2A3B",
          },
        },
        {
          key: "whatsapp",
          value: {
            number: newSettings.whatsapp_number,
          },
        },
        {
          key: "shipping",
          value: {
            default_cost: newSettings.default_shipping_cost,
          },
        },
        {
          key: "social",
          value: {
            instagram: newSettings.instagram_url || "",
            facebook: newSettings.facebook_url || "",
            tiktok: newSettings.tiktok_url || "",
          },
        },
      ]);
    }

    Object.assign(adminSettingsStore, newSettings);

    revalidatePath("/admin/ajustes");
    revalidatePath("/", "layout");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
