import fs from "fs";
import path from "path";
import { Order } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating data directory:", err);
  }
}

function loadOrdersFromFile(): Map<string, Order> {
  const map = new Map<string, Order>();
  try {
    ensureDataDir();
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      if (raw.trim()) {
        const list: Order[] = JSON.parse(raw);
        for (const o of list) {
          map.set(o.code, o);
          map.set(o.id, o);
        }
      }
    }
  } catch (err) {
    console.error("Error loading orders from file:", err);
  }
  return map;
}

function persistOrdersToFile(map: Map<string, Order>): void {
  try {
    ensureDataDir();
    const uniqueMap = new Map<string, Order>();
    for (const o of map.values()) {
      uniqueMap.set(o.id, o);
    }
    const list = Array.from(uniqueMap.values());
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving orders to file:", err);
  }
}

// In-memory store backed by persistent file
const globalForOrders = global as unknown as { fallbackOrders: Map<string, Order> };

export const fallbackOrders =
  globalForOrders.fallbackOrders || loadOrdersFromFile();

if (process.env.NODE_ENV !== "production") {
  globalForOrders.fallbackOrders = fallbackOrders;
}

export function getAllFallbackOrders(): Order[] {
  const freshMap = loadOrdersFromFile();
  const uniqueMap = new Map<string, Order>();
  for (const o of freshMap.values()) {
    uniqueMap.set(o.id, o);
  }
  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function saveFallbackOrder(order: Order) {
  fallbackOrders.set(order.code, order);
  fallbackOrders.set(order.id, order);
  persistOrdersToFile(fallbackOrders);
}

export function getFallbackOrder(code: string): Order | null {
  const freshMap = loadOrdersFromFile();
  return freshMap.get(code) || null;
}

export function removeFallbackOrder(codeOrId: string) {
  fallbackOrders.delete(codeOrId);
  for (const [key, order] of fallbackOrders.entries()) {
    if (order.id === codeOrId || order.code === codeOrId) {
      fallbackOrders.delete(key);
    }
  }
  persistOrdersToFile(fallbackOrders);
}
