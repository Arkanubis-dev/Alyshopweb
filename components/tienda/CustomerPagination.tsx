"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export type CustomerPageSizeOption = 20 | 40 | 60 | 80 | 100 | "all";

interface CustomerPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: CustomerPageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: CustomerPageSizeOption) => void;
  itemLabel?: string;
  scrollTargetId?: string;
}

export function CustomerPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "productos",
  scrollTargetId,
}: CustomerPaginationProps) {
  const effectiveSize = pageSize === "all" ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectiveSize));

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * effectiveSize + 1;
  const endItem = pageSize === "all" ? totalItems : Math.min(totalItems, currentPage * effectiveSize);

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    if (scrollTargetId && typeof window !== "undefined") {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Generate page numbers with smart ellipsis
  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [1];

    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  if (totalItems === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#F0E8F2] shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
      {/* Left: Summary text */}
      <div className="text-[#7A7590] text-center sm:text-left">
        <span>
          Mostrando <strong className="text-[#2E2A3B]">{startItem}</strong> -{" "}
          <strong className="text-[#2E2A3B]">{endItem}</strong> de{" "}
          <strong className="text-[#6D4BB8]">{totalItems}</strong> {itemLabel}
        </span>
      </div>

      {/* Right: Page size selector and page navigation */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
        {/* Selector de cantidad por página (saltos de 20 en 20) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label htmlFor="customerPageSizeSelect" className="text-[#7A7590] text-xs font-medium">
            Ver:
          </label>
          <select
            id="customerPageSizeSelect"
            value={pageSize}
            onChange={(e) => {
              const val =
                e.target.value === "all" ? "all" : (Number(e.target.value) as CustomerPageSizeOption);
              onPageSizeChange(val);
              handlePageChange(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-[#2E2A3B] text-xs font-bold focus:outline-none focus:border-[#6D4BB8] hover:border-[#D8C7F0] transition-colors cursor-pointer"
          >
            <option value={20}>20 por página</option>
            <option value={40}>40 por página</option>
            <option value={60}>60 por página</option>
            <option value={80}>80 por página</option>
            <option value={100}>100 por página</option>
            <option value="all">Todos ({totalItems})</option>
          </select>
        </div>

        {/* Botones de navegación entre páginas */}
        {pageSize !== "all" && totalPages > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Primera página */}
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              aria-label="Primera página"
              title="Primera página"
              className="p-1.5 rounded-xl border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Página anterior */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              title="Página anterior"
              className="p-1.5 rounded-xl border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {visiblePages.map((page, idx) => {
                if (page === "ellipsis") {
                  return (
                    <span key={`ell-${idx}`} className="px-1 text-[#7A7590] select-none font-bold">
                      ...
                    </span>
                  );
                }

                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#6D4BB8] text-white shadow-xs"
                        : "border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Página siguiente */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Página siguiente"
              title="Página siguiente"
              className="p-1.5 rounded-xl border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Última página */}
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              aria-label="Última página"
              title="Última página"
              className="p-1.5 rounded-xl border border-[#F0E8F2] text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
