import { createClient } from "./server";
import { getFallbackOrder } from "@/lib/orders-cache";
import { Order } from "@/types";

/**
 * Fetch an order by its consecutive code and validate its public token.
 */
export async function getOrderByCodeAndToken(
  code: string,
  token?: string
): Promise<Order | null> {
  if (!token) {
    return null;
  }

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("code", code)
        .eq("public_token", token)
        .single();

      if (!error && data) {
        if (data.public_token !== token) {
          return null;
        }

        return {
          id: data.id,
          code: data.code,
          public_token: data.public_token,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email,
          customer_id_number: data.customer_id_number,
          city: data.city,
          neighborhood: data.neighborhood,
          address: data.address,
          notes: data.notes,
          delivery_method: data.delivery_method,
          subtotal: Number(data.subtotal),
          shipping_cost: Number(data.shipping_cost),
          total: Number(data.total),
          status: data.status,
          internal_notes: data.internal_notes,
          created_at: data.created_at,
          order_items: (data.order_items || []).map((i: any) => ({
            id: i.id,
            order_id: i.order_id,
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price: Number(i.unit_price),
            quantity: i.quantity,
            subtotal: Number(i.subtotal),
            image_url: i.image_url,
          })),
        };
      }
    }

    // Check fallback in-memory order cache
    const fallback = getFallbackOrder(code);
    if (fallback) {
      if (fallback.public_token !== token) {
        return null;
      }
      return fallback;
    }

    return null;
  } catch (err) {
    console.error("Error fetching order:", err);
    const fallback = getFallbackOrder(code);
    return fallback || null;
  }
}
