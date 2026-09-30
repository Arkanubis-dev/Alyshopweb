"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { InventoryMovement } from "@/types";
import { getAllAdminProducts } from "./products";

// Fallback in-memory movements store
const globalForMovements = global as unknown as { adminMovements: InventoryMovement[] };
const adminMovementsStore =
  globalForMovements.adminMovements || [
    {
      id: "mov-demo-1",
      product_id: "prod-1",
      product_name: "Termo de acero inoxidable 500 ml",
      type: "entrada",
      quantity: 10,
      reason: "Recepción de mercancía proveedor inicial",
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    },
    {
      id: "mov-demo-2",
      product_id: "prod-2",
      product_name: "Set de recipientes herméticos x5",
      type: "salida",
      quantity: 2,
      reason: "Venta directa pedido ALY-0001",
      order_id: "demo-order-1",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

if (process.env.NODE_ENV !== "production") {
  globalForMovements.adminMovements = adminMovementsStore;
}

export async function getInventoryMovementsAction(
  productId?: string
): Promise<InventoryMovement[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      let query = supabase
        .from("inventory_movements")
        .select(`
          *,
          products (name)
        `)
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((m: any) => ({
          id: m.id,
          product_id: m.product_id,
          product_name: m.products?.name || "Producto",
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          order_id: m.order_id,
          created_by: m.created_by,
          created_at: m.created_at,
        }));
      }
    }

    if (productId) {
      return adminMovementsStore.filter((m) => m.product_id === productId);
    }
    return adminMovementsStore;
  } catch (err) {
    console.error("Error fetching inventory movements:", err);
    return adminMovementsStore;
  }
}

export async function updateProductStockAction(
  productId: string,
  newStock: number,
  reason: string,
  type: "entrada" | "salida" | "ajuste" | "devolucion" = "ajuste"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newStock < 0) {
      return { success: false, error: "El stock no puede ser negativo" };
    }

    const products = await getAllAdminProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, error: "Producto no encontrado" };

    const currentStock = product.stock;
    const diff = newStock - currentStock;
    const movementQty = Math.abs(diff);

    const supabase = createAdminClient();
    if (supabase) {
      // 1. Update product stock
      const { error: stockErr } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId);
      if (stockErr) throw stockErr;

      // 2. Insert movement
      await supabase.from("inventory_movements").insert({
        product_id: productId,
        type: type,
        quantity: movementQty,
        reason: reason || `Ajuste manual de ${currentStock} a ${newStock}`,
      });
    }

    // Local fallback update
    product.stock = newStock;
    adminMovementsStore.unshift({
      id: `mov-${Date.now()}`,
      product_id: productId,
      product_name: product.name,
      type: type,
      quantity: movementQty,
      reason: reason || `Ajuste de inventario de ${currentStock} a ${newStock}`,
      created_at: new Date().toISOString(),
    });

    revalidatePath("/admin/inventario");
    revalidatePath("/admin/productos");
    revalidatePath("/(tienda)", "page");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating stock:", err);
    return { success: false, error: err.message || "Error al actualizar stock" };
  }
}
