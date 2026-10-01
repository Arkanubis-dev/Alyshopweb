import Link from "next/link";
import { MessageCircle, Heart, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { getStoreSettings } from "@/lib/supabase/queries";

export async function Footer() {
  const settings = await getStoreSettings();

  const rawWhatsapp =
    settings.whatsapp?.number ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "573213052913";
  const cleanPhone = rawWhatsapp.replace(/\D/g, "");

  const cityName = settings.store_info?.city || "Bogotá";

  const instagramUrl =
    settings.social?.instagram ||
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    "";

  const facebookUrl =
    settings.social?.facebook ||
    process.env.NEXT_PUBLIC_FACEBOOK_URL ||
    "";

  const tiktokUrl =
    settings.social?.tiktok ||
    process.env.NEXT_PUBLIC_TIKTOK_URL ||
    "";

  const hasSocials = Boolean(instagramUrl || facebookUrl || tiktokUrl);

  return (
    <footer className="w-full bg-white border-t border-[#F0E8F2] pt-12 pb-24 md:pb-12 text-[#2E2A3B]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-[#F5EDF7]">
          {/* Brand info */}
          <div className="space-y-4">
            <Logo size="md" />
            <p className="text-xs sm:text-sm text-[#7A7590] leading-relaxed">
              Tu tienda online de confianza en Colombia. Te traemos artículos únicos,
              útiles y de la mejor calidad para tu hogar, familia y bienestar.
            </p>
            {/* WhatsApp direct CTA */}
            <a
              href={`https://wa.me/${cleanPhone}?text=Hola%20alyshop,%20tengo%20una%20consulta%20sobre%20sus%20productos`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Pedir por WhatsApp (+57 321 305 2913)</span>
            </a>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
              Categorías
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#7A7590]">
              <li>
                <Link href="/categoria/hogar-y-decoracion" className="hover:text-[#6D4BB8] transition-colors">
                  Hogar y decoración
                </Link>
              </li>
              <li>
                <Link href="/categoria/cocina-y-comedor" className="hover:text-[#6D4BB8] transition-colors">
                  Cocina y comedor
                </Link>
              </li>
              <li>
                <Link href="/categoria/belleza-y-cuidado-personal" className="hover:text-[#6D4BB8] transition-colors">
                  Belleza y cuidado personal
                </Link>
              </li>
              <li>
                <Link href="/categoria/perfumes" className="hover:text-[#6D4BB8] transition-colors">
                  Perfumería y fragancias
                </Link>
              </li>
              <li>
                <Link href="/categoria/tecnologia-y-accesorios" className="hover:text-[#6D4BB8] transition-colors">
                  Tecnología y accesorios
                </Link>
              </li>
              <li>
                <Link href="/categoria/mascotas" className="hover:text-[#6D4BB8] transition-colors">
                  Mascotas
                </Link>
              </li>
            </ul>
          </div>

          {/* Información y Ayuda */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
              Ayuda y Pedidos
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#7A7590]">
              <li>
                <Link href="/carrito" className="hover:text-[#6D4BB8] transition-colors">
                  Ver mi carrito
                </Link>
              </li>
              <li>
                <Link href="/favoritos" className="hover:text-[#6D4BB8] transition-colors">
                  Mis favoritos
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="hover:text-[#6D4BB8] transition-colors font-medium">
                  Preguntas frecuentes y envíos
                </Link>
              </li>
              <li>
                <span className="text-[#2E2A3B] font-medium">¿Cómo funciona?</span>
                <p className="text-[11px] text-[#7A7590] mt-0.5">
                  Eliges tus productos, completas tus datos y nos envías el pedido por WhatsApp con un solo clic.
                </p>
              </li>
            </ul>
          </div>

          {/* Contacto y redes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
              Contacto
            </h4>
            <div className="space-y-2 text-xs sm:text-sm text-[#7A7590]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F472A8] shrink-0" />
                <span>{cityName}, Colombia • Envíos nacionales</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F472A8] shrink-0" />
                <span>+57 321 305 2913</span>
              </div>
            </div>

            {/* Redes sociales dinámicas configurables desde el panel admin */}
            {hasSocials && (
              <div className="pt-2 flex items-center gap-3">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-full bg-[#FCE4EF] text-[#6D4BB8] hover:bg-[#F472A8] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-[#FCE4EF] text-[#6D4BB8] hover:bg-[#F472A8] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.889C10.5 0 9 1.583 9 4.615V8z"/>
                    </svg>
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="w-8 h-8 rounded-full bg-[#FCE4EF] text-[#6D4BB8] hover:bg-[#F472A8] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.4a6.33 6.33 0 0 0-6.6 6.32 6.34 6.34 0 0 0 10.84 4.51c1.2-1.2 1.81-2.82 1.81-4.51V8.65a8.28 8.28 0 0 0 4.22 1.5V6.7c-.33 0-.67-.01-1-.01z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom copyright & credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A7590]">
          <p>© {new Date().getFullYear()} alyshop. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-[#F472A8] fill-[#F472A8]" />
            <span>para toda Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
