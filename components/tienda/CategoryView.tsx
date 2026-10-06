"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal, ArrowUpDown, X, Sparkles, Filter } from "lucide-react";
import { Category, Product } from "@/types";
import { isSubcategoryMatch } from "@/lib/subcategories";
import { ProductCard } from "./ProductCard";
import { CategorySidebar } from "./CategorySidebar";

interface CategoryViewProps {
  category: Category | null;
  initialProducts: Product[];
  categories: Category[];
  slug: string;
}

export function CategoryView({
  category,
  initialProducts,
  categories,
  slug,
}: CategoryViewProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("todas");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("recientes");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Available subcategories combining category configuration and actual product subcategories
  const availableSubcategories = useMemo(() => {
    const fromCat = category?.subcategories || [];
    const fromProducts = initialProducts
      .map((p) => p.subcategory?.trim())
      .filter((s): s is string => Boolean(s && s.length > 0));

    const seen = new Set<string>();
    const result: string[] = [];

    for (const sub of [...fromCat, ...fromProducts]) {
      const norm = sub
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        result.push(sub);
      }
    }
    return result;
  }, [category?.subcategories, initialProducts]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        if (
          selectedSubcategory !== "todas" &&
          !isSubcategoryMatch(p.subcategory, selectedSubcategory)
        ) {
          return false;
        }
        if (onlyAvailable && p.stock <= 0) return false;
        if (minPrice && p.price < Number(minPrice)) return false;
        if (maxPrice && p.price > Number(maxPrice)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "precio_asc") return a.price - b.price;
        if (sortBy === "precio_desc") return b.price - a.price;
        if (sortBy === "nombre") return a.name.localeCompare(b.name);
        return 0; // recientes (default order)
      });
  }, [initialProducts, selectedSubcategory, onlyAvailable, minPrice, maxPrice, sortBy]);

  const hasActiveFilters = Boolean(minPrice || maxPrice || onlyAvailable || selectedSubcategory !== "todas");

  const resetFilters = () => {
    setSelectedSubcategory("todas");
    setMinPrice("");
    setMaxPrice("");
    setOnlyAvailable(false);
    setSortBy("recientes");
  };

  const categoryName = category?.name || (slug === "todos" ? "Todos los productos" : "Categoría");

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7A7590]">
        <Link href="/" className="hover:text-[#6D4BB8] transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <Link href="/categoria/todos" className="hover:text-[#6D4BB8] transition-colors">
          Categorías
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <span className="font-semibold text-[#6D4BB8] truncate max-w-[200px]">
          {categoryName}
        </span>
      </nav>

      {/* Category Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#FDE8DD] via-[#FCE4EF] to-[#EEEAFB] p-6 sm:p-8 border border-[#F0E8F2] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 text-[11px] font-bold text-[#6D4BB8] mb-2 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#F472A8]" />
              <span>Catálogo alyshop</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {category?.image_url && (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/90 border border-white/80 p-2 flex items-center justify-center shadow-xs shrink-0">
                  <img src={category.image_url} alt={categoryName} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E2A3B] tracking-tight">
                  {categoryName}
                </h1>
                <p className="text-xs sm:text-sm text-[#7A7590] mt-0.5">
                  Explora nuestra selección especial de artículos útiles y bonitos.
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/70 shadow-2xs text-center self-start sm:self-center">
            <span className="text-xl font-bold text-[#6D4BB8]">
              {filteredProducts.length}
            </span>
            <p className="text-[11px] text-[#7A7590]">
              {filteredProducts.length === 1 ? "artículo disponible" : "artículos disponibles"}
            </p>
          </div>
        </div>

        {/* Subcategories Filter Pills */}
        {availableSubcategories.length > 0 && (
          <div className="pt-5 mt-4 border-t border-black/5 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-10">
            <span className="text-xs font-bold text-[#6D4BB8] shrink-0 mr-1">
              Subcategorías:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSubcategory("todas")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubcategory === "todas"
                  ? "bg-[#6D4BB8] text-white shadow-xs"
                  : "bg-white/90 border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8]"
              }`}
            >
              Todas
            </button>
            {availableSubcategories.map((sub) => {
              const isSelected = isSubcategoryMatch(selectedSubcategory, sub);
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubcategory(isSelected ? "todas" : sub)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#6D4BB8] text-white shadow-xs"
                      : "bg-white/90 border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8]"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Layout: Left Sidebar + Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column (Desktop) */}
        <aside className="hidden lg:block w-[260px] shrink-0 space-y-6 sticky top-22 self-start">
          {/* Categories Sidebar */}
          <CategorySidebar categories={categories} activeSlug={slug} />

          {/* Filters Card */}
          <div className="bg-white rounded-2xl border border-[#F0E8F2] shadow-xs p-4.5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#FAF5FC]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#6D4BB8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E2A3B]">
                  Filtros
                </h3>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-[#F472A8] hover:underline font-semibold"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* In stock filter */}
            <label className="flex items-center gap-2.5 text-xs text-[#2E2A3B] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-[#F472A8] accent-[#F472A8] focus:ring-[#FCE4EF] cursor-pointer"
              />
              <span className="font-medium">Solo disponibles (con stock)</span>
            </label>

            {/* Price Range */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#7A7590]">Rango de precio (COP)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8]"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Controls Bar (Mobile filter toggle + Sort dropdown) */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#F0E8F2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FCE4EF] text-[#6D4BB8] text-xs font-bold shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros {hasActiveFilters && "•"}</span>
            </button>

            {/* Active Filters tags */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <>
                  <span className="text-xs text-[#7A7590]">Filtros activos:</span>
                  {onlyAvailable && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EEEAFB] text-[#6D4BB8] text-xs font-medium">
                      Con stock
                      <button onClick={() => setOnlyAvailable(false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EEEAFB] text-[#6D4BB8] text-xs font-medium">
                      Precio {minPrice ? `>$${minPrice}` : ""} {maxPrice ? `<$${maxPrice}` : ""}
                      <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7A7590]" />
              <label htmlFor="sortSelect" className="text-xs text-[#7A7590] hidden sm:inline">
                Ordenar por:
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold text-[#2E2A3B] bg-[#FAF5FB] border border-[#F0E8F2] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#F472A8] cursor-pointer"
              >
                <option value="recientes">Novedades</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4.5">
              {filteredProducts.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#F0E8F2] p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FCE4EF]/60 text-[#6D4BB8] flex items-center justify-center mx-auto">
                <Filter className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#2E2A3B]">
                  No encontramos productos con estos filtros
                </h3>
                <p className="text-xs text-[#7A7590] max-w-sm mx-auto">
                  Prueba modificando el rango de precio o desactivando el filtro de stock para ver más opciones.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Restablecer todos los filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white p-5 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8F2]">
              <h3 className="text-sm font-bold text-[#2E2A3B]">Filtros</h3>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1 rounded-full text-[#7A7590] hover:text-[#2E2A3B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              <label className="flex items-center gap-2.5 text-xs text-[#2E2A3B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F472A8] accent-[#F472A8]"
                />
                <span className="font-semibold">Solo disponibles con stock</span>
              </label>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#7A7590]">Precio mínimo (COP)</span>
                <input
                  type="number"
                  placeholder="Ej: 20000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#7A7590]">Precio máximo (COP)</span>
                <input
                  type="number"
                  placeholder="Ej: 80000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0E8F2] flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 py-2 text-xs font-bold text-[#7A7590] border border-[#F0E8F2] rounded-xl"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-2 text-xs font-bold bg-[#F472A8] text-white rounded-xl shadow-xs"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
