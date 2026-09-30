"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Filter, X, ArrowUpDown } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface SearchViewProps {
  initialQuery: string;
  initialProducts: Product[];
}

export function SearchView({ initialQuery, initialProducts }: SearchViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recientes");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        if (onlyAvailable && p.stock <= 0) return false;
        if (minPrice && p.price < Number(minPrice)) return false;
        if (maxPrice && p.price > Number(maxPrice)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "precio_asc") return a.price - b.price;
        if (sortBy === "precio_desc") return b.price - a.price;
        if (sortBy === "nombre") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [initialProducts, onlyAvailable, minPrice, maxPrice, sortBy]);

  const hasActiveFilters = Boolean(onlyAvailable || minPrice || maxPrice);

  const resetFilters = () => {
    setOnlyAvailable(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recientes");
  };

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7A7590]">
        <Link href="/" className="hover:text-[#6D4BB8] transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#7A7590]/50" />
        <span className="font-semibold text-[#6D4BB8]">Búsqueda</span>
      </nav>

      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs p-5 sm:p-8 space-y-4">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2E2A3B]">
            {initialQuery ? (
              <>
                Resultados para: <span className="text-[#6D4BB8]">&ldquo;{initialQuery}&rdquo;</span>
              </>
            ) : (
              "Buscar en toda la tienda"
            )}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590]">
            Encontramos {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "artículo disponible" : "artículos disponibles"}
          </p>

          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="pt-2 relative flex items-center max-w-lg mx-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar termos, bolsos, audífonos..."
              className="w-full h-11 pl-4 pr-12 text-sm text-[#2E2A3B] bg-[#FAF5FB] border border-[#F0E8F2] rounded-full focus:outline-none focus:border-[#F472A8] focus:ring-2 focus:ring-[#FCE4EF]"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 w-9 bg-[#F472A8] hover:bg-[#E35E96] text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#F0E8F2] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#2E2A3B] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-[#F472A8] accent-[#F472A8]"
            />
            <span>Solo disponibles</span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Precio mín"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 text-xs p-1.5 rounded-lg bg-[#FAF5FB] border border-[#F0E8F2]"
            />
            <span className="text-xs text-[#7A7590]">-</span>
            <input
              type="number"
              placeholder="Precio máx"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 text-xs p-1.5 rounded-lg bg-[#FAF5FB] border border-[#F0E8F2]"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#F472A8] hover:underline font-semibold"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#7A7590]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-[#2E2A3B] bg-[#FAF5FB] border border-[#F0E8F2] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#F472A8]"
          >
            <option value="recientes">Novedades</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {filteredProducts.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F0E8F2] p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FCE4EF] text-[#6D4BB8] flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#2E2A3B]">
              No encontramos resultados para &ldquo;{initialQuery}&rdquo;
            </h3>
            <p className="text-xs sm:text-sm text-[#7A7590]">
              Revisa si escribiste bien el nombre o prueba buscando por categorías como Hogar, Belleza o Cocina.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Volver al inicio
            </Link>
            <Link
              href="/categoria/todos"
              className="px-5 py-2.5 bg-[#EEEAFB] text-[#6D4BB8] hover:bg-[#E2DBF7] text-xs font-bold rounded-xl transition-colors"
            >
              Ver todo el catálogo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
