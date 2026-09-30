import Link from "next/link";
import {
  Menu,
  Home,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Headphones,
  Gamepad2,
  BookOpen,
  Dumbbell,
  PawPrint,
  Grid,
  ChevronRight,
} from "lucide-react";
import { Category } from "@/types";

interface CategorySidebarProps {
  categories: Category[];
  activeSlug?: string;
}

const ICON_MAP: Record<string, any> = {
  Home,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Headphones,
  Gamepad2,
  BookOpen,
  Dumbbell,
  PawPrint,
  Grid,
};

export function CategorySidebar({ categories, activeSlug }: CategorySidebarProps) {
  return (
    <aside className="w-full bg-white rounded-2xl border border-[#F0E8F2] shadow-xs overflow-hidden">
      {/* Header with menu icon and soft pink background */}
      <div className="bg-[#FCE4EF] px-4 py-3 flex items-center gap-2.5 border-b border-[#F5D8E6]">
        <Menu className="w-5 h-5 text-[#6D4BB8]" strokeWidth={1.8} />
        <h2 className="text-sm font-bold text-[#6D4BB8] tracking-tight uppercase">
          Categorías
        </h2>
      </div>

      {/* Category List */}
      <nav aria-label="Categorías de productos">
        <ul className="divide-y divide-[#F7F2F9]">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Grid;
            const isActive = activeSlug === cat.slug;

            return (
              <li key={cat.id}>
                <Link
                  href={`/categoria/${cat.slug}`}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-[13px] font-medium transition-all group ${
                    isActive
                      ? "bg-[#EEEAFB] text-[#6D4BB8] font-semibold"
                      : "text-[#2E2A3B] hover:bg-[#EEEAFB] hover:text-[#6D4BB8]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-[#6D4BB8] text-white"
                          : "bg-[#FCE4EF]/70 text-[#6D4BB8] group-hover:bg-[#6D4BB8] group-hover:text-white"
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-all ${
                      isActive
                        ? "text-[#6D4BB8] translate-x-0.5"
                        : "text-[#7A7590]/50 group-hover:text-[#6D4BB8] group-hover:translate-x-0.5"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
