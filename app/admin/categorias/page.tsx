import type { Metadata } from "next";
import { getAllAdminCategories } from "@/app/actions/categories";
import { getAllAdminProducts } from "@/app/actions/products";
import { CategoryManagementView } from "@/components/admin/CategoryManagementView";

export const metadata: Metadata = {
  title: "Gestión de Categorías | Admin alyshop",
  description: "Administra las categorías de productos de la tienda alyshop.",
};

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getAllAdminCategories(),
    getAllAdminProducts(),
  ]);

  return (
    <CategoryManagementView
      initialCategories={categories}
      products={products}
    />
  );
}
