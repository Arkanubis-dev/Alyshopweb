import type { Metadata } from "next";
import { getFeaturedProducts } from "@/lib/supabase/queries";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { FavoritesView } from "@/components/tienda/FavoritesView";

export const metadata: Metadata = {
  title: "Mis Favoritos | alyshop Colombia",
  description: "Revisa y administra los artículos que has guardado en alyshop.",
};

export default async function FavoritesPage() {
  const featured = await getFeaturedProducts();
  // Combine all known products for matching favorites
  const allProducts = featured.length > 0 ? featured : MOCK_PRODUCTS;

  return <FavoritesView allProducts={allProducts} />;
}
