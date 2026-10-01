import { Metadata } from "next";
import { getAllAdminOrdersAction } from "@/app/actions/orders";
import { getAllAdminProducts } from "@/app/actions/products";
import { OrdersView } from "@/components/admin/OrdersView";

export const metadata: Metadata = {
  title: "Gestión de Pedidos | Admin Alyshop",
  description: "Control, seguimiento de estados y facturas de clientes en Alyshop",
};

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const [orders, products] = await Promise.all([
    getAllAdminOrdersAction(),
    getAllAdminProducts(),
  ]);

  return <OrdersView initialOrders={orders} products={products} />;
}

