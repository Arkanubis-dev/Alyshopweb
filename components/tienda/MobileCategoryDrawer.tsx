"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  X,
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
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { Logo } from "./Logo";

import { PerfumeIcon } from "./PerfumeIcon";

interface MobileCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  storeName?: string;
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
  Perfume: PerfumeIcon,
  Fragrance: PerfumeIcon,
};

export function MobileCategoryDrawer({
  isOpen,
  onClose,
  logoUrl,
  storeName,
}: MobileCategoryDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#FFFBF7] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#F0E8F2] flex items-center justify-between bg-white">
          <Logo size="sm" showSlogan={false} logoUrl={logoUrl} storeName={storeName} />
          <button
            onClick={onClose}
            className="p-2 text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FCE4EF]/50 rounded-full transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#6D4BB8] mb-2">
              Todas las Categorías
            </div>
            <div className="bg-white rounded-2xl border border-[#F0E8F2] overflow-hidden shadow-xs divide-y divide-[#FAF5FC]">
              {MOCK_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon] || Grid;
                return (
                  <Link
                    key={cat.id}
                    href={`/categoria/${cat.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3.5 py-3 hover:bg-[#EEEAFB] text-[#2E2A3B] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FCE4EF] flex items-center justify-center text-[#6D4BB8] group-hover:bg-[#EEEAFB] overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-5 h-5 object-contain" />
                        ) : (
                          <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                        )}
                      </div>
                      <span className="text-sm font-medium group-hover:text-[#6D4BB8]">
                        {cat.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#7A7590] group-hover:text-[#6D4BB8] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Info & Help */}
          <div className="bg-[#EEEAFB]/60 rounded-2xl p-4 border border-[#E4DEF6] space-y-3">
            <div className="text-xs font-bold text-[#6D4BB8] uppercase tracking-wider">
              ¿Necesitas ayuda?
            </div>
            <div className="space-y-2 text-xs text-[#2E2A3B]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#6D4BB8]" strokeWidth={1.5} />
                <span>Envíos a toda Colombia</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#6D4BB8]" strokeWidth={1.5} />
                <span>Compra segura y confiable</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#6D4BB8]" strokeWidth={1.5} />
                <span>WhatsApp: +57 321 305 2913</span>
              </div>
            </div>
            <a
              href="https://wa.me/573213052913?text=Hola%20alyshop,%20quisiera%20m%C3%A1s%20informaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full py-2 bg-[#F472A8] hover:bg-[#E35E96] text-white text-xs font-semibold text-center rounded-xl transition-colors shadow-xs"
            >
              Chatear por WhatsApp
            </a>
          </div>

          {/* Admin link */}
          <div className="text-center pt-2">
            <Link
              href="/admin/login"
              onClick={onClose}
              className="text-xs text-[#7A7590] hover:text-[#6D4BB8] underline"
            >
              Acceso Administrador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
