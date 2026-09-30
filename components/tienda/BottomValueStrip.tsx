import { Sparkles, PackageCheck, Layers } from "lucide-react";
import { MOCK_BOTTOM_VALUES } from "@/lib/mock-data";

const ICON_MAP: Record<string, any> = {
  Sparkles,
  PackageCheck,
  Layers,
};

export function BottomValueStrip() {
  return (
    <section className="w-full bg-[#EEEAFB] border-y border-[#E2DBF5] py-8 sm:py-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {MOCK_BOTTOM_VALUES.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Sparkles;
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white/70 backdrop-blur-2xs p-4 sm:p-5 rounded-2xl border border-white/60 shadow-2xs hover:bg-white/90 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FCE4EF] flex items-center justify-center shrink-0 text-[#6D4BB8] shadow-xs">
                  <IconComponent className="w-6 h-6 text-[#6D4BB8]" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2E2A3B]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#7A7590] mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
