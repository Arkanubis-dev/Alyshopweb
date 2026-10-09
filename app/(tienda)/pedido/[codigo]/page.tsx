import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getOrderByCodeAndToken } from "@/lib/supabase/orders";
import { getStoreSettings } from "@/lib/supabase/queries";
import { InvoiceView } from "@/components/tienda/InvoiceView";
import { formatCOP } from "@/lib/utils";

interface OrderPageProps {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Factura / Pedido ${codigo} | alyshop Colombia`,
    description: `Detalles y resumen del pedido ${codigo} en alyshop.`,
  };
}

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { codigo } = await params;
  const { token } = await searchParams;

  const order = await getOrderByCodeAndToken(codigo, token);

  // Seguridad: si el pedido no existe o el token no coincide, bloquear el acceso
  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#2E2A3B]">Acceso no autorizado</h1>
          <p className="text-xs text-[#7A7590] leading-relaxed">
            No encontramos el pedido con el código <strong>{codigo}</strong> o el enlace de seguridad no es válido.
            Por motivos de privacidad de nuestros clientes, solo se puede acceder con el enlace provisto tras realizar la compra.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F472A8] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la tienda</span>
          </Link>
        </div>
      </div>
    );
  }

  const settings = await getStoreSettings();
  const whatsappNumber =
    settings?.whatsapp?.number ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "573213052913";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const dateFormatted = new Date(order.created_at).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const productLines = (order.order_items || [])
    .map((item, idx) => {
      if (item.transferred_to_code) {
        return `${idx + 1}. ~${item.product_name} x${item.quantity}~ (Transferido a pedido ${item.transferred_to_code})`;
      }
      if (item.transferred_from_code) {
        return `${idx + 1}. ${item.product_name} x${item.quantity} — ${formatCOP(item.subtotal)} (Complemento de ${item.transferred_from_code})`;
      }
      return `${idx + 1}. ${item.product_name} x${item.quantity} — ${formatCOP(item.subtotal)}`;
    })
    .join("\n");

  const invoiceUrl = `${siteUrl}/pedido/${order.code}?token=${order.public_token}`;

  const whatsappMessage = `*Nuevo pedido alyshop*
*Pedido:* ${order.code}
*Fecha:* ${dateFormatted}
-----------------------------
*Cliente:* ${order.customer_name}
*Celular:* ${order.customer_phone}${order.customer_id_number ? `\n*Cédula / Documento:* ${order.customer_id_number}` : ""}${order.customer_email ? `\n*Correo electrónico:* ${order.customer_email}` : ""}
*Ciudad:* ${order.city}
*Dirección:* ${order.address}, Barrio ${order.neighborhood}
*Entrega:* ${order.delivery_method === "envio" ? "Envío a domicilio" : "Recoger en punto"}
-----------------------------
*Productos:*
${productLines}
-----------------------------
*Subtotal:* ${formatCOP(order.subtotal)}
*Envío:* ${order.shipping_cost > 0 ? formatCOP(order.shipping_cost) : "Por confirmar"}
*TOTAL:* ${formatCOP(order.total)}
-----------------------------
Ver factura: ${invoiceUrl}`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return <InvoiceView order={order} whatsappUrl={whatsappUrl} />;
}
