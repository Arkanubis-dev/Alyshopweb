"use server";

import { checkoutSchema, CheckoutSchemaType } from "@/lib/validations/checkout";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { formatCOP } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import { saveFallbackOrder } from "@/lib/orders-cache";
import crypto from "crypto";

interface CartInputItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface CreateOrderResult {
  success: boolean;
  error?: string;
  order_code?: string;
  public_token?: string;
  whatsapp_url?: string;
}

export async function createOrderAction(
  formData: CheckoutSchemaType,
  cartItems: CartInputItem[]
): Promise<CreateOrderResult> {
  // 1. Validar formulario con Zod
  const validation = checkoutSchema.safeParse(formData);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Datos del formulario inválidos";
    return { success: false, error: firstError };
  }

  const data = validation.data;

  // 2. Validar que el carrito no esté vacío
  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: "El carrito de compras está vacío" };
  }

  // 3. Obtener configuración de WhatsApp
  const settings = await getStoreSettings();
  const whatsappNumber =
    settings?.whatsapp?.number ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "573213052913";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const fullAddress = data.address + (data.indications ? ` (${data.indications})` : "");
  const deliveryText =
    data.delivery_method === "envio" ? "Envío a domicilio" : "Recoger en punto de entrega";

  // Formato de fecha en Colombia DD/MM/AAAA
  const today = new Date();
  const dateFormatted = today.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  try {
    const supabase = await createClient();

    // =========================================================================
    // INTENTO 1: SUPABASE RPC (Modo producción conectado)
    // =========================================================================
    if (supabase) {
      const rpcItems = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order", {
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_city: data.city,
        p_neighborhood: data.neighborhood,
        p_address: fullAddress,
        p_delivery_method: data.delivery_method,
        p_notes: data.notes || null,
        p_shipping_cost: 0,
        p_items: rpcItems,
      });

      if (!rpcError && rpcResult) {
        const orderCode = rpcResult.code;
        const publicToken = rpcResult.public_token;
        const subtotal = Number(rpcResult.subtotal);
        const total = Number(rpcResult.total);

        // Construir mensaje de WhatsApp según el formato exacto requerido
        const whatsappMessage = buildWhatsAppMessage({
          orderCode,
          dateFormatted,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          city: data.city,
          address: fullAddress,
          neighborhood: data.neighborhood,
          deliveryText,
          items: cartItems,
          subtotal,
          total,
          siteUrl,
          publicToken,
        });

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        return {
          success: true,
          order_code: orderCode,
          public_token: publicToken,
          whatsapp_url: whatsappUrl,
        };
      } else if (rpcError) {
        console.warn("Supabase RPC failed or returned error, evaluating fallback:", rpcError);
        // Si el error es de stock insuficiente, retornarlo directamente al usuario
        if (rpcError.message.includes("Stock insuficiente") || rpcError.message.includes("no existe")) {
          return { success: false, error: rpcError.message };
        }
      }
    }

    // =========================================================================
    // INTENTO 2: FALLBACK LOCAL (Modo desarrollo antes de conectar credenciales)
    // =========================================================================
    // Validar stock con datos locales
    for (const item of cartItems) {
      const mockProd = MOCK_PRODUCTS.find((p) => p.id === item.product_id);
      if (mockProd && mockProd.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para "${mockProd.name}". Solo quedan ${mockProd.stock} disponibles.`,
        };
      }
    }

    // Generar código consecutivo y token aleatorio
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `ALY-${randomNum}`;
    const publicToken = crypto.randomBytes(16).toString("hex");

    const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingCost = 0;
    const total = subtotal + shippingCost;

    const orderItems: OrderItem[] = cartItems.map((item, idx) => ({
      id: `item-${idx}-${Date.now()}`,
      order_id: `order-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      image_url: item.image_url,
    }));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: orderCode,
      public_token: publicToken,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      city: data.city,
      neighborhood: data.neighborhood,
      address: fullAddress,
      notes: data.notes || undefined,
      delivery_method: data.delivery_method,
      subtotal,
      shipping_cost: shippingCost,
      total,
      status: "pendiente",
      created_at: new Date().toISOString(),
      order_items: orderItems,
    };

    saveFallbackOrder(newOrder);

    const whatsappMessage = buildWhatsAppMessage({
      orderCode,
      dateFormatted,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      city: data.city,
      address: fullAddress,
      neighborhood: data.neighborhood,
      deliveryText,
      items: cartItems,
      subtotal,
      total,
      siteUrl,
      publicToken,
    });

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return {
      success: true,
      order_code: orderCode,
      public_token: publicToken,
      whatsapp_url: whatsappUrl,
    };
  } catch (err: any) {
    console.error("Error creating order:", err);
    return {
      success: false,
      error: err.message || "Ocurrió un error inesperado al procesar el pedido.",
    };
  }
}

/**
 * Formateador del mensaje de WhatsApp exactamente según la especificación del negocio
 */
function buildWhatsAppMessage({
  orderCode,
  dateFormatted,
  customerName,
  customerPhone,
  city,
  address,
  neighborhood,
  deliveryText,
  items,
  subtotal,
  total,
  siteUrl,
  publicToken,
}: {
  orderCode: string;
  dateFormatted: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  neighborhood: string;
  deliveryText: string;
  items: CartInputItem[];
  subtotal: number;
  total: number;
  siteUrl: string;
  publicToken: string;
}): string {
  const productLines = items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} x${item.quantity} — ${formatCOP(item.price * item.quantity)}`
    )
    .join("\n");

  const invoiceUrl = `${siteUrl}/pedido/${orderCode}?token=${publicToken}`;

  return `*Nuevo pedido alyshop*
*Pedido:* ${orderCode}
*Fecha:* ${dateFormatted}
-----------------------------
*Cliente:* ${customerName}
*Celular:* ${customerPhone}
*Ciudad:* ${city}
*Dirección:* ${address}, Barrio ${neighborhood}
*Entrega:* ${deliveryText}
-----------------------------
*Productos:*
${productLines}
-----------------------------
*Subtotal:* ${formatCOP(subtotal)}
*Envío:* Por confirmar
*TOTAL:* ${formatCOP(total)}
-----------------------------
Ver factura: ${invoiceUrl}`;
}
