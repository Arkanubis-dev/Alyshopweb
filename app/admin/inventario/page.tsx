import type { Metadata } from "next";
import { getAllAdminProducts } from "@/app/actions/products";
import { getInventoryMovementsAction } from "@/app/actions/inventory";
import { InventoryView } from "@/components/admin/InventoryView";

export const metadata: Metadata = {
  title: "Control de Inventario | Admin alyshop",
  description: "Monitoreo y ajuste de stock en tiempo real para alyshop.",
};

export default async function AdminInventoryPage() {
  const [products, movements] = await Promise.all([
    getAllAdminProducts(),
    getInventoryMovementsAction(),
  ]);

  return <InventoryView initialProducts={products} initialMovements={movements} />;
}
