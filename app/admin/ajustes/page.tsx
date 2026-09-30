import { Metadata } from "next";
import { getAdminSettingsAction } from "@/app/actions/settings";
import { SettingsView } from "@/components/admin/SettingsView";

export const metadata: Metadata = {
  title: "Ajustes de la Tienda | Admin Alyshop",
  description: "Configura la información general de la tienda, WhatsApp y tarifas",
};

export const dynamic = "force-dynamic";

export default async function AdminAjustesPage() {
  const settings = await getAdminSettingsAction();

  return <SettingsView initialSettings={settings} />;
}
