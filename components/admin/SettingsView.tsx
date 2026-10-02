"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Store,
  Phone,
  Truck,
  Share2,
  FileText,
  AlertCircle,
  Check,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Upload,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Eye,
  ShoppingBag,
  Heart,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { StoreSettings } from "@/types";
import { formatCOP } from "@/lib/utils";
import { saveAdminSettingsAction } from "@/app/actions/settings";
import { uploadProductImageAction } from "@/app/actions/products";
import { THEME_PALETTES, ThemePalette, getPaletteById } from "@/lib/theme-palettes";
import { Logo } from "@/components/tienda/Logo";

interface SettingsViewProps {
  initialSettings: StoreSettings;
}

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>({
    ...initialSettings,
    color_palette: initialSettings.color_palette || "pastel-morado",
    primary_color: initialSettings.primary_color || "#6D4BB8",
    secondary_color: initialSettings.secondary_color || "#F472A8",
    header_bg_color: initialSettings.header_bg_color || "#FFFFFF",
    text_color: initialSettings.text_color || "#2E2A3B",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<"todas" | "Pastel" | "Metálico" | "A tu gusto">("todas");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadProductImageAction(formData);
      if (res.success && res.url) {
        setSettings((prev) => ({ ...prev, logo_url: res.url }));
        notify("success", "Logo de la empresa subido y actualizado");
      } else {
        notify("error", res.error || "No se pudo subir la imagen");
      }
    } catch {
      notify("error", "Error inesperado al subir el logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSelectPalette = (palette: ThemePalette) => {
    setSettings((prev) => ({
      ...prev,
      color_palette: palette.id,
      primary_color: palette.primary,
      secondary_color: palette.secondary,
      header_bg_color: palette.headerBg,
      text_color: palette.text,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const res = await saveAdminSettingsAction(settings);
    setIsSubmitting(false);

    if (res.success) {
      notify("success", "¡Paleta de colores y ajustes guardados! Aplicados a toda la tienda.");
      router.refresh();
    } else {
      notify("error", res.error || "Error al guardar la configuración");
    }
  };

  const filteredPalettes = THEME_PALETTES.filter((p) => {
    if (paletteFilter === "todas") return true;
    return p.category === paletteFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all animate-in slide-in-from-top-2 ${
            statusMessage.type === "success"
              ? "bg-[#6D4BB8] text-white border-[#5837A3]"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="w-4 h-4 text-[#F472A8]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#6D4BB8] font-bold text-xs uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Configuración General</span>
          </div>
          <h1 className="text-2xl font-black text-[#2E2A3B] tracking-tight">
            Ajustes de la Tienda & Diseño
          </h1>
          <p className="text-sm text-[#7A7590] mt-1">
            Personaliza el logo de tu empresa, paleta de colores con vista previa en vivo, WhatsApp y logística.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#6D4BB8] to-[#5837A3] hover:from-[#5837A3] hover:to-[#432785] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-[#F472A8]" />
          )}
          <span>Guardar Configuración</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================================================================= */}
        {/* SECCIÓN 1: LOGO DE LA EMPRESA & MARCA */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0E8F2] pb-3">
            <div className="flex items-center gap-2.5 text-[#2E2A3B] font-bold">
              <div className="w-8 h-8 rounded-xl bg-[#FCE4EF] text-[#6D4BB8] flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Logo de la Empresa</h2>
                <p className="text-xs text-[#7A7590] font-normal">
                  Sube el logo oficial de tu negocio para que aparezca en el encabezado, pie de página y recibos.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Logo Live Box */}
            <div className="p-4 bg-[#FAF5FB] rounded-2xl border border-[#F0E8F2] flex flex-col items-center justify-center gap-3 text-center min-h-[160px]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">
                Vista Previa del Logo Actual
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#F0E8F2] shadow-2xs max-w-full flex items-center justify-center min-h-[70px]">
                <Logo
                  size="md"
                  showSlogan={true}
                  logoUrl={settings.logo_url}
                  storeName={settings.name}
                />
              </div>

              {settings.logo_url ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Logo personalizado activo
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, logo_url: "" })}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Restablecer predeterminado</span>
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-[#7A7590]">
                  Usando logo institucional predeterminado de alyshop
                </span>
              )}
            </div>

            {/* Subir archivo de Logo */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#7A7590] uppercase">
                Subir nuevo logo (PNG, JPG, SVG, WebP)
              </label>

              <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-[#F0E8F2] hover:border-[#6D4BB8] rounded-2xl bg-[#FAF5FB] hover:bg-[#EEEAFB]/30 transition-all text-center">
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="w-6 h-6 text-[#6D4BB8] animate-spin" />
                    <span className="text-xs font-bold text-[#6D4BB8]">Subiendo y procesando imagen...</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-[#F0E8F2] flex items-center justify-center text-[#6D4BB8]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-[#6D4BB8]">
                      Haz clic para seleccionar el archivo de logo
                    </div>
                    <p className="text-[11px] text-[#7A7590]">
                      Recomendado: formato PNG transparente, altura aprox. 80-120 px.
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  disabled={isUploadingLogo}
                  onChange={handleUploadLogo}
                  className="hidden"
                />
              </label>

              {/* URL alternativa */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-[#7A7590]">
                  O pega la URL directa de la imagen del logo:
                </label>
                <input
                  type="url"
                  value={settings.logo_url || ""}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://ejemplo.com/logo-empresa.png"
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF5FB] border border-[#F0E8F2] focus:outline-none focus:border-[#6D4BB8]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN 2: PALETA DE COLORES Y PREVIA VISUALIZACIÓN */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0E8F2] pb-3">
            <div className="flex items-center gap-2.5 text-[#2E2A3B] font-bold">
              <div className="w-8 h-8 rounded-xl bg-[#EEEAFB] text-[#6D4BB8] flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Paleta de Colores de la Tienda</h2>
                <p className="text-xs text-[#7A7590] font-normal">
                  Elige entre tonalidades pastel, metálicas de lujo o personaliza a tu gusto con vista previa en vivo.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#FAF5FB] p-1 rounded-xl border border-[#F0E8F2] text-xs font-bold">
              {(["todas", "Pastel", "Metálico", "A tu gusto"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPaletteFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paletteFilter === tab
                      ? "bg-[#6D4BB8] text-white shadow-xs"
                      : "text-[#7A7590] hover:text-[#2E2A3B]"
                  }`}
                >
                  {tab === "todas" ? "Todas" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout: Palettes on left + Mini Live Preview on right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Paletas para elegir (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredPalettes.map((pal) => {
                  const isSelected = settings.color_palette === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => handleSelectPalette(pal)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "border-[#6D4BB8] ring-2 ring-[#6D4BB8]/30 bg-[#FAF5FB] shadow-xs"
                          : "border-[#F0E8F2] hover:bg-[#FAF5FB]/60 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pal.category === "Metálico"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : pal.category === "Pastel"
                                ? "bg-pink-100 text-pink-900 border border-pink-200"
                                : "bg-purple-100 text-purple-900 border border-purple-200"
                            }`}
                          >
                            {pal.category}
                          </span>
                          <span className="font-extrabold text-xs text-[#2E2A3B]">
                            {pal.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#6D4BB8] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-[#7A7590] leading-tight">
                        {pal.description}
                      </p>

                      {/* Swatches Bar */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-[#F0E8F2]">
                        <span className="text-[10px] text-[#7A7590] font-semibold mr-1">Tonos:</span>
                        <div
                          className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: pal.primary }}
                          title={`Primario: ${pal.primary}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: pal.secondary }}
                          title={`Secundario: ${pal.secondary}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: pal.headerBg }}
                          title={`Encabezado: ${pal.headerBg}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: pal.text }}
                          title={`Texto: ${pal.text}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ajustes de Color Manuales (Personalizado) */}
              <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6D4BB8]" />
                    <span className="text-xs font-bold text-[#2E2A3B]">
                      Ajuste fino de colores específicos:
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7A7590]">Edita cualquier valor</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-2.5 rounded-xl border border-[#F0E8F2] space-y-1">
                    <label className="text-[10px] font-bold text-[#7A7590] block truncate">
                      Primario (Botones)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary_color || "#6D4BB8"}
                        onChange={(e) =>
                          setSettings({ ...settings, primary_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="w-7 h-7 rounded-lg border border-black/10 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={settings.primary_color || "#6D4BB8"}
                        onChange={(e) =>
                          setSettings({ ...settings, primary_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="text-[11px] font-mono w-full font-bold text-[#2E2A3B] uppercase"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#F0E8F2] space-y-1">
                    <label className="text-[10px] font-bold text-[#7A7590] block truncate">
                      Secundario (Acentos)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary_color || "#F472A8"}
                        onChange={(e) =>
                          setSettings({ ...settings, secondary_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="w-7 h-7 rounded-lg border border-black/10 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={settings.secondary_color || "#F472A8"}
                        onChange={(e) =>
                          setSettings({ ...settings, secondary_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="text-[11px] font-mono w-full font-bold text-[#2E2A3B] uppercase"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#F0E8F2] space-y-1">
                    <label className="text-[10px] font-bold text-[#7A7590] block truncate">
                      Fondo Encabezado
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.header_bg_color || "#FFFFFF"}
                        onChange={(e) =>
                          setSettings({ ...settings, header_bg_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="w-7 h-7 rounded-lg border border-black/10 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={settings.header_bg_color || "#FFFFFF"}
                        onChange={(e) =>
                          setSettings({ ...settings, header_bg_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="text-[11px] font-mono w-full font-bold text-[#2E2A3B] uppercase"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#F0E8F2] space-y-1">
                    <label className="text-[10px] font-bold text-[#7A7590] block truncate">
                      Color de Letra
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.text_color || "#2E2A3B"}
                        onChange={(e) =>
                          setSettings({ ...settings, text_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="w-7 h-7 rounded-lg border border-black/10 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={settings.text_color || "#2E2A3B"}
                        onChange={(e) =>
                          setSettings({ ...settings, text_color: e.target.value, color_palette: "personalizado" })
                        }
                        className="text-[11px] font-mono w-full font-bold text-[#2E2A3B] uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: PREVIA VISUALIZACIÓN PEQUEÑA (5 cols) */}
            <div className="lg:col-span-5 bg-[#FAF5FB] p-4 rounded-3xl border border-[#F0E8F2] space-y-3 sticky top-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#6D4BB8]">
                  <Eye className="w-4 h-4 text-[#F472A8]" />
                  <span>Previa Visualización en Vivo</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#F0E8F2] text-[#7A7590]">
                  {settings.color_palette}
                </span>
              </div>

              {/* Simulación de Navegador / Smartphone en Miniatura */}
              <div
                className="rounded-2xl border border-black/10 shadow-lg overflow-hidden transition-all text-xs"
                style={{ backgroundColor: "#FFFBF7", color: settings.text_color || "#2E2A3B" }}
              >
                {/* Mini Barra de Navegador */}
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center gap-1.5 text-[9px] text-gray-500 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <span className="ml-2 truncate opacity-75">alyshop.co</span>
                </div>

                {/* Mini Encabezado (Header Preview) */}
                <div
                  className="p-3 border-b border-black/5 flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: settings.header_bg_color || "#FFFFFF",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="h-6 w-auto max-w-[80px] object-contain"
                      />
                    ) : (
                      <span
                        className="font-script font-bold text-sm tracking-tight"
                        style={{ color: settings.primary_color || "#6D4BB8" }}
                      >
                        {settings.name || "alyshop"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20 h-5 rounded-md bg-black/5 flex items-center px-1.5 text-[9px] text-gray-400">
                      <Search className="w-2.5 h-2.5 mr-1" />
                      <span>Buscar...</span>
                    </div>
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-2xs"
                      style={{ backgroundColor: settings.primary_color || "#6D4BB8" }}
                    >
                      <ShoppingBag className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Mini Strip Promocional */}
                <div
                  className="px-3 py-1 text-[10px] font-semibold flex items-center justify-center gap-1 text-center"
                  style={{
                    backgroundColor: `${settings.secondary_color || "#F472A8"}22`,
                    color: settings.primary_color || "#6D4BB8",
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Envíos rápidos a toda Colombia • Pago contra entrega</span>
                </div>

                {/* Mini Contenido: Categorías y Producto */}
                <div className="p-3 space-y-3">
                  {/* Mini Categorías */}
                  <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                    {[
                      { name: "Hogar", bg: "#FCE4EF" },
                      { name: "Perfumes", bg: "#EEEAFB" },
                      { name: "Belleza", bg: "#DDF3EC" },
                      { name: "Ofertas", bg: "#FFF1CC" },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="flex flex-col items-center gap-0.5 shrink-0"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-black/5"
                          style={{ backgroundColor: c.bg }}
                        >
                          <span className="text-[9px] font-bold" style={{ color: settings.primary_color }}>
                            {c.name[0]}
                          </span>
                        </div>
                        <span className="text-[9px] font-medium" style={{ color: settings.text_color }}>
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Mini Card de Producto de Muestra */}
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center text-xl shrink-0">
                      ✨
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded-full text-white"
                          style={{ backgroundColor: settings.secondary_color || "#F472A8" }}
                        >
                          -20% OFF
                        </span>
                      </div>
                      <p className="font-bold text-[11px] truncate mt-0.5" style={{ color: settings.text_color }}>
                        Perfume & Bruma Floral 250ml
                      </p>
                      <p className="font-extrabold text-xs" style={{ color: settings.primary_color }}>
                        $45.000 COP
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg text-white font-bold text-[10px] shadow-xs shrink-0 cursor-default"
                      style={{ backgroundColor: settings.primary_color || "#6D4BB8" }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Mini Pie */}
                <div className="p-2 bg-gray-50 border-t border-gray-200 text-center text-[9px] text-gray-400">
                  © 2026 {settings.name || "alyshop"} • Diseñado con colores personalizados
                </div>
              </div>

              {/* Botón directo de Guardar Paleta */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#6D4BB8] to-[#5837A3] hover:from-[#5837A3] hover:to-[#432785] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#F472A8]" />
                  )}
                  <span>Guardar y Aplicar Paleta Ahora</span>
                </button>
              </div>

              <p className="text-[11px] text-[#7A7590] text-center italic">
                Cualquier cambio se reflejará de inmediato en toda la tienda (cabecera, botones, insignias, textos y enlaces).
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN 3: IDENTIDAD DE NEGOCIO */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#2E2A3B] font-bold border-b border-[#F0E8F2] pb-3">
            <Store className="w-5 h-5 text-[#6D4BB8]" />
            <h2 className="text-base font-extrabold">Datos del Negocio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Ciudad Principal *
              </label>
              <input
                type="text"
                required
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Eslogan / Frase de Cabecera
              </label>
              <input
                type="text"
                value={settings.slogan}
                onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN 4: CANAL DE WHATSAPP */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#2E2A3B] font-bold border-b border-[#F0E8F2] pb-3">
            <Phone className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold">Canal de Pedidos WhatsApp</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Número de WhatsApp para Recepción de Pedidos *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={settings.whatsapp_number}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      whatsapp_number: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="573213052913"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm font-mono font-bold text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
                />
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-sm transition-colors shrink-0 border border-emerald-200 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Probar chat</span>
                </a>
              </div>
              <p className="text-xs text-[#7A7590] mt-1">
                Formato internacional sin espacios ni signos &quot;+&quot;. Colombia usa código 57 seguido de 10 dígitos (ej: <code>573213052913</code>).
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN 5: LOGÍSTICA E INVENTARIO */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#2E2A3B] font-bold border-b border-[#F0E8F2] pb-3">
            <Truck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold">Logística y Alertas de Stock</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Costo Base de Envío (COP)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={settings.default_shipping_cost}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_shipping_cost: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
              />
              <p className="text-xs text-[#7A7590] mt-1">
                Visualizado como: <span className="font-bold text-[#2E2A3B]">{settings.default_shipping_cost === 0 ? "Gratis / A convenir" : formatCOP(settings.default_shipping_cost)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Umbral de Alerta de Stock Bajo
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.low_stock_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    low_stock_threshold: parseInt(e.target.value) || 3,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm font-semibold text-[#2E2A3B] focus:outline-none focus:border-[#6D4BB8]"
              />
              <p className="text-xs text-[#7A7590] mt-1">
                Los productos con stock menor o igual a este valor se marcarán como &quot;Bajo stock&quot;.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN 6: REDES SOCIALES */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E8F2] pb-3">
            <div className="flex items-center gap-2 text-[#2E2A3B] font-bold">
              <Share2 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-extrabold">Redes Sociales</h2>
            </div>
            <span className="text-[11px] text-[#7A7590] bg-[#FAF5FB] px-2.5 py-1 rounded-full font-medium border border-[#F0E8F2]">
              Aparecen en el pie de página
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Enlace a Instagram
              </label>
              <input
                type="url"
                value={settings.instagram_url || ""}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/tu_cuenta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm focus:outline-none focus:border-[#6D4BB8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Enlace a Facebook
              </label>
              <input
                type="url"
                value={settings.facebook_url || ""}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                placeholder="https://facebook.com/tu_pagina"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm focus:outline-none focus:border-[#6D4BB8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
                Enlace a TikTok
              </label>
              <input
                type="url"
                value={settings.tiktok_url || ""}
                onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@tu_cuenta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm focus:outline-none focus:border-[#6D4BB8]"
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN 7: NOTAS LEGALES Y FACTURAS */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#F0E8F2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#2E2A3B] font-bold border-b border-[#F0E8F2] pb-3">
            <FileText className="w-5 h-5 text-[#2E2A3B]" />
            <h2 className="text-base font-extrabold">Pie de Factura / Nota Legal</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7A7590] uppercase mb-1">
              Texto al pie del recibo descargable e impreso
            </label>
            <textarea
              rows={3}
              value={settings.footer_invoice_text}
              onChange={(e) => setSettings({ ...settings, footer_invoice_text: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F0E8F2] bg-[#FAF5FB] text-sm focus:outline-none focus:border-[#6D4BB8]"
            />
            <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Esta nota aclara a los clientes que el documento es un recibo de despacho de alyshop y no factura electrónica DIAN.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-[#6D4BB8] to-[#5837A3] hover:from-[#5837A3] hover:to-[#432785] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-[#F472A8]" />
            )}
            <span>Guardar Toda la Configuración & Colores</span>
          </button>
        </div>
      </form>
    </div>
  );
}
