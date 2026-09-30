import type { Metadata } from "next";
import { searchProducts } from "@/lib/supabase/queries";
import { SearchView } from "@/components/tienda/SearchView";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q = "" } = await searchParams;
  return {
    title: q ? `Búsqueda: "${q}" | alyshop` : "Buscar productos | alyshop",
    description: `Encuentra ${q || "artículos"} al mejor precio en alyshop Colombia.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const products = q.trim() ? await searchProducts(q.trim()) : [];

  return <SearchView initialQuery={q} initialProducts={products} />;
}
