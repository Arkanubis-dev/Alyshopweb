import { Header } from "@/components/tienda/Header";
import { BottomValueStrip } from "@/components/tienda/BottomValueStrip";
import { Footer } from "@/components/tienda/Footer";
import { MobileBottomNav } from "@/components/tienda/MobileBottomNav";
import { WhatsAppFloatingButton } from "@/components/tienda/WhatsAppFloatingButton";
import { CategoryWatermarks } from "@/components/tienda/CategoryWatermarks";
import { getAdminSettingsAction } from "@/app/actions/settings";
import { getCategories } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getAdminSettingsAction(),
    getCategories(),
  ]);

  // Solo categorías activas para navegación móvil y de escritorio
  const activeCategories = (categories || []).filter((c) => c.is_active !== false);

  return (
    <div className="tienda-root min-h-screen flex flex-col bg-[#FFFBF7] relative">
      {/* Marcas de agua semi-transparentes de iconos de categorías en el fondo */}
      <CategoryWatermarks />

      {/* Contenido de la tienda en capa relativa superior */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          logoUrl={settings.logo_url}
          storeName={settings.name}
          headerBg={settings.header_bg_color}
          categories={activeCategories}
        />
        <main className="flex-1">{children}</main>
        <BottomValueStrip />
        <Footer categories={activeCategories} />
        <WhatsAppFloatingButton />
        <MobileBottomNav categories={activeCategories} />
      </div>
    </div>
  );
}
