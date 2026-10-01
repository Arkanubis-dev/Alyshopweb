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
