"use client";

import Link from "next/link";
import {
  Home,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Headphones,
  Gamepad2,
  BookOpen,
  PawPrint,
} from "lucide-react";
import { MOCK_CIRCULAR_CATEGORIES } from "@/lib/mock-data";

import { PerfumeIcon } from "./PerfumeIcon";

import { Category } from "@/types";

interface CategoryPillsProps {
  activeSlug?: string;
  categories?: Category[];
}

const ICON_MAP: Record<string, any> = {
  Home,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Headphones,
  Gamepad2,
  BookOpen,
  PawPrint,
  Perfume: PerfumeIcon,
  Fragrance: PerfumeIcon,
};

export function CategoryPills({ activeSlug, categories }: CategoryPillsProps) {
  // Use passed categories or fallback to mock circular items
  const items = categories && categories.length > 0
    ? categories.filter((c) => c.is_active).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: "text-[#6D4BB8]",
        bg: c.color ? "" : "bg-[#FCE4EF]",
        customBg: c.color,
        image_url: c.image_url,
      }))
    : MOCK_CIRCULAR_CATEGORIES.map((m) => ({
        ...m,
        id: m.slug,
        customBg: undefined as string | undefined,
        image_url: undefined as string | undefined,
      }));

  return (
    <section className="w-full py-2">
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-2 px-1 sm:justify-center sm:gap-6 md:gap-7">
        {items.map((item) => {
          const IconComponent = ICON_MAP[item.icon] || Home;
          const isActive = activeSlug === item.slug;

          return (
            <Link
              key={item.id || item.slug}
              href={`/categoria/${item.slug}`}
              className="flex flex-col items-center gap-2 group shrink-0 transition-transform active:scale-95"
            >
              {/* Category Circle with custom background and PNG or Icon */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 border group-hover:scale-105 shadow-xs overflow-hidden ${
                  item.bg
                } ${
                  isActive
                    ? "ring-2 ring-[#6D4BB8] ring-offset-2 border-[#6D4BB8]"
                    : "border-black/5 group-hover:shadow-sm"
                }`}
                style={item.customBg ? { backgroundColor: item.customBg } : undefined}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <IconComponent
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} group-hover:scale-110 transition-transform`}
                    strokeWidth={1.75}
                  />
                )}
              </div>

              {/* Name below */}
              <span
                className={`text-xs font-semibold text-center transition-colors truncate max-w-[70px] ${
                  isActive
                    ? "text-[#6D4BB8] font-bold"
                    : "text-[#2E2A3B] group-hover:text-[#6D4BB8]"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
