"use server";

import { checkoutSchema, CheckoutSchemaType } from "@/lib/validations/checkout";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { formatCOP } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import { saveFallbackOrder } from "@/lib/orders-cache";
import { recordOrderCustomerAction } from "./customers";
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

      let rpcResult: any = null;
      let rpcError: any = null;

      // 1.1 Intentar RPC con la firma completa (incluyendo email y cédula)
      const resFull = await supabase.rpc("create_order", {
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_customer_email: data.customer_email,
        p_customer_id_number: data.customer_id_number,
        p_city: data.city,
        p_neighborhood: data.neighborhood,
        p_address: fullAddress,
        p_delivery_method: data.delivery_method,
        p_notes: data.notes || null,
        p_shipping_cost: 0,
        p_items: rpcItems,
      });

      if (!resFull.error && resFull.data) {
        rpcResult = resFull.data;
      } else {
        // Si el error es de stock, informar de inmediato
        if (
          resFull.error?.message?.includes("Stock insuficiente") ||
          resFull.error?.message?.includes("no existe")
        ) {
          return { success: false, error: resFull.error.message };
        }

        // 1.2 Si falló por discrepancia de firma (por ejemplo antes de aplicar la migración SQL),
        // reintentar con la firma original para que el pedido sí quede guardado en Supabase
        const resLegacy = await supabase.rpc("create_order", {
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

        if (!resLegacy.error && resLegacy.data) {
          rpcResult = resLegacy.data;
          // Actualizar email y cédula si las columnas existen en la base de datos
          try {
            await supabase
              .from("orders")
              .update({
                customer_email: data.customer_email,
                customer_id_number: data.customer_id_number,
              })
              .eq("code", resLegacy.data.code);
          } catch {}
        } else {
          rpcError = resLegacy.error || resFull.error;
        }
      }

      if (!rpcError && rpcResult) {
        const orderCode = rpcResult.code;
        const publicToken = rpcResult.public_token;
        const subtotal = Number(rpcResult.subtotal);
        const total = Number(rpcResult.total);

        // Guardar copia local persistente de respaldo
        saveFallbackOrder({
          id: rpcResult.order_id || `ord-${Date.now()}`,
          code: orderCode,
          public_token: publicToken,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email,
          customer_id_number: data.customer_id_number,
          city: data.city,
          neighborhood: data.neighborhood,
          address: fullAddress,
          notes: data.notes || undefined,
          delivery_method: data.delivery_method,
          subtotal,
          shipping_cost: 0,
          total,
          status: "pendiente",
          created_at: new Date().toISOString(),
          order_items: [],
        });

        // Registrar cliente (nuevo o actualización) para futuras campañas publicitarias
        await recordOrderCustomerAction({
          id_number: data.customer_id_number,
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone,
          city: data.city,
          neighborhood: data.neighborhood,
          address: fullAddress,
          total,
        });

        // Construir mensaje de WhatsApp según el formato exacto requerido
        const whatsappMessage = buildWhatsAppMessage({
          orderCode,
          dateFormatted,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          customerEmail: data.customer_email,
          customerIdNumber: data.customer_id_number,
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
        if (
          rpcError.message.includes("Stock insuficiente") ||
          rpcError.message.includes("no existe")
        ) {
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
      customer_email: data.customer_email,
      customer_id_number: data.customer_id_number,
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

    // Registrar cliente en base de datos publicitaria
    await recordOrderCustomerAction({
      id_number: data.customer_id_number,
      name: data.customer_name,
      email: data.customer_email,
      phone: data.customer_phone,
      city: data.city,
      neighborhood: data.neighborhood,
      address: fullAddress,
      total,
    });

    const whatsappMessage = buildWhatsAppMessage({
      orderCode,
      dateFormatted,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerEmail: data.customer_email,
      customerIdNumber: data.customer_id_number,
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
  customerEmail,
  customerIdNumber,
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
  customerEmail: string;
  customerIdNumber: string;
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
*Cédula / Documento:* ${customerIdNumber}
*Correo electrónico:* ${customerEmail}
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
