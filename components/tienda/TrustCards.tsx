import { Truck, ShieldCheck, Headphones } from "lucide-react";
import { TrustItem } from "@/types";

interface TrustCardsProps {
  items: TrustItem[];
}

const ICON_MAP: Record<string, any> = {
  Truck,
  ShieldCheck,
  Headphones,
};

export function TrustCards({ items }: TrustCardsProps) {
  return (
    <div className="w-full space-y-2.5">
      {items.map((item) => {
        const IconComponent = ICON_MAP[item.icon] || ShieldCheck;
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3.5 bg-[#EEEAFB] rounded-2xl border border-[#E3DCF7] hover:border-[#D4CAFA] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-2xs">
              <IconComponent className="w-5 h-5 text-[#6D4BB8]" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#2E2A3B] leading-tight">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#7A7590] mt-0.5 leading-tight">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
