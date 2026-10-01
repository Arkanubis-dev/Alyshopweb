import type { Metadata, Viewport } from "next";
import { Pacifico, Nunito } from "next/font/google";
import { getAdminSettingsAction } from "@/app/actions/settings";
import "./globals.css";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alyshop.co";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E85D04",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "alyshop | Variedad de artículos para tu hogar, estilo y bienestar en Colombia",
    template: "%s | alyshop Colombia",
  },
  description:
    "Tienda online con variedad de artículos para el hogar, cocina, ropa, belleza, tecnología, juguetes, papelería y mascotas. Envíos rápidos y seguros a toda Colombia. Pide fácil por WhatsApp sin complicaciones.",
  keywords: [
    "tienda online colombia",
    "compras por internet bogota",
    "alyshop colombia",
    "articulos para el hogar bogota",
    "cocina y comedor colombia",
    "productos de belleza bogota",
    "juguetes y papeleria kawaii",
    "accesorios de tecnologia",
    "compras seguras whatsapp",
  ],
  authors: [{ name: "alyshop Colombia", url: baseUrl }],
  creator: "alyshop",
  publisher: "alyshop",
  applicationName: "alyshop",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: baseUrl,
    siteName: "alyshop",
    title: "alyshop | Todo lo que necesitas, en un solo lugar",
    description:
      "Descubre nuestra variedad de artículos de alta calidad para el hogar, cocina, belleza, tecnología y más. Envíos a todo el país y atención personalizada vía WhatsApp.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "alyshop - Tienda Online Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "alyshop | Variedad de artículos para tu hogar y estilo en Colombia",
    description:
      "Variedad de artículos para el hogar, cocina, ropa, belleza, tecnología y mascotas. Envíos a toda Colombia.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getAdminSettingsAction();
  const primaryColor = settings?.primary_color || "#6D4BB8";
  const secondaryColor = settings?.secondary_color || "#F472A8";
  const headerBgColor = settings?.header_bg_color || "#FFFFFF";
  const textColor = settings?.text_color || "#2E2A3B";

  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: settings?.name || "alyshop",
    url: baseUrl,
    logo: settings?.logo_url || `${baseUrl}/logo.png`,
    description:
      settings?.slogan ||
      "Tienda online con variedad de artículos para el hogar, cocina, ropa, belleza, tecnología, juguetes, papelería y mascotas en Colombia.",
    telephone: `+${settings?.whatsapp_number || "573213052913"}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings?.city || "Bogotá",
      addressCountry: "CO",
    },
    currenciesAccepted: "COP",
    paymentAccepted: "Transferencia Bancaria, Pago contra entrega, Nequi, Daviplata",
    priceRange: "$$",
  };

  return (
    <html
      lang="es"
      className={`${pacifico.variable} ${nunito.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary: ${primaryColor};
                --color-secondary: ${secondaryColor};
                --color-header-bg: ${headerBgColor};
                --color-site-text: ${textColor};
                --color-aly-purple: ${primaryColor};
                --color-aly-pink: ${secondaryColor};
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFBF7] text-[#2E2A3B] font-sans selection:bg-[#FCE4EF] selection:text-[#E85D04]">
        {children}
      </body>
    </html>
  );
}
