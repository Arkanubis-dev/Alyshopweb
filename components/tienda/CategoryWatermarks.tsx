"use client";

import React from "react";

/**
 * CategoryWatermarks:
 * Generates an artistic, semi-transparent watermark pattern in the background
 * composed of the store's category icons (Home, Kitchen, Clothes, Beauty,
 * Tech, Toys, Books, Sports, Pets, Perfume, Shopping Bag, Heart).
 *
 * Designed with 4% - 6% opacity so it gives subtle luxury texture without
 * interfering with legibility or interactive elements.
 */
export function CategoryWatermarks() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Pattern de fondo repetitivo continuo (SVG Seamless Pattern) */}
      <svg
        className="absolute inset-0 w-full h-full text-[#6D4BB8]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="alyshop-category-watermarks"
            width="340"
            height="340"
            patternUnits="userSpaceOnUse"
          >
            {/* 1. Hogar (Home) */}
            <g
              transform="translate(30, 35) rotate(-10)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </g>

            {/* 2. Perfume (Perfume Bottle) */}
            <g
              transform="translate(145, 25) rotate(15)"
              fill="none"
              stroke="#F472A8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.05]"
            >
              <rect x="5" y="8" width="14" height="13" rx="3" />
              <path d="M10 8V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
              <path d="M9 4h6" />
              <circle cx="12" cy="14.5" r="2.5" />
            </g>

            {/* 3. Cocina (UtensilsCrossed) */}
            <g
              transform="translate(265, 45) rotate(-15)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z" />
              <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
              <path d="m2.1 21.8 6.4-6.3" />
              <path d="m19 5-7 7" />
            </g>

            {/* 4. Ropa (Shirt) */}
            <g
              transform="translate(85, 140) rotate(12)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
            </g>

            {/* 5. Belleza (Sparkles) */}
            <g
              transform="translate(205, 130) rotate(-8)"
              fill="none"
              stroke="#F472A8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.05]"
            >
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </g>

            {/* 6. Tecnología (Headphones) */}
            <g
              transform="translate(295, 155) rotate(18)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
            </g>

            {/* 7. Juguetes (Gamepad2) */}
            <g
              transform="translate(30, 240) rotate(8)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <line x1="6" x2="10" y1="12" y2="12" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="15" x2="15.01" y1="13" y2="13" />
              <line x1="18" x2="18.01" y1="11" y2="11" />
              <rect width="20" height="12" x="2" y="6" rx="6" />
            </g>

            {/* 8. Mascotas (PawPrint) */}
            <g
              transform="translate(140, 255) rotate(-16)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="7" cy="8" r="1.8" />
              <circle cx="17" cy="8" r="1.8" />
              <circle cx="5" cy="14" r="1.8" />
              <circle cx="19" cy="14" r="1.8" />
              <path d="M12 11c-2.8 0-5 2.2-5 5 0 2 1.3 3.8 3.2 4.6.5.2 1.1.4 1.8.4s1.3-.2 1.8-.4C15.7 19.8 17 18 17 16c0-2.8-2.2-5-5-5z" />
            </g>

            {/* 9. Papelería (BookOpen) */}
            <g
              transform="translate(250, 245) rotate(14)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.045]"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </g>

            {/* 10. Bolsa de Compras (ShoppingBag) */}
            <g
              transform="translate(310, 290) rotate(-12)"
              fill="none"
              stroke="#F472A8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.05]"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </g>

            {/* 11. Deportes (Dumbbell) */}
            <g
              transform="translate(15, 320) rotate(22)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.04]"
            >
              <path d="m6.5 6.5 11 11" />
              <path d="m21 21-1-1" />
              <path d="m3 3 1 1" />
              <path d="m18 22 4-4" />
              <path d="m2 6 4-4" />
              <path d="m3 10 7-7" />
              <path d="m14 21 7-7" />
            </g>

            {/* 12. Corazón / Favoritos (Heart) */}
            <g
              transform="translate(195, 325) rotate(-8)"
              fill="none"
              stroke="#F472A8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-[0.05]"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </g>
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#alyshop-category-watermarks)"
        />
      </svg>

      {/* Marcas de agua laterales de mayor tamaño (Acentos decorativos en bordes) */}
      <div className="hidden lg:block">
        {/* Esquina superior izquierda: Perfume */}
        <div className="absolute top-28 -left-6 text-[#F472A8] opacity-[0.035] -rotate-12 scale-150">
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="5" y="8" width="14" height="13" rx="3" />
            <path d="M10 8V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
            <path d="M9 4h6" />
            <circle cx="12" cy="14.5" r="2.5" />
          </svg>
        </div>

        {/* Lateral derecho superior: Hogar */}
        <div className="absolute top-44 -right-6 text-[#6D4BB8] opacity-[0.035] rotate-12 scale-150">
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        {/* Lateral izquierdo medio: Mascotas */}
        <div className="absolute top-[48%] -left-8 text-[#6D4BB8] opacity-[0.035] rotate-6 scale-150">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="7" cy="8" r="1.8" />
            <circle cx="17" cy="8" r="1.8" />
            <circle cx="5" cy="14" r="1.8" />
            <circle cx="19" cy="14" r="1.8" />
            <path d="M12 11c-2.8 0-5 2.2-5 5 0 2 1.3 3.8 3.2 4.6.5.2 1.1.4 1.8.4s1.3-.2 1.8-.4C15.7 19.8 17 18 17 16c0-2.8-2.2-5-5-5z" />
          </svg>
        </div>

        {/* Lateral derecho medio: Juguetes */}
        <div className="absolute top-[52%] -right-8 text-[#F472A8] opacity-[0.035] -rotate-12 scale-150">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="6" x2="10" y1="12" y2="12" />
            <line x1="8" x2="8" y1="10" y2="14" />
            <line x1="15" x2="15.01" y1="13" y2="13" />
            <line x1="18" x2="18.01" y1="11" y2="11" />
            <rect width="20" height="12" x="2" y="6" rx="6" />
          </svg>
        </div>

        {/* Lateral izquierdo inferior: Sparkles Belleza */}
        <div className="absolute bottom-36 -left-6 text-[#F472A8] opacity-[0.035] 15deg scale-150">
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
        </div>

        {/* Lateral derecho inferior: Shopping Bag */}
        <div className="absolute bottom-32 -right-6 text-[#6D4BB8] opacity-[0.035] -rotate-12 scale-150">
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
      </div>
    </div>
  );
}
