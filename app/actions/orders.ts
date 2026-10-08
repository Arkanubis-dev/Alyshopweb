"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { Order, OrderStatus, UpdateOrderInput } from "@/types";
import { fallbackOrders, removeFallbackOrder, saveFallbackOrder } from "@/lib/orders-cache";
import { updateProductStockAction } from "./inventory";
import { getAllAdminProducts } from "./products";
import { recordOrderCustomerAction } from "./customers";

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
          customer_email: d.customer_email,
          customer_id_number: d.customer_id_number,
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
        customer_email: input.customer_email !== undefined ? input.customer_email : order.customer_email,
        customer_id_number: input.customer_id_number !== undefined ? input.customer_id_number : order.customer_id_number,
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
      customer_email: input.customer_email !== undefined ? input.customer_email : order.customer_email,
      customer_id_number: input.customer_id_number !== undefined ? input.customer_id_number : order.customer_id_number,
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

export interface CreateManualOrderItemInput {
  product_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  image_url?: string;
}

export interface CreateManualOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_id_number?: string;
  city: string;
  neighborhood: string;
  address: string;
  delivery_method: "envio" | "recoger";
  notes?: string;
  internal_notes?: string;
  status: OrderStatus;
  shipping_cost: number;
  items: CreateManualOrderItemInput[];
}

export async function createManualOrderAction(
  input: CreateManualOrderInput
): Promise<{ success: boolean; error?: string; order?: Order }> {
  try {
    if (!input.customer_name?.trim() || !input.customer_phone?.trim()) {
      return { success: false, error: "Nombre y celular del cliente son requeridos" };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Debes incluir al menos un producto en el pedido" };
    }

    const supabase = createAdminClient();

    // 1. Calculate items & subtotals
    const processedItems = input.items.map((i, idx) => {
      const qty = Math.max(1, Number(i.quantity) || 1);
      const price = Math.max(0, Number(i.unit_price) || 0);
      return {
        id: `item-${Date.now()}-${idx}`,
        product_id: i.product_id,
        product_name: i.product_name,
        unit_price: price,
        quantity: qty,
        subtotal: price * qty,
        image_url: i.image_url,
      };
    });

    const subtotal = processedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const shippingCost = Math.max(0, Number(input.shipping_cost) || 0);
    const total = subtotal + shippingCost;

    // 2. Generate next consecutive code (ALY-0001, ALY-0002...)
    let nextCode = "ALY-0001";
    if (supabase) {
      const { data: latest } = await supabase
        .from("orders")
        .select("code")
        .order("created_at", { ascending: false })
        .limit(1);

      if (latest && latest.length > 0 && latest[0]?.code) {
        const match = latest[0].code.match(/ALY-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10) + 1;
          nextCode = `ALY-${String(num).padStart(4, "0")}`;
        }
      }
    } else {
      const orders = Array.from(fallbackOrders.values());
      if (orders.length > 0) {
        const nums = orders
          .map((o) => {
            const m = o.code.match(/ALY-(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter(Boolean);
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        nextCode = `ALY-${String(max + 1).padStart(4, "0")}`;
      }
    }

    const publicToken = crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    let finalId = `order-${Date.now()}`;

    // 3. Insert into Supabase
    if (supabase) {
      const orderPayload = {
        code: nextCode,
        public_token: publicToken,
        customer_name: input.customer_name.trim(),
        customer_phone: input.customer_phone.trim(),
        customer_email: input.customer_email?.trim() || null,
        customer_id_number: input.customer_id_number?.trim() || null,
        city: input.city.trim() || "Bogotá",
        neighborhood: input.neighborhood.trim() || "General",
        address: input.address.trim() || "Entrega acordada",
        delivery_method: input.delivery_method || "envio",
        notes: input.notes?.trim() || null,
        internal_notes: input.internal_notes?.trim() || "Pedido manual creado desde panel administrativo",
        status: input.status || "pendiente",
        subtotal,
        shipping_cost: shippingCost,
        total,
      };

      let insertedOrder: any = null;
      const { data: resOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (!orderError && resOrder) {
        insertedOrder = resOrder;
      } else {
        // Si las columnas customer_email o customer_id_number aún no existen en Supabase:
        const { customer_email, customer_id_number, ...safePayload } = orderPayload;
        const { data: safeOrder, error: safeError } = await supabase
          .from("orders")
          .insert(safePayload)
          .select()
          .single();

        if (safeError) throw safeError;
        insertedOrder = safeOrder;
      }
      finalId = insertedOrder.id;

      // Insert order items
      const itemsPayload = processedItems.map((item) => ({
        order_id: finalId,
        product_id: item.product_id || null,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        image_url: item.image_url || null,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsError) {
        console.error("Error inserting manual order items:", itemsError);
      }
    }

    // 4. If status is 'confirmado', discount stock from inventory
    if (input.status === "confirmado") {
      const allProducts = await getAllAdminProducts();
      for (const item of processedItems) {
        if (item.product_id) {
          const product = allProducts.find((p) => p.id === item.product_id);
          if (product) {
            const nextStock = Math.max(0, product.stock - item.quantity);
            await updateProductStockAction(
              product.id,
              nextStock,
              `Venta pedido manual ${nextCode}`,
              "salida"
            );
          }
        }
      }
    }

    const createdOrder: Order = {
      id: finalId,
      code: nextCode,
      public_token: publicToken,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      customer_email: input.customer_email?.trim() || undefined,
      customer_id_number: input.customer_id_number?.trim() || undefined,
      city: input.city.trim() || "Bogotá",
      neighborhood: input.neighborhood.trim() || "General",
      address: input.address.trim() || "Entrega acordada",
      delivery_method: input.delivery_method || "envio",
      notes: input.notes?.trim() || undefined,
      internal_notes: input.internal_notes?.trim() || "Pedido manual creado desde panel administrativo",
      status: input.status || "pendiente",
      subtotal,
      shipping_cost: shippingCost,
      total,
      created_at: new Date().toISOString(),
      order_items: processedItems.map((i) => ({ ...i, order_id: finalId })),
    };

    saveFallbackOrder(createdOrder);

    // Registrar SIEMPRE al cliente en la base de datos publicitaria (Automático)
    await recordOrderCustomerAction({
      id_number: input.customer_id_number?.trim() || `CC-${input.customer_phone.trim()}`,
      name: input.customer_name.trim(),
      email: input.customer_email?.trim() || "",
      phone: input.customer_phone.trim(),
      city: input.city.trim() || "Bogotá",
      neighborhood: input.neighborhood?.trim(),
      address: input.address?.trim(),
      total,
    });

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    revalidatePath(`/pedido/${nextCode}`);
    revalidatePath("/");

    return { success: true, order: createdOrder };
  } catch (err: any) {
    console.error("Error in createManualOrderAction:", err);
    return { success: false, error: err.message || "Error al crear el pedido manual" };
  }
}


