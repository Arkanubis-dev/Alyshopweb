"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface WhatsAppFloatingButtonProps {
  whatsappNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppFloatingButton({
  whatsappNumber = "573213052913",
  defaultMessage = "¡Hola alyshop! Tengo una consulta sobre sus productos.",
}: WhatsAppFloatingButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(defaultMessage);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-end gap-2.5 pointer-events-none">
      {/* Speech bubble / tooltip */}
      {showTooltip && (
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-white text-stone-800 text-xs font-bold py-2 px-3.5 rounded-2xl shadow-lg border border-stone-200/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span>¿Necesitas ayuda? ¡Escríbenos!</span>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-stone-600 p-0.5 rounded-full"
            aria-label="Cerrar mensaje"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="pointer-events-auto relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
      >
        {/* Subtle pulsing background glow */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping group-hover:animate-none opacity-75" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 fill-white text-white relative z-10" />

        {/* Online Indicator Badge */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-300 border-2 border-white rounded-full z-20 shadow-xs" />
      </a>
    </div>
  );
}
