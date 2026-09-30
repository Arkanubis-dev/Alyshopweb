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

interface CategoryPillsProps {
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
  PawPrint,
};

export function CategoryPills({ activeSlug }: CategoryPillsProps) {
  return (
    <section className="w-full py-2">
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-2 px-1 sm:justify-center sm:gap-6 md:gap-7">
        {MOCK_CIRCULAR_CATEGORIES.map((item) => {
          const IconComponent = ICON_MAP[item.icon] || Home;
          const isActive = activeSlug === item.slug;

          return (
            <Link
              key={item.slug}
              href={`/categoria/${item.slug}`}
              className="flex flex-col items-center gap-2 group shrink-0 transition-transform active:scale-95"
            >
              {/* Pastel Circle */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 border group-hover:scale-105 shadow-xs ${
                  item.bg
                } ${
                  isActive
                    ? "ring-2 ring-[#6D4BB8] ring-offset-2 border-[#6D4BB8]"
                    : "border-black/5 group-hover:shadow-sm"
                }`}
              >
                <IconComponent
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} group-hover:scale-110 transition-transform`}
                  strokeWidth={1.75}
                />
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
