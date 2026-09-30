import { Header } from "@/components/tienda/Header";
import { BottomValueStrip } from "@/components/tienda/BottomValueStrip";
import { Footer } from "@/components/tienda/Footer";
import { MobileBottomNav } from "@/components/tienda/MobileBottomNav";
import { WhatsAppFloatingButton } from "@/components/tienda/WhatsAppFloatingButton";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF7]">
      <Header />
      <main className="flex-1">{children}</main>
      <BottomValueStrip />
      <Footer />
      <WhatsAppFloatingButton />
      <MobileBottomNav />
    </div>
  );
}
