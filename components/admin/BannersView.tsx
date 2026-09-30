"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { BannerSlide } from "@/types";
import {
  saveBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
} from "@/app/actions/banners";

interface BannersViewProps {
  initialBanners: BannerSlide[];
}

export function BannersView({ initialBanners }: BannersViewProps) {
  const [banners, setBanners] = useState<BannerSlide[]>(initialBanners);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<BannerSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<BannerSlide>>({
    title: "",
    subtitle: "",
    cta_text: "¡Descubre más!",
    link: "/#productos",
    image_url: "",
    bg_gradient: "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]",
    sort_order: 1,
    is_active: true,
  });

  const notify = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleOpenCreate = () => {
    setFormData({
      title: "",
      subtitle: "",
      cta_text: "¡Descubre más!",
      link: "/#productos",
      image_url: "",
      bg_gradient: "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]",
      sort_order: (banners.length + 1),
      is_active: true,
    });
    setEditingBanner(null);
    setIsCreating(true);
  };

  const handleOpenEdit = (banner: BannerSlide) => {
    setFormData({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      cta_text: banner.cta_text,
      link: banner.link,
      image_url: banner.image_url,
      bg_gradient: banner.bg_gradient,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setEditingBanner(banner);
    setIsCreating(true);
  };

  const handleToggleStatus = async (banner: BannerSlide) => {
    const newStatus = !banner.is_active;
    // Optimistic update
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, is_active: newStatus } : b))
    );

    const res = await toggleBannerStatusAction(banner.id, newStatus);
    if (!res.success) {
      // Revert on error
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !newStatus } : b))
      );
      notify("error", res.error || "No se pudo actualizar el estado");
    } else {
      notify("success", `Banner ${newStatus ? "activado" : "desactivado"} correctamente`);
    }
  };

  const handleDeleteBanner = async () => {
    if (!isDeleting) return;
    setIsSubmitting(true);
    const bannerId = isDeleting.id;

    const res = await deleteBannerAction(bannerId);
    setIsSubmitting(false);

    if (res.success) {
      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
      setIsDeleting(null);
      notify("success", "Banner eliminado con éxito");
    } else {
      notify("error", res.error || "Error al eliminar el banner");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      notify("error", "El título es obligatorio");
      return;
    }

    setIsSubmitting(true);
    const res = await saveBannerAction(formData);
    setIsSubmitting(false);

    if (res.success && res.banner) {
      const saved = res.banner;
      setBanners((prev) => {
        const exists = prev.some((b) => b.id === saved.id);
        if (exists) {
          return prev.map((b) => (b.id === saved.id ? saved : b)).sort((a, b) => a.sort_order - b.sort_order);
        }
        return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order);
      });
      setIsCreating(false);
      setEditingBanner(null);
      notify("success", editingBanner ? "Banner actualizado correctamente" : "Banner creado exitosamente");
    } else {
      notify("error", res.error || "Error al guardar el banner");
    }
  };

  const activeCount = banners.filter((b) => b.is_active).length;

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Escaparate & Marketing</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Banners de la Tienda
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Administra los carruseles promocionales de la cabecera. ({activeCount} activos de {banners.length})
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-sm transition-all text-sm shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Banner</span>
        </button>
      </div>

      {/* Banners List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-sm hover:shadow-md ${
              banner.is_active ? "border-stone-200/80" : "border-stone-200 opacity-60 bg-stone-50/50"
            }`}
          >
            {/* Slide Preview Box */}
            <div className={`relative h-44 w-full bg-gradient-to-r ${banner.bg_gradient} p-4 flex items-center justify-between overflow-hidden border-b border-stone-100`}>
              <div className="z-10 max-w-[65%] space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/80 text-primary shadow-xs backdrop-blur-xs">
                  Orden #{banner.sort_order}
                </span>
                <h3 className="font-black text-stone-900 text-lg leading-tight line-clamp-2">
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}
                <span className="inline-flex items-center text-[11px] font-bold text-primary underline underline-offset-2">
                  {banner.cta_text || "Comprar"} &rarr;
                </span>
              </div>

              {banner.image_url ? (
                <div className="relative w-28 h-28 shrink-0 drop-shadow-md">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-contain"
                    sizes="120px"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-white/50 border border-stone-200/40 flex items-center justify-center text-stone-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    banner.is_active
                      ? "bg-emerald-100/90 text-emerald-800"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      banner.is_active ? "bg-emerald-500" : "bg-stone-400"
                    }`}
                  />
                  {banner.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            {/* Banner Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2 text-xs text-stone-500">
                <div className="flex items-center gap-1.5 truncate">
                  <LinkIcon className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  <span className="truncate font-mono">{banner.link}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(banner)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    banner.is_active
                      ? "border-stone-200 text-stone-600 hover:bg-stone-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {banner.is_active ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Activar</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    title="Editar banner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(banner)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Eliminar banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-stone-200">
            <Layers className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-700 text-lg">No hay banners configurados</h3>
            <p className="text-stone-500 text-sm mt-1 max-w-sm mx-auto mb-4">
              Crea tu primer slide promocional para destacar tus ofertas en la página principal.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Banner</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h2 className="font-bold text-stone-900 text-lg">
                {editingBanner ? "Editar Banner" : "Nuevo Banner Promocional"}
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Título principal *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Renueva tu Hogar con Estilo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Subtítulo o descripción breve
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ej: Hasta 35% de descuento en artículos de cocina seleccionados."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Texto del Botón (CTA)
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text || ""}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="¡Descubre más!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Enlace de destino
                  </label>
                  <input
                    type="text"
                    value={formData.link || ""}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/#productos o /categoria/hogar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Recomendado: Imagen con fondo transparente o estilo producto en PNG/WebP.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order || 1}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Estado
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary"
                    />
                    <span className="text-sm text-stone-700 font-medium">Visible en tienda</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold text-sm hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-stone-900 text-lg">¿Eliminar este banner?</h3>
              <p className="text-stone-500 text-sm mt-1">
                Se eliminará el banner &quot;{isDeleting.title}&quot; y dejará de mostrarse en la portada.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleting(null)}
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold text-sm hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteBanner}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
