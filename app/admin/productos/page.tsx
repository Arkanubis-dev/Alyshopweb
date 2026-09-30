import type { Metadata } from "next";
import { getAllAdminProducts } from "@/app/actions/products";
import { getCategories } from "@/lib/supabase/queries";
import { ProductManagementView } from "@/components/admin/ProductManagementView";

export const metadata: Metadata = {
  title: "Gestión de Productos | Admin alyshop",
  description: "Administra el catálogo completo de productos de alyshop.",
};

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAllAdminProducts(),
    getCategories(),
  ]);

  return <ProductManagementView initialProducts={products} categories={categories} />;
}
