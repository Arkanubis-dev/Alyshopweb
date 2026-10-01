import {
  getCategories,
  getFeaturedProducts,
  getBanners,
} from "@/lib/supabase/queries";
import { MOCK_TRUST_ITEMS } from "@/lib/mock-data";
import { CategorySidebar } from "@/components/tienda/CategorySidebar";
import { HeroCarousel } from "@/components/tienda/HeroCarousel";
import { CategoryPills } from "@/components/tienda/CategoryPills";
import { ProductGrid } from "@/components/tienda/ProductGrid";
import { TrustCards } from "@/components/tienda/TrustCards";
import { MiniCartCard } from "@/components/tienda/MiniCartCard";
import { PromoBannerCard } from "@/components/tienda/PromoBannerCard";

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function HomePage() {
  // Fetch real data from Supabase (or automatic mock fallback if no credentials yet)
  const [categories, featuredProducts, bannerSlides] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getBanners(),
  ]);

  const trustItems = MOCK_TRUST_ITEMS;

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
      {/* 3-Column Layout (Desktop >= 1280px) */}
      <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA (~240px, Desktop >= 1280px) */}
        {/* ======================================================== */}
        <aside className="hidden xl:block w-[240px] shrink-0 sticky top-22 self-start">
          <CategorySidebar categories={categories} />
        </aside>

        {/* ======================================================== */}
        {/* COLUMNA CENTRAL (La más ancha) */}
        {/* ======================================================== */}
        <main className="flex-1 min-w-0 w-full space-y-6 sm:space-y-8">
          {/* a) Banner Hero Carousel */}
          <HeroCarousel slides={bannerSlides} />

          {/* b) Fila de Categorías Circulares */}
          <CategoryPills categories={categories} />

          {/* c) Sección "Productos destacados" (4 columnas en desktop) */}
          <ProductGrid
            title="Productos destacados"
            products={featuredProducts}
            viewAllLink="/categoria/todos"
          />

          {/* Mobile & Tablet Fallback for Right Column Elements */}
          <div className="lg:hidden space-y-6 pt-4 border-t border-[#F0E8F2]">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                Compra con total tranquilidad
              </h3>
              <TrustCards items={trustItems} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniCartCard />
              <PromoBannerCard />
            </div>
          </div>
        </main>

        {/* ======================================================== */}
        {/* COLUMNA DERECHA (~260px, Desktop >= 1024px/1280px) */}
        {/* ======================================================== */}
        <aside className="hidden lg:flex flex-col w-[260px] shrink-0 space-y-5 sticky top-22 self-start">
          {/* a) Tres tarjetas de confianza */}
          <TrustCards items={trustItems} />

          {/* b) Tarjeta "Tu carrito" (mini carrito) */}
          <MiniCartCard />

          {/* c) Banner decorativo vertical */}
          <PromoBannerCard />
        </aside>
      </div>
    </div>
  );
}
