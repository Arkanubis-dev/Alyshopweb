/**
 * Utilities for normalizing and matching subcategories across alyshop
 */

/**
 * Normalizes a subcategory string:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips accents / diacritics
 * - Normalizes plurals / singulars for common terms (e.g. iluminadores -> iluminador)
 */
export function normalizeSubcategory(sub?: string | null): string {
  if (!sub) return "";
  let norm = sub
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Common aliases & normalization
  if (norm === "iluminadores") norm = "iluminador";
  if (norm === "coleccion limitada" || norm === "edicion limitada" || norm === "ediciones limitadas") {
    norm = "ediciones limitadas";
  }
  if (norm === "arabes") norm = "arabes";
  if (norm === "brocha") norm = "brochas";
  if (norm === "sombra") norm = "sombras";
  if (norm === "labio") norm = "labios";
  if (norm === "ojo") norm = "ojos";
  if (norm === "accesorio") norm = "accesorios";
  if (norm === "kit") norm = "kits";
  if (norm === "cuadernos y libretas" || norm === "cuaderno y libreta") norm = "cuadernos y libretas";

  return norm;
}

/**
 * Checks if two subcategory strings match (accent-insensitive, case-insensitive, alias-aware)
 */
export function isSubcategoryMatch(subA?: string | null, subB?: string | null): boolean {
  if (!subA || !subB) return false;
  if (subA === subB) return true;
  return normalizeSubcategory(subA) === normalizeSubcategory(subB);
}

/**
 * Given a subcategory string and a list of canonical category subcategories,
 * returns the exact string from the list that matches, or undefined if none match.
 */
export function findCanonicalSubcategory(
  sub?: string | null,
  availableSubs: string[] = []
): string | undefined {
  if (!sub) return undefined;
  // 1. Exact match
  const exact = availableSubs.find((s) => s === sub);
  if (exact) return exact;

  // 2. Normalized match
  const normTarget = normalizeSubcategory(sub);
  const found = availableSubs.find((s) => normalizeSubcategory(s) === normTarget);
  if (found) return found;

  return undefined;
}

/**
 * Canonical dictionary for standardizing alyshop subcategory names
 */
export const CANONICAL_SUBCATEGORY_NAMES: Record<string, string> = {
  arabes: "Árabes",
  "árabes": "Árabes",
  iluminador: "Iluminador",
  iluminadores: "Iluminador",
  "ediciones limitadas": "Ediciones limitadas",
  "edicion limitada": "Ediciones limitadas",
  "coleccion limitada": "Ediciones limitadas",
  "colección limitada": "Ediciones limitadas",
  ojos: "Ojos",
  ojo: "Ojos",
  brochas: "Brochas",
  sombras: "Sombras",
  labios: "Labios",
  rostro: "Rostro",
  accesorios: "Accesorios",
  "cuidado capilar": "Cuidado Capilar",
  "cuidado facial y corporal": "Cuidado facial Y Corporal",
  dama: "Dama",
  caballero: "Caballero",
  unisex: "Unisex",
  kits: "Kits",
  "cuadernos y libretas": "Cuadernos Y Libretas",
  esferos: "Esferos",
  lapices: "Lapices",
  borradores: "Borradores",
  variedades: "Variedades",
};

/**
 * Gets the standard canonical display name for a subcategory
 */
export function getCanonicalSubcategoryName(sub: string): string {
  const norm = normalizeSubcategory(sub);
  if (CANONICAL_SUBCATEGORY_NAMES[norm]) {
    return CANONICAL_SUBCATEGORY_NAMES[norm];
  }
  // Title case fallback
  return sub.trim().charAt(0).toUpperCase() + sub.trim().slice(1);
}
