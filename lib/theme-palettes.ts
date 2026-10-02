export interface ThemePalette {
  id: string;
  name: string;
  category: "Pastel" | "Metálico" | "A tu gusto";
  description: string;
  primary: string;
  secondary: string;
  headerBg: string;
  text: string;
  accentBg: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: "pastel-morado",
    name: "Pastel Morado & Rosa",
    category: "Pastel",
    description: "Paleta clásica de alyshop. Suave, tierna y amigable.",
    primary: "#6D4BB8",
    secondary: "#F472A8",
    headerBg: "#FFFFFF",
    text: "#2E2A3B",
    accentBg: "#FCE4EF",
  },
  {
    id: "pastel-fresa",
    name: "Pastel Fresa & Melocotón",
    category: "Pastel",
    description: "Tonos cálidos melocotón y rosa fresa dulce.",
    primary: "#E05D8C",
    secondary: "#FFAA90",
    headerBg: "#FFF7F9",
    text: "#3A222B",
    accentBg: "#FFE8E3",
  },
  {
    id: "pastel-menta",
    name: "Pastel Menta & Lavanda",
    category: "Pastel",
    description: "Verde menta fresco combinado con lavanda suave.",
    primary: "#389B80",
    secondary: "#A67AE3",
    headerBg: "#F2FAF7",
    text: "#1E352F",
    accentBg: "#DDF3EC",
  },
  {
    id: "pastel-celeste",
    name: "Pastel Celeste & Vainilla",
    category: "Pastel",
    description: "Azul cielo pastel con toques cálidos de vainilla.",
    primary: "#3D82C4",
    secondary: "#F5C469",
    headerBg: "#F3F8FC",
    text: "#1D2D3D",
    accentBg: "#E0EEFB",
  },
  {
    id: "metalico-oro",
    name: "Metálico Oro Real & Champán",
    category: "Metálico",
    description: "Brillo de oro fino, champán pulido y contraste de lujo.",
    primary: "#C59B27",
    secondary: "#E8C872",
    headerBg: "#1C1917",
    text: "#24221C",
    accentBg: "#FBF7ED",
  },
  {
    id: "metalico-rosegold",
    name: "Metálico Rose Gold (Oro Rosa)",
    category: "Metálico",
    description: "Oro rosado metálico de alta gama y elegancia estética.",
    primary: "#B76E79",
    secondary: "#E8A598",
    headerBg: "#231C1F",
    text: "#2A2024",
    accentBg: "#FAF1F0",
  },
  {
    id: "metalico-plata",
    name: "Metálico Plata & Titanio",
    category: "Metálico",
    description: "Cromado plateado contemporáneo con toques de grafito.",
    primary: "#4A5568",
    secondary: "#94A3B8",
    headerBg: "#0F172A",
    text: "#1E293B",
    accentBg: "#F1F5F9",
  },
  {
    id: "metalico-bronce",
    name: "Metálico Bronce & Cobre",
    category: "Metálico",
    description: "Reflejos cobrizos cálidos y bronce noble oscuro.",
    primary: "#A0522D",
    secondary: "#D97706",
    headerBg: "#211815",
    text: "#291E1A",
    accentBg: "#FBF5F0",
  },
  {
    id: "metalico-esmeralda",
    name: "Metálico Esmeralda & Oro",
    category: "Metálico",
    description: "Verde joya esmeralda colombiano con detalles en oro.",
    primary: "#0E6251",
    secondary: "#D4AF37",
    headerBg: "#0B1E1A",
    text: "#11231F",
    accentBg: "#E8F5F2",
  },
  {
    id: "personalizado",
    name: "Personalizado",
    category: "A tu gusto",
    description: "Define tus propios colores exactos para encabezado, botones y textos.",
    primary: "#6D4BB8",
    secondary: "#F472A8",
    headerBg: "#FFFFFF",
    text: "#2E2A3B",
    accentBg: "#FCE4EF",
  },
];

export function getPaletteById(id?: string): ThemePalette {
  return THEME_PALETTES.find((p) => p.id === id) || THEME_PALETTES[0];
}

export function isColorDark(hexColor?: string): boolean {
  if (!hexColor) return false;
  const hex = hexColor.replace("#", "").trim();
  if (hex.length < 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 140;
}

export function generateThemeCSS(settings?: {
  color_palette?: string;
  primary_color?: string;
  secondary_color?: string;
  header_bg_color?: string;
  text_color?: string;
}): string {
  const palette = getPaletteById(settings?.color_palette);
  const primaryColor = settings?.primary_color || palette.primary || "#6D4BB8";
  const secondaryColor = settings?.secondary_color || palette.secondary || "#F472A8";
  const headerBgColor = settings?.header_bg_color || palette.headerBg || "#FFFFFF";
  const textColor = settings?.text_color || palette.text || "#2E2A3B";
  const accentBg = palette.accentBg || "#FCE4EF";
  const isDarkHeader = isColorDark(headerBgColor);

  return `
    :root {
      --color-primary: ${primaryColor};
      --color-primary-hover: color-mix(in srgb, ${primaryColor} 85%, black);
      --color-primary-light: color-mix(in srgb, ${primaryColor} 12%, white);
      --color-secondary: ${secondaryColor};
      --color-secondary-hover: color-mix(in srgb, ${secondaryColor} 85%, black);
      --color-accent-bg: ${accentBg};
      --color-header-bg: ${headerBgColor};
      --color-header-text: ${isDarkHeader ? "#FFFFFF" : textColor};
      --color-site-text: ${textColor};
      --color-aly-purple: ${primaryColor};
      --color-aly-pink: ${secondaryColor};
    }

    /* 1. Primary Brand Overrides (#6D4BB8) */
    .tienda-root .text-\\[\\#6D4BB8\\], .tienda-root .text-\\[\\#6d4bb8\\],
    .tienda-root [class*="text-[#6D4BB8]"], .tienda-root [class*="text-[#6d4bb8]"] {
      color: var(--color-primary) !important;
    }

    .tienda-root .hover\\:text-\\[\\#6D4BB8\\]:hover, .tienda-root .hover\\:text-\\[\\#6d4bb8\\]:hover,
    .tienda-root [class*="hover:text-[#6D4BB8]"]:hover, .tienda-root [class*="hover:text-[#6d4bb8]"]:hover {
      color: var(--color-primary) !important;
    }

    .tienda-root .bg-\\[\\#6D4BB8\\], .tienda-root .bg-\\[\\#6d4bb8\\],
    .tienda-root [class*="bg-[#6D4BB8]"], .tienda-root [class*="bg-[#6d4bb8]"] {
      background-color: var(--color-primary) !important;
    }

    .tienda-root .hover\\:bg-\\[\\#6D4BB8\\]:hover, .tienda-root .hover\\:bg-\\[\\#6d4bb8\\]:hover,
    .tienda-root .hover\\:bg-\\[\\#5837A3\\]:hover, .tienda-root .hover\\:bg-\\[\\#5837a3\\]:hover,
    .tienda-root .hover\\:bg-\\[\\#55359A\\]:hover, .tienda-root .hover\\:bg-\\[\\#55359a\\]:hover,
    .tienda-root [class*="hover:bg-[#6D4BB8]"]:hover, .tienda-root [class*="hover:bg-[#6d4bb8]"]:hover,
    .tienda-root [class*="hover:bg-[#5837A3]"]:hover, .tienda-root [class*="hover:bg-[#5837a3]"]:hover,
    .tienda-root [class*="hover:bg-[#55359A]"]:hover, .tienda-root [class*="hover:bg-[#55359a]"]:hover {
      background-color: var(--color-primary-hover) !important;
    }

    .tienda-root .border-\\[\\#6D4BB8\\], .tienda-root .border-\\[\\#6d4bb8\\],
    .tienda-root [class*="border-[#6D4BB8]"], .tienda-root [class*="border-[#6d4bb8]"] {
      border-color: var(--color-primary) !important;
    }

    .tienda-root .ring-\\[\\#6D4BB8\\], .tienda-root .ring-\\[\\#6d4bb8\\],
    .tienda-root [class*="ring-[#6D4BB8]"], .tienda-root [class*="ring-[#6d4bb8]"] {
      --tw-ring-color: var(--color-primary) !important;
    }

    .tienda-root .fill-\\[\\#6D4BB8\\], .tienda-root .fill-\\[\\#6d4bb8\\],
    .tienda-root [class*="fill-[#6D4BB8]"], .tienda-root [class*="fill-[#6d4bb8]"] {
      fill: var(--color-primary) !important;
    }

    .tienda-root .group:hover .group-hover\\:text-\\[\\#6D4BB8\\],
    .tienda-root .group:hover .group-hover\\:text-\\[\\#6d4bb8\\],
    .tienda-root [class*="group"]:hover [class*="group-hover:text-[#6D4BB8]"],
    .tienda-root [class*="group"]:hover [class*="group-hover:text-[#6d4bb8]"] {
      color: var(--color-primary) !important;
    }

    .tienda-root .group:hover .group-hover\\:bg-\\[\\#6D4BB8\\],
    .tienda-root .group:hover .group-hover\\:bg-\\[\\#6d4bb8\\],
    .tienda-root [class*="group"]:hover [class*="group-hover:bg-[#6D4BB8]"],
    .tienda-root [class*="group"]:hover [class*="group-hover:bg-[#6d4bb8]"] {
      background-color: var(--color-primary) !important;
    }

    .tienda-root .from-\\[\\#6D4BB8\\], .tienda-root .from-\\[\\#6d4bb8\\],
    .tienda-root [class*="from-[#6D4BB8]"], .tienda-root [class*="from-[#6d4bb8]"] {
      background-color: var(--color-primary, #6D4BB8) !important;
      background-image: linear-gradient(135deg, var(--color-primary, #6D4BB8), var(--color-primary-hover, #5837A3)) !important;
    }

    .tienda-root .bg-\\[\\#EEEAFB\\], .tienda-root .bg-\\[\\#eeeafb\\],
    .tienda-root [class*="bg-[#EEEAFB]"], .tienda-root [class*="bg-[#eeeafb]"] {
      background-color: var(--color-primary-light) !important;
    }

    /* 2. Secondary Color Overrides (#F472A8) */
    .tienda-root .text-\\[\\#F472A8\\], .tienda-root .text-\\[\\#f472a8\\],
    .tienda-root [class*="text-[#F472A8]"], .tienda-root [class*="text-[#f472a8]"] {
      color: var(--color-secondary) !important;
    }

    .tienda-root .hover\\:text-\\[\\#F472A8\\]:hover, .tienda-root .hover\\:text-\\[\\#f472a8\\]:hover,
    .tienda-root [class*="hover:text-[#F472A8]"]:hover, .tienda-root [class*="hover:text-[#f472a8]"]:hover {
      color: var(--color-secondary) !important;
    }

    .tienda-root .bg-\\[\\#F472A8\\], .tienda-root .bg-\\[\\#f472a8\\],
    .tienda-root [class*="bg-[#F472A8]"], .tienda-root [class*="bg-[#f472a8]"] {
      background-color: var(--color-secondary) !important;
    }

    .tienda-root .hover\\:bg-\\[\\#F472A8\\]:hover, .tienda-root .hover\\:bg-\\[\\#f472a8\\]:hover,
    .tienda-root .hover\\:bg-\\[\\#E35E96\\]:hover, .tienda-root .hover\\:bg-\\[\\#e35e96\\]:hover,
    .tienda-root [class*="hover:bg-[#F472A8]"]:hover, .tienda-root [class*="hover:bg-[#f472a8]"]:hover,
    .tienda-root [class*="hover:bg-[#E35E96]"]:hover, .tienda-root [class*="hover:bg-[#e35e96]"]:hover {
      background-color: var(--color-secondary-hover) !important;
    }

    .tienda-root .border-\\[\\#F472A8\\], .tienda-root .border-\\[\\#f472a8\\],
    .tienda-root [class*="border-[#F472A8]"], .tienda-root [class*="border-[#f472a8]"] {
      border-color: var(--color-secondary) !important;
    }

    .tienda-root .fill-\\[\\#F472A8\\], .tienda-root .fill-\\[\\#f472a8\\],
    .tienda-root [class*="fill-[#F472A8]"], .tienda-root [class*="fill-[#f472a8]"] {
      fill: var(--color-secondary) !important;
    }

    .tienda-root .group:hover .group-hover\\:text-\\[\\#F472A8\\],
    .tienda-root .group:hover .group-hover\\:text-\\[\\#f472a8\\],
    .tienda-root [class*="group"]:hover [class*="group-hover:text-[#F472A8]"],
    .tienda-root [class*="group"]:hover [class*="group-hover:text-[#f472a8]"] {
      color: var(--color-secondary) !important;
    }

    .tienda-root .bg-\\[\\#FCE4EF\\], .tienda-root .bg-\\[\\#fce4ef\\],
    .tienda-root [class*="bg-[#FCE4EF]"], .tienda-root [class*="bg-[#fce4ef]"] {
      background-color: var(--color-accent-bg) !important;
    }

    /* 3. Text and Headings (#2E2A3B) */
    .tienda-root .text-\\[\\#2E2A3B\\], .tienda-root .text-\\[\\#2e2a3b\\],
    .tienda-root [class*="text-[#2E2A3B]"], .tienda-root [class*="text-[#2e2a3b]"] {
      color: var(--color-site-text) !important;
    }

    /* 4. Header Background & Dynamic Contrast */
    .tienda-root header.sticky {
      background-color: var(--color-header-bg) !important;
    }

    ${
      isDarkHeader
        ? `
    .tienda-root header.sticky [class*="text-[#2E2A3B]"] {
      color: #FFFFFF !important;
    }
    .tienda-root header.sticky [class*="text-[#7A7590]"] {
      color: rgba(255, 255, 255, 0.75) !important;
    }
    .tienda-root header.sticky button:hover,
    .tienda-root header.sticky a:hover {
      background-color: rgba(255, 255, 255, 0.12) !important;
    }
    .tienda-root header.sticky [class*="border-[#F0E8F2]"] {
      border-color: rgba(255, 255, 255, 0.15) !important;
    }
    .tienda-root header.sticky input[type="text"] {
      background-color: #FFFFFF !important;
      color: #2E2A3B !important;
    }
    .tienda-root header.sticky [class*="bg-white"] [class*="text-[#2E2A3B]"] {
      color: #2E2A3B !important;
    }
    .tienda-root header.sticky [class*="bg-white"] [class*="text-[#7A7590]"] {
      color: #7A7590 !important;
    }
    `
        : ""
    }
  `;
}

