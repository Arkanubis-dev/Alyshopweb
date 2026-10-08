"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Plus, Check, ChevronDown, Package, AlertCircle } from "lucide-react";
import { Product } from "@/types";
import { formatCOP } from "@/lib/utils";

interface ProductSearchComboboxProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Normaliza texto eliminando acentos, tildes y convirtiendo a minúsculas
 */
function normalizeText(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Distancia de Levenshtein optimizada para calcular similitud de palabras
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);
  for (let j = 0; j <= n; j++) prevRow[j] = j;

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const c1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = c1 === s2.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,
        currRow[j - 1] + 1,
        prevRow[j - 1] + cost
      );
    }
    for (let j = 0; j <= n; j++) prevRow[j] = currRow[j];
  }
  return prevRow[n];
}

/**
 * Evalúa relevancia de un producto contra la búsqueda:
 * Soporta mayúsculas/minúsculas, tildes, búsqueda por nombre, marca, detalle, categoría y errores tipográficos (similares)
 */
function scoreProduct(product: Product, normQuery: string, queryTokens: string[]): number {
  if (!normQuery) return 0;

  const normName = normalizeText(product.name);
  const normBrand = normalizeText(product.brand || "");
  const normDetail = normalizeText(product.detail || "");
  const normCat = normalizeText(product.category_name || "");
  const normSku = normalizeText(product.sku || "");

  const fullSearchable = `${normName} ${normBrand} ${normDetail} ${normCat} ${normSku}`;

  // 1. Coincidencia exacta de nombre
  if (normName === normQuery) return 1000;

  // 2. Empieza por el término
  if (normName.startsWith(normQuery)) return 800;

  // 3. Contiene la frase completa en el nombre
  if (normName.includes(normQuery)) return 600;

  // 4. Contiene la frase completa en algún atributo (marca, detalle, categoría)
  if (fullSearchable.includes(normQuery)) return 450;

  // 5. Coincidencia de tokens individuales
  const targetWords = fullSearchable.split(/[\s,./\-_+]+/).filter(Boolean);
  let tokensMatched = 0;
  let hasFuzzyMatch = false;

  for (const token of queryTokens) {
    if (!token) continue;

    // Coincidencia exacta de palabra o prefijo
    const exactWordMatch = targetWords.some((w) => w === token || w.startsWith(token));
    if (exactWordMatch) {
      tokensMatched += 1;
      continue;
    }

    // Subcadena dentro de una palabra
    const subMatch = targetWords.some((w) => w.includes(token));
    if (subMatch) {
      tokensMatched += 0.8;
      continue;
    }

    // Similitud fonética / errores tipográficos (Levenshtein)
    if (token.length >= 3) {
      const maxAllowedDist = token.length <= 4 ? 1 : 2;
      const similar = targetWords.some((w) => {
        const slice = w.slice(0, token.length + 1);
        return levenshteinDistance(token, slice) <= maxAllowedDist;
      });

      if (similar) {
        tokensMatched += 0.6;
        hasFuzzyMatch = true;
      }
    }
  }

  const tokenRatio = queryTokens.length > 0 ? tokensMatched / queryTokens.length : 0;

  if (tokenRatio >= 1.0) {
    return 300 + tokensMatched * 10;
  }
  if (tokenRatio >= 0.5) {
    return 160 + tokensMatched * 10;
  }
  if (hasFuzzyMatch || tokensMatched > 0) {
    return 60 + tokensMatched * 10;
  }

  return 0;
}

export function ProductSearchCombobox({
  products,
  onSelectProduct,
  placeholder = "🔍 Escribe para buscar producto por nombre, marca o detalle...",
  className = "",
}: ProductSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockTab, setStockTab] = useState<"todos" | "con_stock" | "sin_stock">("todos");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Catálogo completo ordenado alfabéticamente A-Z
  const baseAlphabeticalProducts = useMemo(() => {
    return [...products].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }, [products]);

  // Lista de productos coincidentes con la búsqueda (ordenados por relevancia o alfabético A-Z)
  const searchMatchedProducts = useMemo(() => {
    const norm = normalizeText(searchQuery);
    if (!norm) {
      return baseAlphabeticalProducts;
    }

    const tokens = norm.split(/\s+/).filter(Boolean);

    const scored = baseAlphabeticalProducts
      .map((product) => ({
        product,
        score: scoreProduct(product, norm, tokens),
      }))
      .filter((item) => item.score > 0);

    // Ordenar primero por mayor puntaje de coincidencia, luego alfabéticamente A-Z
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.product.name.localeCompare(b.product.name, "es", { sensitivity: "base" });
    });

    return scored.map((item) => item.product);
  }, [baseAlphabeticalProducts, searchQuery]);

  // Conteo de existencias para las pestañas de filtro rápido
  const stockCounts = useMemo(() => {
    let conStock = 0;
    let sinStock = 0;
    for (const p of searchMatchedProducts) {
      if (p.stock > 0) {
        conStock++;
      } else {
        sinStock++;
      }
    }
    return {
      total: searchMatchedProducts.length,
      conStock,
      sinStock,
    };
  }, [searchMatchedProducts]);

  // Productos filtrados según la pestaña de stock activa
  const filteredProducts = useMemo(() => {
    if (stockTab === "con_stock") {
      return searchMatchedProducts.filter((p) => p.stock > 0);
    }
    if (stockTab === "sin_stock") {
      return searchMatchedProducts.filter((p) => p.stock <= 0);
    }
    return searchMatchedProducts;
  }, [searchMatchedProducts, stockTab]);

  // Reset highlight cuando cambia la lista filtrada
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredProducts.length, searchQuery, stockTab]);

  // Manejo de teclado (flechas, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredProducts.length ? prev + 1 : 0));
      scrollIntoView(highlightedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredProducts.length - 1));
      scrollIntoView(highlightedIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts[highlightedIndex]) {
        handleAdd(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-item-index]");
    const target = items[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ block: "nearest" });
    }
  };

  const handleAdd = (product: Product) => {
    onSelectProduct(product);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1200);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Campo de búsqueda interactivo */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#6D4BB8] pointer-events-none flex items-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-white border border-[#E8DEF0] focus:border-[#6D4BB8] focus:ring-2 focus:ring-[#6D4BB8]/15 outline-none text-xs sm:text-sm font-medium text-[#2E2A3B] transition-all shadow-2xs placeholder:text-[#9A93A8]"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              title="Borrar filtro"
              className="p-1 rounded-full text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? "Ocultar catálogo" : "Ver catálogo A-Z"}
            className="p-1.5 rounded-xl text-[#6D4BB8] hover:bg-[#FAF5FB] transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Popover / Menú Desplegable con Productos Ordenados Alfabéticamente y Filtrados */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#E8DEF0] shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-98 duration-150">
          {/* Barra superior de estado */}
          <div className="px-3.5 py-2 bg-[#FAF5FB] border-b border-[#F0E8F2] flex items-center justify-between text-[11px] text-[#7A7590] flex-wrap gap-2">
            <span className="font-semibold text-[#6D4BB8] flex items-center gap-1.5">
              <span>Catálogo Alfabético (A-Z)</span>
              <span className="px-1.5 py-0.2 bg-[#6D4BB8]/10 text-[#6D4BB8] rounded-full text-[10px] font-bold">
                {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}
              </span>
            </span>
            <span className="hidden sm:inline text-[10px] text-[#9A93A8]">
              {searchQuery ? "Resultados por similitud y A-Z" : "Ordenado de la A a la Z"}
            </span>
          </div>

          {/* Pestañas de filtrado de stock rápido (Todos, Con stock, Sin stock) */}
          <div className="px-3 py-1.5 bg-[#FAF5FB]/80 border-b border-[#F0E8F2] flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[#7A7590] uppercase tracking-wider mr-1">
              Filtro:
            </span>
            <button
              type="button"
              onClick={() => setStockTab("todos")}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                stockTab === "todos"
                  ? "bg-[#6D4BB8] text-white shadow-2xs"
                  : "bg-white text-[#7A7590] hover:text-[#2E2A3B] border border-[#F0E8F2]"
              }`}
            >
              Todos ({stockCounts.total})
            </button>
            <button
              type="button"
              onClick={() => setStockTab("con_stock")}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                stockTab === "con_stock"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-white text-[#7A7590] hover:text-[#2E2A3B] border border-[#F0E8F2]"
              }`}
            >
              Con stock ({stockCounts.conStock})
            </button>
            <button
              type="button"
              onClick={() => setStockTab("sin_stock")}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                stockTab === "sin_stock"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-[#7A7590] hover:text-[#2E2A3B] border border-[#F0E8F2]"
              }`}
            >
              Sin stock / Histórico ({stockCounts.sinStock})
            </button>
          </div>

          {/* Lista de productos */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto divide-y divide-[#F7F2F9] overscroll-contain"
          >
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#2E2A3B]">
                  {stockTab === "sin_stock"
                    ? "No hay productos sin stock que coincidan con la búsqueda."
                    : `No se encontraron productos para "${searchQuery}"`}
                </p>
                <p className="text-[11px] text-[#7A7590]">
                  Verifica que esté bien escrito o selecciona &quot;Todos&quot; para revisar el catálogo completo.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {stockTab !== "todos" && (
                    <button
                      type="button"
                      onClick={() => setStockTab("todos")}
                      className="text-xs text-[#6D4BB8] font-bold underline cursor-pointer"
                    >
                      Ver todos
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-[#6D4BB8] font-bold underline cursor-pointer"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredProducts.map((p, index) => {
                const isHighlighted = index === highlightedIndex;
                const isJustAdded = justAddedId === p.id;
                const primaryImg = p.images?.[0]?.url;

                return (
                  <div
                    key={p.id}
                    data-item-index={index}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isHighlighted ? "bg-[#FAF5FB]" : "hover:bg-[#FAF5FB]"
                    }`}
                  >
                    {/* Info del producto */}
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1"
                      onClick={() => handleAdd(p)}
                    >
                      {/* Imagen o Ícono */}
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={p.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[#F0E8F2] shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-center text-[#6D4BB8] shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      {/* Textos y Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-xs sm:text-[13px] text-[#2E2A3B] truncate leading-tight">
                            {p.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] flex-wrap">
                          <span className="font-extrabold text-[#6D4BB8]">
                            {formatCOP(p.price)}
                          </span>

                          {p.detail && (
                            <span className="text-[#7A7590] truncate max-w-[120px]">
                              • {p.detail}
                            </span>
                          )}

                          {p.brand && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#6D4BB8] font-semibold text-[10px]">
                              {p.brand}
                            </span>
                          )}

                          {p.stock > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              {p.stock} disp.
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Sin stock (Apto histórico)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botón de Agregar Rápido */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(p);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                          isJustAdded
                            ? "bg-emerald-600 text-white scale-105"
                            : "bg-[#6D4BB8] hover:bg-[#5837A3] text-white hover:scale-102"
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Agregado!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie informativo */}
          <div className="px-3.5 py-2 bg-gradient-to-r from-[#FAF5FB] to-white border-t border-[#F0E8F2] flex items-center justify-between text-[11px] text-[#7A7590] flex-wrap gap-1">
            <span>💡 Haz clic en <b>Agregar</b> para sumar productos al pedido (incluso sin stock para pedidos históricos)</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-[#6D4BB8] hover:underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
