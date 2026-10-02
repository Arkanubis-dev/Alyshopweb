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
  Upload,
} from "lucide-react";
import { BannerSlide } from "@/types";
import {
  saveBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
} from "@/app/actions/banners";
import { uploadProductImageAction } from "@/app/actions/products";

const MAX_BANNERS = 5;

interface BannersViewProps {
  initialBanners: BannerSlide[];
}

export function BannersView({ initialBanners }: BannersViewProps) {
  const [banners, setBanners] = useState<BannerSlide[]>(initialBanners);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<BannerSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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

  const handleUploadBannerImage = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP o SVG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify("error", "El tamaño de la imagen no debe superar los 5MB.");
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const res = await uploadProductImageAction(uploadFormData);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image_url: res.url }));
        notify("success", "Imagen del banner cargada con éxito");
      } else {
        notify("error", res.error || "Error al subir la imagen");
      }
    } catch (err: any) {
      notify("error", err.message || "Error al procesar la imagen");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadBannerImage(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadBannerImage(file);
    }
  };

  const handleOpenCreate = () => {
    if (banners.length >= MAX_BANNERS) {
      notify("error", `Has alcanzado el límite máximo de ${MAX_BANNERS} banners. Edita o elimina uno existente.`);
      return;
    }

    setFormData({
      title: "",
      subtitle: "",
      cta_text: "¡Descubre más!",
      link: "/#productos",
      image_url: "",
      bg_gradient: "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]",
      sort_order: banners.length + 1,
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

    if (!editingBanner && banners.length >= MAX_BANNERS) {
      notify("error", `Has alcanzado el límite máximo de ${MAX_BANNERS} banners. Edita o elimina uno existente.`);
      return;
    }

    if (isUploadingImage) {
      notify("error", "Por favor espera a que termine de subirse la imagen.");
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
  const isLimitReached = banners.length >= MAX_BANNERS;

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
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-sm text-stone-500">
              Administra los carruseles promocionales de la cabecera. ({activeCount} activos de {banners.length})
            </p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                isLimitReached
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Capacidad: {banners.length} / {MAX_BANNERS} Banners
              {isLimitReached && " (Límite alcanzado)"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isLimitReached}
          title={isLimitReached ? `Límite máximo de ${MAX_BANNERS} banners alcanzado` : "Crear nuevo banner"}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all text-sm shrink-0 ${
            isLimitReached
              ? "bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300 shadow-none"
              : "bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Banner</span>
          <span className="text-xs opacity-75">({banners.length}/{MAX_BANNERS})</span>
        </button>
      </div>

      {/* Banner limit banner if reached */}
      {isLimitReached && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-900">Límite máximo de 5 banners alcanzado</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Tienes el cupo máximo de 5 banners configurados. Para añadir un banner diferente, debes editar o eliminar alguno de los existentes.
              </p>
            </div>
          </div>
        </div>
      )}

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
                    unoptimized={banner.image_url?.startsWith("data:")}
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

              {/* Gradiente de fondo del banner */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  Estilo de Fondo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: "Rosa Alyshop", class: "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]" },
                    { name: "Lavanda & Cielo", class: "from-[#EEEAFB] via-[#E0EEFB] to-[#FFFBF7]" },
                    { name: "Dorado Cálido", class: "from-[#FFF1CC] via-[#DDF3EC] to-[#FFFBF7]" },
                    { name: "Orquídea Suave", class: "from-[#FCE4EF] via-[#EEEAFB] to-[#FAF5FB]" },
                    { name: "Violeta Alyshop", class: "from-[#FAF5FB] via-[#F3E8FF] to-[#EDE9FE]" },
                  ].map((grad) => (
                    <button
                      key={grad.class}
                      type="button"
                      onClick={() => setFormData({ ...formData, bg_gradient: grad.class })}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                        formData.bg_gradient === grad.class
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-2xs"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md bg-gradient-to-r ${grad.class} border border-black/10 shrink-0`} />
                      <span className="text-[11px] font-semibold text-stone-700 truncate">{grad.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subida directa de Imagen (sin URL ni enlaces) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 uppercase">
                    Imagen del Banner
                  </label>
                  {formData.image_url ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Imagen lista
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      Sube una imagen desde tu dispositivo
                    </span>
                  )}
                </div>

                {formData.image_url ? (
                  <div className="relative rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden p-3 space-y-3">
                    {/* Previa en tiempo real con el fondo del banner */}
                    <div className={`relative h-44 w-full rounded-xl bg-gradient-to-r ${formData.bg_gradient || "from-[#FDE8DD] via-[#FCE4EF] to-[#FFFBF7]"} flex items-center justify-center p-3 border border-stone-200/50 overflow-hidden shadow-inner`}>
                      <img
                        src={formData.image_url}
                        alt="Previa del banner"
                        className="max-h-full max-w-full object-contain drop-shadow-md"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-stone-700 backdrop-blur-xs shadow-2xs">
                        Vista previa con fondo
                      </div>
                    </div>

                    {/* Acciones para cambiar o quitar */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:border-primary text-xs font-bold text-stone-700 hover:text-primary bg-white hover:bg-stone-50 transition-colors shadow-2xs">
                        {isUploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>{isUploadingImage ? "Subiendo..." : "Cambiar imagen"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
                          disabled={isUploadingImage}
                          onChange={onFileInputChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar imagen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      dragOver
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-stone-300 hover:border-primary/60 bg-stone-50/70 hover:bg-primary/5"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
                      disabled={isUploadingImage}
                      onChange={onFileInputChange}
                      className="hidden"
                    />

                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-primary">Subiendo imagen al servidor...</p>
                        <p className="text-[11px] text-stone-400">Por favor espera un momento</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Haz clic para seleccionar o arrastra una imagen aquí
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Recomendado: PNG con fondo transparente, JPG o WebP (máx. 5MB)
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary px-3.5 py-1.5 bg-white rounded-full border border-primary/20 shadow-2xs mt-1 hover:bg-primary/5">
                          <Upload className="w-3.5 h-3.5" />
                          Subir imagen desde tu equipo
                        </span>
                      </div>
                    )}
                  </label>
                )}
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

              {!editingBanner && isLimitReached && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Has alcanzado el límite de 5 banners. No puedes agregar más a menos que elimines uno existente.
                  </span>
                </div>
              )}

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
                  disabled={isSubmitting || isUploadingImage || (!editingBanner && isLimitReached)}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
