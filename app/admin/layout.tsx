import type { Metadata } from "next";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { getAdminSettingsAction } from "@/app/actions/settings";

export const metadata: Metadata = {
  title: "Panel Admin | alyshop",
  description: "Panel de administración y gestión para alyshop.",
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getAdminSettingsAction();

  return (
    <AdminLayoutClient logoUrl={settings.logo_url} storeName={settings.name}>
      {children}
    </AdminLayoutClient>
  );
}
