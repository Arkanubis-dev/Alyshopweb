import { Product } from "@/types";

/**
 * Normalizes text for lenient fuzzy matching:
 * - Removes accents/diacritics
 * - Removes file copy suffixes like (1), (2), (copia)
 * - Converts separators (-, _, ., /) to spaces
 * - Removes non-alphanumeric characters
 * - Converts to lower case and collapses consecutive spaces
 */
export function normalizeMatchString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s*\(\d+\)\s*/g, " ") // remove duplicate file numbers like (1), (2)
    .replace(/\s*\(copia\)\s*/gi, " ")
    .replace(/[-_./\\]+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Extracts the filename without its file extension
 */
export function getBaseFileName(fileName: string): string {
  if (!fileName) return "";
  const lastDot = fileName.lastIndexOf(".");
  return lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
}

export type MatchConfidence = "exact" | "high" | "medium" | "none";

export interface MatchResult {
  product: Product | null;
  confidence: MatchConfidence;
  score: number; // 0 to 1
  reason?: string;
}

/**
 * Matches an image file name against the existing product catalog.
 * Priority:
 * 1. Exact SKU match
 * 2. Exact Product Name match
 * 3. Exact Slug match
 * 4. Substring / Containment match (name inside filename or filename inside name)
 * 5. Word token overlap (Jaccard similarity >= 0.5)
 */
export function findBestMatchingProduct(
  fileName: string,
  products: Product[]
): MatchResult {
  if (!fileName || !products || products.length === 0) {
    return { product: null, confidence: "none", score: 0 };
  }

  const baseName = getBaseFileName(fileName);
  const normFile = normalizeMatchString(baseName);

  if (!normFile) {
    return { product: null, confidence: "none", score: 0 };
  }

  // 1. Exact SKU match
  for (const p of products) {
    if (p.sku) {
      const normSku = normalizeMatchString(p.sku);
      if (normSku && normSku === normFile) {
        return {
          product: p,
          confidence: "exact",
          score: 1.0,
          reason: `Coincide exactamente con el SKU: ${p.sku}`,
        };
      }
    }
  }

  // 2. Exact Product Name match
  for (const p of products) {
    const normName = normalizeMatchString(p.name);
    if (normName === normFile) {
      return {
        product: p,
        confidence: "exact",
        score: 1.0,
        reason: "Coincide exactamente con el nombre del producto",
      };
    }
  }

  // 3. Exact Slug match
  for (const p of products) {
    const normSlug = normalizeMatchString(p.slug);
    if (normSlug === normFile) {
      return {
        product: p,
        confidence: "exact",
        score: 0.95,
        reason: "Coincide con el slug del producto",
      };
    }
  }

  // 4. Substring / Containment match
  let bestContainMatch: Product | null = null;
  let maxContainLength = 0;
  for (const p of products) {
    const normName = normalizeMatchString(p.name);
    if (normName.length >= 4) {
      if (normFile.includes(normName) || normName.includes(normFile)) {
        const matchLen = Math.min(normName.length, normFile.length);
        if (matchLen > maxContainLength) {
          maxContainLength = matchLen;
          bestContainMatch = p;
        }
      }
    }
  }

  if (bestContainMatch) {
    return {
      product: bestContainMatch,
      confidence: "high",
      score: 0.85,
      reason: "Coincidencia alta por nombre contenido",
    };
  }

  // 5. Word token overlap
  const fileTokens = new Set(
    normFile.split(" ").filter((w) => w.length >= 2)
  );

  if (fileTokens.size > 0) {
    let bestTokenProduct: Product | null = null;
    let highestRatio = 0;

    for (const p of products) {
      const pTokens = new Set(
        normalizeMatchString(p.name)
          .split(" ")
          .filter((w) => w.length >= 2)
      );
      if (pTokens.size === 0) continue;

      let intersectionCount = 0;
      for (const t of fileTokens) {
        if (pTokens.has(t)) intersectionCount++;
      }

      // Jaccard similarity: intersection / union
      const unionCount = new Set([...fileTokens, ...pTokens]).size;
      const ratio = unionCount > 0 ? intersectionCount / unionCount : 0;

      if (ratio > highestRatio && ratio >= 0.45) {
        highestRatio = ratio;
        bestTokenProduct = p;
      }
    }

    if (bestTokenProduct) {
      return {
        product: bestTokenProduct,
        confidence: highestRatio >= 0.7 ? "high" : "medium",
        score: highestRatio,
        reason: `Coincidencia por palabras clave (${Math.round(highestRatio * 100)}%)`,
      };
    }
  }

  return { product: null, confidence: "none", score: 0 };
}
