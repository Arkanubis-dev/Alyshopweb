import { Metadata } from "next";
import { getAllAdminBannersAction } from "@/app/actions/banners";
import { BannersView } from "@/components/admin/BannersView";

export const metadata: Metadata = {
  title: "Gestión de Banners | Admin Alyshop",
  description: "Administra los carruseles e imágenes promocionales principales de Alyshop",
};

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await getAllAdminBannersAction();

  return <BannersView initialBanners={banners} />;
}
