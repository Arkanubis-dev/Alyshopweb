import type { Metadata } from "next";
import { CheckoutView } from "@/components/tienda/CheckoutView";

export const metadata: Metadata = {
  title: "Finalizar Pedido | alyshop Colombia",
  description: "Completa tus datos de entrega y envía tu pedido directo por WhatsApp en alyshop.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
