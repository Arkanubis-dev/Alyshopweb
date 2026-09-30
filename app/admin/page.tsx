import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertTriangle,
  PackageX,
  ArrowRight,
  Package,
  Boxes,
  Layers,
  Settings,
  FolderTree,
  ExternalLink,
  CheckCircle2,
  Truck,
  Eye,
} from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { getAllAdminOrdersAction } from "@/app/actions/orders";
import { getAllAdminProducts } from "@/app/actions/products";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([
    getAllAdminOrdersAction(),
    getAllAdminProducts(),
  ]);

  // Calculations
  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
  );
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  const pendingOrders = orders.filter((o) => o.status === "pendiente");
  const confirmedOrders = orders.filter((o) => o.status === "confirmado" || o.status === "enviado" || o.status === "entregado");
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

  // Today's orders
  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(todayStr));

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <span>Panel de Control</span>
            <span>•</span>
            <span className="text-stone-400 font-normal">
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Dashboard alyshop
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Monitoreo en tiempo real de ventas, inventario y despacho de pedidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors shadow-xs"
          >
            <span>Ver Tienda</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Pedidos ({orders.length})</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
        {/* Total Ingresos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ingresos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 truncate">
            {formatCOP(totalRevenue)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            {confirmedOrders.length} pedidos confirmados
          </p>
        </div>

        {/* Pedidos Hoy */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos hoy</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">{todayOrders.length}</div>
          <p className="text-[11px] text-stone-500 font-medium">Registrados hoy</p>
        </div>

        {/* Pendientes de Despacho */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingOrders.length}</div>
          <p className="text-[11px] text-amber-700 font-semibold">Requieren atención</p>
        </div>

        {/* Stock Bajo */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stock bajo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {lowStockProducts.length}
          </div>
          <Link
            href="/admin/inventario"
            className="text-[11px] text-primary font-semibold hover:underline block"
          >
            Revisar inventario &rarr;
          </Link>
        </div>

        {/* Agotados */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Agotados</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {outOfStockProducts.length}
          </div>
          <Link
            href="/admin/inventario"
            className="text-[11px] text-rose-600 font-semibold hover:underline block"
          >
            Reponer stock &rarr;
          </Link>
        </div>
      </div>

      {/* Main Content Layout: Recent Orders + Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-stone-900 text-base">Últimos Pedidos</h2>
              <p className="text-xs text-stone-500">Compras registradas recientemente vía web</p>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100 flex-1 overflow-x-auto">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                const statusStyles: Record<string, string> = {
                  pendiente: "bg-amber-50 text-amber-800 border-amber-200",
                  confirmado: "bg-blue-50 text-blue-800 border-blue-200",
                  enviado: "bg-indigo-50 text-indigo-800 border-indigo-200",
                  entregado: "bg-emerald-50 text-emerald-800 border-emerald-200",
                  cancelado: "bg-rose-50 text-rose-800 border-rose-200",
                };

                return (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-stone-50/60 transition-colors flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                          {order.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            statusStyles[order.status] || "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="font-semibold text-stone-800 truncate">
                        {order.customer_name}{" "}
                        <span className="text-stone-400 font-normal">
                          • {order.city}
                        </span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-stone-900 text-sm">
                        {formatCOP(order.total)}
                      </p>
                      <Link
                        href={`/pedido/${order.code}?token=${order.public_token}`}
                        target="_blank"
                        className="text-[11px] text-primary font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Recibo</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-stone-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay pedidos registrados aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access & Critical Alerts (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
            <h2 className="font-black text-stone-900 text-sm">Módulos Administrativos</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/productos"
                className="p-3 rounded-xl border border-stone-200/70 hover:border-primary/40 hover:bg-orange-50/30 transition-all text-left group"
              >
                <Package className="w-5 h-5 text-stone-600 group-hover:text-primary mb-1.5" />
                <p className="font-bold text-stone-800 text-xs">Productos</p>
                <p className="text-[10px] text-stone-400">{totalProducts} registrados</p>
              </Link>

              <Link
                href="/admin/inventario"
                className="p-3 rounded-xl border border-stone-200/70 hover:border-primary/40 hover:bg-orange-50/30 transition-all text-left group"
              >
                <Boxes className="w-5 h-5 text-stone-600 group-hover:text-primary mb-1.5" />
                <p className="font-bold text-stone-800 text-xs">Inventario</p>
                <p className="text-[10px] text-stone-400">Kárdex y ajustes</p>
              </Link>

              <Link
                href="/admin/banners"
                className="p-3 rounded-xl border border-stone-200/70 hover:border-primary/40 hover:bg-orange-50/30 transition-all text-left group"
              >
                <Layers className="w-5 h-5 text-stone-600 group-hover:text-primary mb-1.5" />
                <p className="font-bold text-stone-800 text-xs">Banners</p>
                <p className="text-[10px] text-stone-400">Carrusel tienda</p>
              </Link>

              <Link
                href="/admin/ajustes"
                className="p-3 rounded-xl border border-stone-200/70 hover:border-primary/40 hover:bg-orange-50/30 transition-all text-left group"
              >
                <Settings className="w-5 h-5 text-stone-600 group-hover:text-primary mb-1.5" />
                <p className="font-bold text-stone-800 text-xs">Ajustes</p>
                <p className="text-[10px] text-stone-400">WhatsApp y envíos</p>
              </Link>
            </div>
          </div>

          {/* Urgent Stock Notice */}
          {outOfStockProducts.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Atención requerida</span>
              </div>
              <p className="text-xs text-rose-900 font-medium">
                Tienes <span className="font-black">{outOfStockProducts.length} productos</span> sin existencias disponibles en la tienda.
              </p>
              <Link
                href="/admin/inventario"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 underline mt-1"
              >
                <span>Añadir existencias en Kárdex</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
