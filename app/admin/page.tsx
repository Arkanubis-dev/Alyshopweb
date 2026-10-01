import { Metadata } from "next";
import { getAllAdminOrdersAction } from "@/app/actions/orders";
import { getAllAdminProducts } from "@/app/actions/products";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const metadata: Metadata = {
  title: "Dashboard y Estadísticas | Admin Alyshop",
  description: "Monitoreo de ventas, inversión vs ganancia, envíos y salud de inventario en Alyshop",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([
    getAllAdminOrdersAction(),
    getAllAdminProducts(),
  ]);

  return <AdminDashboardView initialOrders={orders} initialProducts={products} />;
}
