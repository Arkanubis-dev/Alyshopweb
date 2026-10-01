"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Order, OrderStatus, UpdateOrderInput } from "@/types";
import { fallbackOrders, removeFallbackOrder } from "@/lib/orders-cache";
import { updateProductStockAction } from "./inventory";
import { getAllAdminProducts } from "./products";

export async function getAllAdminOrdersAction(): Promise<Order[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          code: d.code,
          public_token: d.public_token,
          customer_name: d.customer_name,
          customer_phone: d.customer_phone,
          city: d.city,
          neighborhood: d.neighborhood,
          address: d.address,
          notes: d.notes,
          delivery_method: d.delivery_method,
          subtotal: Number(d.subtotal),
          shipping_cost: Number(d.shipping_cost),
          total: Number(d.total),
          status: d.status,
          internal_notes: d.internal_notes,
          created_at: d.created_at,
          order_items: (d.order_items || []).map((i: any) => ({
            id: i.id,
            order_id: i.order_id,
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price: Number(i.unit_price),
            quantity: i.quantity,
            subtotal: Number(i.subtotal),
            image_url: i.image_url,
          })),
        }));
      }
    }

    return Array.from(fallbackOrders.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.error("Error in getAllAdminOrdersAction:", err);
    return Array.from(fallbackOrders.values());
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const orders = await getAllAdminOrdersAction();
    const order = orders.find((o) => o.id === orderId || o.code === orderId);
    if (!order) return { success: false, error: "Pedido no encontrado" };

    const oldStatus = order.status;
    if (oldStatus === newStatus) return { success: true };

    const allProducts = await getAllAdminProducts();

    // =========================================================================
    // REGLA DE INVENTARIO:
    // Al pasar a 'confirmado': descontar stock de cada producto.
    // =========================================================================
    if (newStatus === "confirmado" && oldStatus === "pendiente") {
      // 1. Validar existencias
      for (const item of order.order_items || []) {
        if (item.product_id) {
          const prod = allProducts.find((p) => p.id === item.product_id);
          if (prod && prod.stock < item.quantity) {
            return {
              success: false,
              error: `No hay stock suficiente para confirmar: "${prod.name}" tiene ${prod.stock} disponibles y el pedido requiere ${item.quantity}.`,
            };
          }
        }
      }

      // 2. Descontar stock
      for (const item of order.order_items || []) {
        if (item.product_id) {
          const prod = allProducts.find((p) => p.id === item.product_id);
          if (prod) {
            const nextStock = Math.max(0, prod.stock - item.quantity);
            await updateProductStockAction(
              prod.id,
              nextStock,
              `Salida por venta pedido ${order.code}`,
              "salida"
            );
          }
        }
      }
    }

    // =========================================================================
    // REGLA DE INVENTARIO:
    // Si se cancela un pedido previamente confirmado o enviado: devolver stock.
    // =========================================================================
    if (newStatus === "cancelado" && (oldStatus === "confirmado" || oldStatus === "enviado")) {
      for (const item of order.order_items || []) {
        if (item.product_id) {
          const prod = allProducts.find((p) => p.id === item.product_id);
          if (prod) {
            const nextStock = prod.stock + item.quantity;
            await updateProductStockAction(
              prod.id,
              nextStock,
              `Devolución por cancelación pedido ${order.code}`,
              "devolucion"
            );
          }
        }
      }
    }

    // Actualizar estado en Supabase
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);
    }

    // Actualizar estado local
    order.status = newStatus;
    fallbackOrders.set(order.code, order);

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin/inventario");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return { success: false, error: err.message || "Error al actualizar estado" };
  }
}

export async function updateOrderDetailsAction(
  orderId: string,
  shippingCost: number,
  internalNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const orders = await getAllAdminOrdersAction();
    const order = orders.find((o) => o.id === orderId || o.code === orderId);
    if (!order) return { success: false, error: "Pedido no encontrado" };

    const total = order.subtotal + shippingCost;

    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from("orders")
        .update({
          shipping_cost: shippingCost,
          total: total,
          internal_notes: internalNotes || null,
        })
        .eq("id", order.id);
    }

    order.shipping_cost = shippingCost;
    order.total = total;
    order.internal_notes = internalNotes;
    fallbackOrders.set(order.code, order);

    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateFullOrderAction(
  orderId: string,
  input: UpdateOrderInput
): Promise<{ success: boolean; error?: string; order?: Order }> {
  try {
    const orders = await getAllAdminOrdersAction();
    const order = orders.find((o) => o.id === orderId || o.code === orderId);
    if (!order) return { success: false, error: "Pedido no encontrado" };

    const supabase = createAdminClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);

    // 1. Recalculate items and subtotal if order_items are provided
    let newItems = order.order_items || [];
    let subtotal = order.subtotal;

    if (input.order_items) {
      newItems = input.order_items.map((item, idx) => {
        const qty = Math.max(1, Number(item.quantity));
        const price = Number(item.unit_price);
        return {
          id: item.id || `item-${Date.now()}-${idx}`,
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: price,
          quantity: qty,
          subtotal: price * qty,
          image_url: item.image_url,
        };
      });
      subtotal = newItems.reduce((acc, i) => acc + i.subtotal, 0);

      // If connected to Supabase, update order_items table
      if (supabase && isUUID) {
        // Delete old items and insert current items
        await supabase.from("order_items").delete().eq("order_id", order.id);
        if (newItems.length > 0) {
          const insertPayload = newItems.map((i) => ({
            order_id: order.id,
            product_id: i.product_id || null,
            product_name: i.product_name,
            unit_price: i.unit_price,
            quantity: i.quantity,
            subtotal: i.subtotal,
            image_url: i.image_url || null,
          }));
          const { error: itemsError } = await supabase.from("order_items").insert(insertPayload);
          if (itemsError) {
            console.error("Error updating order_items in Supabase:", itemsError);
          }
        }
      }
    }

    const shippingCost = input.shipping_cost !== undefined ? Number(input.shipping_cost) : order.shipping_cost;
    const total = subtotal + shippingCost;
    const newStatus = input.status || order.status;

    // 2. Update orders table in Supabase
    if (supabase && isUUID) {
      const updatePayload: Record<string, any> = {
        customer_name: input.customer_name ?? order.customer_name,
        customer_phone: input.customer_phone ?? order.customer_phone,
        city: input.city ?? order.city,
        neighborhood: input.neighborhood ?? order.neighborhood,
        address: input.address ?? order.address,
        notes: input.notes !== undefined ? input.notes : order.notes,
        delivery_method: input.delivery_method ?? order.delivery_method,
        subtotal,
        shipping_cost: shippingCost,
        total,
        status: newStatus,
        internal_notes: input.internal_notes !== undefined ? input.internal_notes : order.internal_notes,
        updated_at: new Date().toISOString(),
      };

      const { error: orderError } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id);

      if (orderError) throw orderError;
    }

    // 3. Update local cache
    const updatedOrder: Order = {
      ...order,
      customer_name: input.customer_name ?? order.customer_name,
      customer_phone: input.customer_phone ?? order.customer_phone,
      city: input.city ?? order.city,
      neighborhood: input.neighborhood ?? order.neighborhood,
      address: input.address ?? order.address,
      notes: input.notes !== undefined ? input.notes : order.notes,
      delivery_method: input.delivery_method ?? order.delivery_method,
      subtotal,
      shipping_cost: shippingCost,
      total,
      status: newStatus,
      internal_notes: input.internal_notes !== undefined ? input.internal_notes : order.internal_notes,
      order_items: newItems,
    };

    fallbackOrders.set(order.code, updatedOrder);

    revalidatePath("/admin/pedidos");
    revalidatePath(`/pedido/${order.code}`);
    revalidatePath("/admin");
    return { success: true, order: updatedOrder };
  } catch (err: any) {
    console.error("Error in updateFullOrderAction:", err);
    return { success: false, error: err.message || "Error al actualizar el pedido" };
  }
}

export async function deleteOrderAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const orders = await getAllAdminOrdersAction();
    const order = orders.find((o) => o.id === orderId || o.code === orderId);

    const supabase = createAdminClient();
    if (supabase && order) {
      const targetId = order.id || orderId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

      if (isUUID) {
        await supabase.from("order_items").delete().eq("order_id", targetId);
        await supabase.from("orders").delete().eq("id", targetId);
      } else if (order.code) {
        await supabase.from("orders").delete().eq("code", order.code);
      }
    }

    if (order) {
      removeFallbackOrder(order.code);
      removeFallbackOrder(order.id);
    }
    removeFallbackOrder(orderId);
    removeFallbackOrder("ALY-0001");
    removeFallbackOrder("demo-order-1");

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteOrderAction:", err);
    return { success: false, error: err.message || "Error al eliminar el pedido" };
  }
}

