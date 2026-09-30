import { Order } from "@/types";

// In-memory store for development/fallback when Supabase credentials are not yet configured
const globalForOrders = global as unknown as { fallbackOrders: Map<string, Order> };

export const fallbackOrders =
  globalForOrders.fallbackOrders || new Map<string, Order>();

if (process.env.NODE_ENV !== "production") {
  globalForOrders.fallbackOrders = fallbackOrders;
}

// Seed a demonstration order matching the prompt's reference invoice
if (!fallbackOrders.has("ALY-0001")) {
  fallbackOrders.set("ALY-0001", {
    id: "demo-order-1",
    code: "ALY-0001",
    public_token: "demo-alyshop-token-01",
    customer_name: "Carolina Gómez",
    customer_phone: "3001234567",
    city: "Cali",
    neighborhood: "San Fernando",
    address: "Calle 10 # 5-20, Casa 3",
    notes: "Timbrar fuerte, por favor",
    delivery_method: "envio",
    subtotal: 92700,
    shipping_cost: 0,
    total: 92700,
    status: "pendiente",
    created_at: new Date().toISOString(),
    order_items: [
      {
        id: "item-demo-1",
        order_id: "demo-order-1",
        product_name: "Termo de acero inoxidable 500 ml",
        unit_price: 34900,
        quantity: 1,
        subtotal: 34900,
        image_url:
          "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "item-demo-2",
        order_id: "demo-order-1",
        product_name: "Set de recipientes herméticos x5",
        unit_price: 28900,
        quantity: 2,
        subtotal: 57800,
        image_url:
          "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
      },
    ],
  });
}

export function saveFallbackOrder(order: Order) {
  fallbackOrders.set(order.code, order);
}

export function getFallbackOrder(code: string): Order | null {
  return fallbackOrders.get(code) || null;
}
