import { Header } from "@/components/tienda/Header";
import { BottomValueStrip } from "@/components/tienda/BottomValueStrip";
import { Footer } from "@/components/tienda/Footer";
import { MobileBottomNav } from "@/components/tienda/MobileBottomNav";
import { WhatsAppFloatingButton } from "@/components/tienda/WhatsAppFloatingButton";
import { getAdminSettingsAction } from "@/app/actions/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getAdminSettingsAction();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF7]">
      <Header
        logoUrl={settings.logo_url}
        storeName={settings.name}
        headerBg={settings.header_bg_color}
      />
      <main className="flex-1">{children}</main>
      <BottomValueStrip />
      <Footer />
      <WhatsAppFloatingButton />
      <MobileBottomNav />
    </div>
  );
}
