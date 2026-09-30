"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product } from "@/types";
import { formatCOP } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  onSelectSuggestion?: () => void;
}

export function SearchBar({ className = "", onSelectSuggestion }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 300ms Debounce search filter
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(() => {
        const lower = query.toLowerCase().trim();
        const filtered = MOCK_PRODUCTS.filter((product) => {
          return (
            product.name.toLowerCase().includes(lower) ||
            product.description.toLowerCase().includes(lower) ||
            product.category_name?.toLowerCase().includes(lower) ||
            product.brand?.toLowerCase().includes(lower) ||
            product.detail.toLowerCase().includes(lower)
          );
        }).slice(0, 5); // top 5 suggestions

        setResults(filtered);
        setIsOpen(true);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    onSelectSuggestion?.();
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Buscar productos, marcas o categorías..."
          className="w-full h-11 sm:h-12 pl-4 sm:pl-5 pr-14 text-sm sm:text-base text-[#2E2A3B] placeholder:text-[#7A7590]/70 bg-white border border-[#E8DFEC] rounded-full shadow-xs hover:border-[#D6C2E2] focus:border-[#F472A8] focus:ring-3 focus:ring-[#FCE4EF] focus:outline-none transition-all"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-13 text-[#7A7590] hover:text-[#2E2A3B] p-1 rounded-full transition-colors"
            title="Borrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-1 top-1 bottom-1 w-9 sm:w-10 bg-[#F472A8] hover:bg-[#E35E96] text-white rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xs"
          title="Buscar"
          aria-label="Buscar"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
          )}
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#EFE8F4] shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length > 0 ? (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-[#7A7590] bg-[#FFFBF7] border-b border-[#F5EDF7]">
                Sugerencias de productos ({results.length})
              </div>
              <ul className="divide-y divide-[#F9F5FB]">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/producto/${product.slug}`}
                      onClick={() => {
                        setIsOpen(false);
                        onSelectSuggestion?.();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FCE4EF]/30 transition-colors group"
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#FCE4EF]/40 shrink-0 border border-[#F0E5F2]">
                        <Image
                          src={product.images[0]?.url || "/placeholder.png"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2E2A3B] truncate group-hover:text-[#6D4BB8] transition-colors">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#7A7590] truncate">
                          {product.category_name} {product.detail && `• ${product.detail}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-[#6D4BB8]">
                          {formatCOP(product.price)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="p-2.5 bg-[#FFFBF7] border-t border-[#F5EDF7] text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-xs font-semibold text-[#6D4BB8] hover:text-[#55359A] transition-colors"
                >
                  Ver todos los resultados para &quot;{query}&quot; &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-[#7A7590]">
              No encontramos productos que coincidan con &quot;{query}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
