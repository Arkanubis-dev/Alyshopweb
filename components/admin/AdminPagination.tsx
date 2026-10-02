"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export type PageSizeOption = 10 | 20 | 50 | 100 | "all";

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: PageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
  itemLabel?: string;
  selectedCount?: number;
}

export function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "elementos",
  selectedCount = 0,
}: AdminPaginationProps) {
  const effectiveSize = pageSize === "all" ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectiveSize));

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * effectiveSize + 1;
  const endItem = pageSize === "all" ? totalItems : Math.min(totalItems, currentPage * effectiveSize);

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

  return (
    <div className="p-4 bg-white border-t border-[#F0E8F2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
      {/* Left: Summary text & active multi-selection badge */}
      <div className="flex flex-wrap items-center gap-2 text-[#7A7590]">
        <span>
          Mostrando <strong className="text-[#2E2A3B]">{startItem}</strong> -{" "}
          <strong className="text-[#2E2A3B]">{endItem}</strong> de{" "}
          <strong className="text-[#2E2A3B]">{totalItems}</strong> {itemLabel}
        </span>

        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6D4BB8] text-white shadow-2xs">
            ✓ {selectedCount} seleccionados
          </span>
        )}
      </div>

      {/* Right: Page size selector and page navigation */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Page size dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#7A7590] text-xs">Ver:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value === "all" ? "all" : (Number(e.target.value) as PageSizeOption);
              onPageSizeChange(val);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-[#2E2A3B] text-xs font-semibold focus:outline-none focus:border-[#6D4BB8] cursor-pointer"
          >
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
            <option value={50}>50 por pág.</option>
            <option value={100}>100 por pág.</option>
            <option value="all">Todos ({totalItems})</option>
          </select>
        </div>

        {/* Navigation buttons (only if not viewing "all" and more than 1 page) */}
        {pageSize !== "all" && totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1}
              aria-label="Primera página"
              className="p-1.5 rounded-lg border border-[#F0E8F2] text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              className="p-1.5 rounded-lg border border-[#F0E8F2] text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {visiblePages.map((page, idx) => {
                if (page === "ellipsis") {
                  return (
                    <span key={`ell-${idx}`} className="px-1 text-[#7A7590] select-none">
                      ...
                    </span>
                  );
                }

                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#6D4BB8] text-white shadow-xs"
                        : "border border-[#F0E8F2] text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Página siguiente"
              className="p-1.5 rounded-lg border border-[#F0E8F2] text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
              aria-label="Última página"
              className="p-1.5 rounded-lg border border-[#F0E8F2] text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
