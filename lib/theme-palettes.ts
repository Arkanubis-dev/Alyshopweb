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
    .text-\\[\\#6D4BB8\\], .text-\\[\\#6d4bb8\\],
    [class*="text-[#6D4BB8]"], [class*="text-[#6d4bb8]"] {
      color: var(--color-primary) !important;
    }

    .hover\\:text-\\[\\#6D4BB8\\]:hover, .hover\\:text-\\[\\#6d4bb8\\]:hover,
    [class*="hover:text-[#6D4BB8]"]:hover, [class*="hover:text-[#6d4bb8]"]:hover {
      color: var(--color-primary) !important;
    }

    .bg-\\[\\#6D4BB8\\], .bg-\\[\\#6d4bb8\\],
    [class*="bg-[#6D4BB8]"], [class*="bg-[#6d4bb8]"] {
      background-color: var(--color-primary) !important;
    }

    .hover\\:bg-\\[\\#6D4BB8\\]:hover, .hover\\:bg-\\[\\#6d4bb8\\]:hover,
    .hover\\:bg-\\[\\#5837A3\\]:hover, .hover\\:bg-\\[\\#5837a3\\]:hover,
    .hover\\:bg-\\[\\#55359A\\]:hover, .hover\\:bg-\\[\\#55359a\\]:hover,
    [class*="hover:bg-[#6D4BB8]"]:hover, [class*="hover:bg-[#6d4bb8]"]:hover,
    [class*="hover:bg-[#5837A3]"]:hover, [class*="hover:bg-[#5837a3]"]:hover,
    [class*="hover:bg-[#55359A]"]:hover, [class*="hover:bg-[#55359a]"]:hover {
      background-color: var(--color-primary-hover) !important;
    }

    .border-\\[\\#6D4BB8\\], .border-\\[\\#6d4bb8\\],
    [class*="border-[#6D4BB8]"], [class*="border-[#6d4bb8]"] {
      border-color: var(--color-primary) !important;
    }

    .ring-\\[\\#6D4BB8\\], .ring-\\[\\#6d4bb8\\],
    [class*="ring-[#6D4BB8]"], [class*="ring-[#6d4bb8]"] {
      --tw-ring-color: var(--color-primary) !important;
    }

    .fill-\\[\\#6D4BB8\\], .fill-\\[\\#6d4bb8\\],
    [class*="fill-[#6D4BB8]"], [class*="fill-[#6d4bb8]"] {
      fill: var(--color-primary) !important;
    }

    .group:hover .group-hover\\:text-\\[\\#6D4BB8\\],
    .group:hover .group-hover\\:text-\\[\\#6d4bb8\\],
    [class*="group"]:hover [class*="group-hover:text-[#6D4BB8]"],
    [class*="group"]:hover [class*="group-hover:text-[#6d4bb8]"] {
      color: var(--color-primary) !important;
    }

    .group:hover .group-hover\\:bg-\\[\\#6D4BB8\\],
    .group:hover .group-hover\\:bg-\\[\\#6d4bb8\\],
    [class*="group"]:hover [class*="group-hover:bg-[#6D4BB8]"],
    [class*="group"]:hover [class*="group-hover:bg-[#6d4bb8]"] {
      background-color: var(--color-primary) !important;
    }

    .from-\\[\\#6D4BB8\\], .from-\\[\\#6d4bb8\\],
    [class*="from-[#6D4BB8]"], [class*="from-[#6d4bb8]"] {
      --tw-gradient-from: var(--color-primary) var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position)) !important;
    }

    .to-\\[\\#5837A3\\], .to-\\[\\#5837a3\\],
    [class*="to-[#5837A3]"], [class*="to-[#5837a3]"] {
      --tw-gradient-to: var(--color-primary-hover) var(--tw-gradient-to-position) !important;
    }

    .bg-\\[\\#EEEAFB\\], .bg-\\[\\#eeeafb\\],
    [class*="bg-[#EEEAFB]"], [class*="bg-[#eeeafb]"] {
      background-color: var(--color-primary-light) !important;
    }

    /* 2. Secondary Color Overrides (#F472A8) */
    .text-\\[\\#F472A8\\], .text-\\[\\#f472a8\\],
    [class*="text-[#F472A8]"], [class*="text-[#f472a8]"] {
      color: var(--color-secondary) !important;
    }

    .hover\\:text-\\[\\#F472A8\\]:hover, .hover\\:text-\\[\\#f472a8\\]:hover,
    [class*="hover:text-[#F472A8]"]:hover, [class*="hover:text-[#f472a8]"]:hover {
      color: var(--color-secondary) !important;
    }

    .bg-\\[\\#F472A8\\], .bg-\\[\\#f472a8\\],
    [class*="bg-[#F472A8]"], [class*="bg-[#f472a8]"] {
      background-color: var(--color-secondary) !important;
    }

    .hover\\:bg-\\[\\#F472A8\\]:hover, .hover\\:bg-\\[\\#f472a8\\]:hover,
    .hover\\:bg-\\[\\#E35E96\\]:hover, .hover\\:bg-\\[\\#e35e96\\]:hover,
    [class*="hover:bg-[#F472A8]"]:hover, [class*="hover:bg-[#f472a8]"]:hover,
    [class*="hover:bg-[#E35E96]"]:hover, [class*="hover:bg-[#e35e96]"]:hover {
      background-color: var(--color-secondary-hover) !important;
    }

    .border-\\[\\#F472A8\\], .border-\\[\\#f472a8\\],
    [class*="border-[#F472A8]"], [class*="border-[#f472a8]"] {
      border-color: var(--color-secondary) !important;
    }

    .fill-\\[\\#F472A8\\], .fill-\\[\\#f472a8\\],
    [class*="fill-[#F472A8]"], [class*="fill-[#f472a8]"] {
      fill: var(--color-secondary) !important;
    }

    .group:hover .group-hover\\:text-\\[\\#F472A8\\],
    .group:hover .group-hover\\:text-\\[\\#f472a8\\],
    [class*="group"]:hover [class*="group-hover:text-[#F472A8]"],
    [class*="group"]:hover [class*="group-hover:text-[#f472a8]"] {
      color: var(--color-secondary) !important;
    }

    .bg-\\[\\#FCE4EF\\], .bg-\\[\\#fce4ef\\],
    [class*="bg-[#FCE4EF]"], [class*="bg-[#fce4ef]"] {
      background-color: var(--color-accent-bg) !important;
    }

    /* 3. Text and Headings (#2E2A3B) */
    .text-\\[\\#2E2A3B\\], .text-\\[\\#2e2a3b\\],
    [class*="text-[#2E2A3B]"], [class*="text-[#2e2a3b]"] {
      color: var(--color-site-text) !important;
    }

    /* 4. Header Background & Dynamic Contrast */
    header.sticky {
      background-color: var(--color-header-bg) !important;
    }

    ${
      isDarkHeader
        ? `
    header.sticky [class*="text-[#2E2A3B]"] {
      color: #FFFFFF !important;
    }
    header.sticky [class*="text-[#7A7590]"] {
      color: rgba(255, 255, 255, 0.75) !important;
    }
    header.sticky button:hover,
    header.sticky a:hover {
      background-color: rgba(255, 255, 255, 0.12) !important;
    }
    header.sticky [class*="border-[#F0E8F2]"] {
      border-color: rgba(255, 255, 255, 0.15) !important;
    }
    header.sticky input[type="text"] {
      background-color: #FFFFFF !important;
      color: #2E2A3B !important;
    }
    header.sticky [class*="bg-white"] [class*="text-[#2E2A3B]"] {
      color: #2E2A3B !important;
    }
    header.sticky [class*="bg-white"] [class*="text-[#7A7590]"] {
      color: #7A7590 !important;
    }
    `
        : ""
    }
  `;
}

