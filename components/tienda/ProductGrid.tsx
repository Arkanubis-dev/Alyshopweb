import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  title?: string;
  products: Product[];
  viewAllLink?: string;
}

export function ProductGrid({
  title = "Productos destacados",
  products,
  viewAllLink = "/categoria/todos",
}: ProductGridProps) {
  return (
    <section id="productos-destacados" className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#F0E8F2]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F472A8]" />
          <h2 className="text-lg sm:text-xl font-bold text-[#2E2A3B] tracking-tight">
            {title}
          </h2>
        </div>

        <Link
          href={viewAllLink}
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#6D4BB8] hover:text-[#F472A8] transition-colors group"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid of Product Cards (2 col mobile, 3 col tablet, 4 col desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5">
        {products.map((product) => (
          <div key={product.id} className="h-full">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
