import { Metadata } from "next";
import { getAllAdminCustomersAction } from "@/app/actions/customers";
import { getAllAdminOrdersAction } from "@/app/actions/orders";
import { CustomersView } from "@/components/admin/CustomersView";

export const metadata: Metadata = {
  title: "Clientes y Publicidad | Admin Alyshop",
  description: "Base de datos de clientes registrados para campañas comerciales, email marketing y WhatsApp",
};

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const [customers, orders] = await Promise.all([
    getAllAdminCustomersAction(),
    getAllAdminOrdersAction(),
  ]);

  return <CustomersView initialCustomers={customers} orders={orders} />;
}
