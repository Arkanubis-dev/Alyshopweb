import { Heart, ShoppingBag, Sparkles } from "lucide-react";

export function PromoBannerCard() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden p-6 bg-gradient-to-b from-[#FDE8DD] via-[#FCE4EF] to-[#EEEAFB] border border-[#F0E8F2] shadow-xs text-center flex flex-col items-center justify-center space-y-3 group">
      {/* Decorative background watercolor circles */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/40 blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#F472A8]/10 blur-lg pointer-events-none" />

      {/* Illustrated bag & heart */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-sm border border-white/80 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300">
          <ShoppingBag className="w-8 h-8 text-[#6D4BB8]" strokeWidth={1.5} />
          <Heart className="w-4 h-4 text-[#F472A8] fill-[#F472A8] absolute -top-1.5 -right-1.5 animate-bounce" />
        </div>
        <Sparkles className="w-4 h-4 text-[#F5A623] absolute -bottom-1 -left-2 animate-pulse" />
      </div>

      {/* Script Text "¡Lo mejor en un solo lugar!" */}
      <div className="space-y-1">
        <h4 className="font-script text-xl sm:text-2xl text-[#6D4BB8] leading-tight">
          ¡Lo mejor en un solo lugar!
        </h4>
        <p className="text-[11px] text-[#7A7590] leading-relaxed max-w-[200px] mx-auto">
          Encuentra productos prácticos, bonitos y de gran calidad para ti.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F472A8]">
        <span>Hecho con amor</span>
        <Heart className="w-3 h-3 fill-[#F472A8] text-[#F472A8]" />
      </div>
    </div>
  );
}
