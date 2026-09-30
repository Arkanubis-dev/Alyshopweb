import type { Metadata } from "next";
import { CartView } from "@/components/tienda/CartView";

export const metadata: Metadata = {
  title: "Mi Carrito de Compras | alyshop Colombia",
  description: "Revisa los productos en tu carrito y continúa con tu pedido por WhatsApp en alyshop.",
};

export default function CartPage() {
  return <CartView />;
}
