"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/tienda/Logo";
import { logoutAdminAction } from "@/app/actions/auth";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/productos", icon: Package },
  { name: "Categorías", href: "/admin/categorias", icon: FolderTree },
  { name: "Inventario", href: "/admin/inventario", icon: Boxes },
  { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { name: "Banners", href: "/admin/banners", icon: ImageIcon },
  { name: "Ajustes", href: "/admin/ajustes", icon: Settings },
];

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If on /admin/login, don't show admin sidebar/header layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-white border-b border-[#F0E8F2] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Logo size="sm" showSlogan={false} />
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-[#6D4BB8] hover:bg-[#FCE4EF]/60 rounded-xl"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#F0E8F2] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top brand */}
        <div className="p-5 border-b border-[#F0E8F2] space-y-2">
          <Logo size="sm" showSlogan={false} />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEEAFB] text-[10px] font-bold text-[#6D4BB8]">
            <Sparkles className="w-3 h-3 text-[#F472A8]" />
            <span>Panel de Control</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-[#6D4BB8] text-white shadow-xs"
                    : "text-[#2E2A3B] hover:bg-[#FCE4EF]/50 hover:text-[#6D4BB8]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#7A7590]"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#F0E8F2] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] transition-colors"
          >
            <span>Ver tienda online</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Admin Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
