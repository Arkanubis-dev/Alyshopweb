"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { loginAdminAction } from "@/app/actions/auth";
import { Logo } from "@/components/tienda/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await loginAdminAction(formData);

    if (result.success) {
      router.push(from);
      router.refresh();
    } else {
      setError(result.error || "Error al iniciar sesión");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-block">
          <Logo size="lg" />
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFB] text-xs font-bold text-[#6D4BB8]">
            <Sparkles className="w-3.5 h-3.5 text-[#F472A8]" />
            <span>Panel de Administración</span>
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#2E2A3B] tracking-tight">
          Acceso Administrativo
        </h1>
        <p className="text-xs text-[#7A7590]">
          Inicia sesión para gestionar catálogo, pedidos e inventario.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-sm p-6 sm:p-8 space-y-5">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2E2A3B]">
              Correo electrónico
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#7A7590] absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@alyshop.co"
                className="w-full text-xs sm:text-sm pl-10 pr-3 py-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8] focus:ring-2 focus:ring-[#FCE4EF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2E2A3B]">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#7A7590] absolute left-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs sm:text-sm pl-10 pr-3 py-3 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#F472A8] focus:ring-2 focus:ring-[#FCE4EF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Back to store */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#7A7590] hover:text-[#6D4BB8] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la tienda pública</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col justify-center items-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#6D4BB8] animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
