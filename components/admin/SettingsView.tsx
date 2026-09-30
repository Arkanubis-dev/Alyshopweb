"use client";

import { useState } from "react";
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
} from "lucide-react";
import { StoreSettings } from "@/types";
import { formatCOP } from "@/lib/utils";
import { saveAdminSettingsAction } from "@/app/actions/settings";

interface SettingsViewProps {
  initialSettings: StoreSettings;
}

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await saveAdminSettingsAction(settings);
    setIsSubmitting(false);

    if (res.success) {
      notify("success", "Configuración guardada exitosamente");
    } else {
      notify("error", res.error || "Error al guardar la configuración");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Alert */}
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
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Configuración General</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Ajustes de la Tienda
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Parámetros del negocio, canal de WhatsApp, costos de envío y notas legales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-sm transition-all text-sm shrink-0 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>Guardar Cambios</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identidad y Negocio */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold border-b border-stone-100 pb-3">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-base">Identidad de Marca</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Ciudad Principal *
              </label>
              <input
                type="text"
                required
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Eslogan / Frase de Cabecera
              </label>
              <input
                type="text"
                value={settings.slogan}
                onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Canal de WhatsApp */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold border-b border-stone-100 pb-3">
            <Phone className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base">Canal de Pedidos WhatsApp</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono"
                />
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-sm transition-colors shrink-0 border border-emerald-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Probar chat</span>
                </a>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Formato internacional sin espacios ni signos &quot;+&quot;. Colombia usa código 57 seguido de 10 dígitos (ej: <code>573213052913</code>).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Logística e Inventario */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold border-b border-stone-100 pb-3">
            <Truck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base">Logística y Alertas de Stock</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Costo Base de Envío (COP)
              </label>
              <div className="relative">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Visualizado como: <span className="font-bold text-stone-700">{settings.default_shipping_cost === 0 ? "Gratis / A acordar" : formatCOP(settings.default_shipping_cost)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
              <p className="text-xs text-stone-500 mt-1">
                Los productos con stock menor o igual a este valor se marcarán como &quot;Bajo stock&quot;.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Redes Sociales */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold border-b border-stone-100 pb-3">
            <Share2 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base">Redes Sociales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Enlace a Instagram
              </label>
              <input
                type="url"
                value={settings.instagram_url || ""}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/alyshop_co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Enlace a Facebook / Fanpage
              </label>
              <input
                type="url"
                value={settings.facebook_url || ""}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                placeholder="https://facebook.com/alyshop"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Notas y Facturas */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold border-b border-stone-100 pb-3">
            <FileText className="w-5 h-5 text-stone-700" />
            <h2 className="text-base">Pie de Factura / Nota Legal</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Texto al pie del recibo descargable e impreso
            </label>
            <textarea
              rows={3}
              value={settings.footer_invoice_text}
              onChange={(e) => setSettings({ ...settings, footer_invoice_text: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Esta nota aclara a los clientes que el documento es una cotización / orden de despacho y no factura electrónica fiscal.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Save bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Guardar Toda la Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
}
