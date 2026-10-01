import { Order } from "@/types";

// In-memory store for development/fallback when Supabase credentials are not yet configured
const globalForOrders = global as unknown as { fallbackOrders: Map<string, Order> };

export const fallbackOrders =
  globalForOrders.fallbackOrders || new Map<string, Order>();

if (process.env.NODE_ENV !== "production") {
  globalForOrders.fallbackOrders = fallbackOrders;
}

export function saveFallbackOrder(order: Order) {
  fallbackOrders.set(order.code, order);
  fallbackOrders.set(order.id, order);
}

export function getFallbackOrder(code: string): Order | null {
  return fallbackOrders.get(code) || null;
}

export function removeFallbackOrder(codeOrId: string) {
  fallbackOrders.delete(codeOrId);
  for (const [key, order] of fallbackOrders.entries()) {
    if (order.id === codeOrId || order.code === codeOrId) {
      fallbackOrders.delete(key);
    }
  }
}
