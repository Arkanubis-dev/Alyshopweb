import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

interface LogoProps {
  showSlogan?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ showSlogan = true, className = "", size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-2xl",
    md: "text-3xl sm:text-4xl",
    lg: "text-4xl sm:text-5xl",
  };

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 transition-transform active:scale-95 ${className}`}
      aria-label="alyshop - Inicio"
    >
      {/* Shopping bag icon with small heart inside */}
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#FCE4EF] to-[#EEEAFB] flex items-center justify-center shadow-xs border border-[#F0E8F2] group-hover:rotate-[-4deg] transition-all duration-200">
          <ShoppingBag
            className="w-5 h-5 sm:w-6 sm:h-6 text-[#6D4BB8]"
            strokeWidth={1.75}
          />
          <Heart
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#F472A8] fill-[#F472A8] absolute top-5.5 right-2"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1 leading-none">
          <span
            className={`font-script font-normal text-[#6D4BB8] tracking-tight group-hover:text-[#5837A3] transition-colors ${textSizes[size]}`}
          >
            alyshop
          </span>
          <Heart
            className="w-3.5 h-3.5 text-[#F472A8] fill-[#F472A8] animate-pulse inline-block"
          />
        </div>
        {showSlogan && (
          <span className="text-[11px] sm:text-[12px] text-[#7A7590] italic font-normal tracking-tight flex items-center gap-1 mt-0.5">
            Todo lo que necesitas, en un solo lugar
          </span>
        )}
      </div>
    </Link>
  );
}
