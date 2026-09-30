import Link from "next/link";
import { ArrowLeft, Home, Package, Search } from "lucide-react";
import { Logo } from "@/components/tienda/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        {/* 404 Illustration / Badge */}
        <div className="relative py-4">
          <div className="text-8xl sm:text-9xl font-black text-primary/10 tracking-widest select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-orange-100 text-primary font-black text-sm uppercase tracking-widest border border-orange-200 shadow-xs">
              Página no encontrada
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            ¡Ups! No encontramos lo que buscas
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Es posible que el enlace esté roto, el producto haya cambiado de código o la página haya sido trasladada.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>

          <Link
            href="/categoria/todos"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm font-bold hover:bg-stone-50 transition-all shadow-xs active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>Ver todo el catálogo</span>
          </Link>
        </div>

        {/* Search quick button */}
        <div className="pt-4 border-t border-stone-200/60">
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-primary transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>O busca directamente por palabra clave</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
