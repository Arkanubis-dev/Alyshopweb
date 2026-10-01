"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  AlertTriangle,
  PackageX,
  ExternalLink,
  ArrowRight,
  DollarSign,
  PieChart,
  Boxes,
  MapPin,
  Calendar,
  Percent,
  Receipt,
  Scale,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Order, Product } from "@/types";
import { formatCOP } from "@/lib/utils";

interface AdminDashboardViewProps {
  initialOrders: Order[];
  initialProducts: Product[];
}

export function AdminDashboardView({
  initialOrders,
  initialProducts,
}: AdminDashboardViewProps) {
  const [period, setPeriod] = useState<"todo" | "30d" | "7d" | "hoy">("todo");
  const [activeTab, setActiveTab] = useState<
    "resumen" | "rentabilidad" | "pedidos" | "envios" | "inventario"
  >("resumen");

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (period === "todo") return initialOrders;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return initialOrders.filter((o) => {
      const orderDate = new Date(o.created_at);
      if (period === "hoy") {
        return o.created_at?.startsWith(todayStr);
      }
      if (period === "7d") {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (period === "30d") {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [initialOrders, period]);

  // Financial & Order calculations
  const totalOrdersCount = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.status === "pendiente");
  const confirmedOrders = filteredOrders.filter(
    (o) => o.status === "confirmado" || o.status === "enviado" || o.status === "entregado"
  );
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelado");

  // Monetization
  const grossSales = confirmedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalRevenueWithShipping = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.total, 0);
  const cancelledAmount = cancelledOrders.reduce((sum, o) => sum + o.total, 0);

  // Cancellation rate
  const cancellationRate =
    totalOrdersCount > 0 ? (cancelledOrders.length / totalOrdersCount) * 100 : 0;
  const confirmationRate =
    totalOrdersCount > 0 ? (confirmedOrders.length / totalOrdersCount) * 100 : 0;

  // Product cost map for Cost of Goods Sold (COGS)
  const productCostMap = useMemo(() => {
    return new Map(
      initialProducts.map((p) => [
        p.id,
        p.cost && p.cost > 0 ? p.cost : Math.round(p.price * 0.5),
      ])
    );
  }, [initialProducts]);

  // Actual Cost of Goods Sold in confirmed orders
  const cogsSold = useMemo(() => {
    let sum = 0;
    for (const order of confirmedOrders) {
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          const unitCost =
            item.product_id && productCostMap.has(item.product_id)
              ? productCostMap.get(item.product_id)!
              : Math.round(item.unit_price * 0.5);
          sum += unitCost * item.quantity;
        }
      } else {
        sum += Math.round(order.subtotal * 0.5);
      }
    }
    return sum;
  }, [confirmedOrders, productCostMap]);

  // Real Net Profit
  const netProfit = Math.max(0, grossSales - cogsSold);
  const netMarginPct = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;
  const roiPct = cogsSold > 0 ? (netProfit / cogsSold) * 100 : 0;
  const avgOrderTicket = confirmedOrders.length > 0 ? grossSales / confirmedOrders.length : 0;

  // Inventory Totals
  const totalProducts = initialProducts.length;
  const totalStockUnits = initialProducts.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
  const lowStockProducts = initialProducts.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
  );
  const outOfStockProducts = initialProducts.filter((p) => p.stock <= 0);

  // Inventory Valuation (Investment vs Potential Retail)
  const inventoryInvestment = useMemo(() => {
    return initialProducts.reduce((sum, p) => {
      const unitCost = p.cost && p.cost > 0 ? p.cost : Math.round(p.price * 0.5);
      return sum + unitCost * Math.max(0, p.stock);
    }, 0);
  }, [initialProducts]);

  const inventoryRetailValue = useMemo(() => {
    return initialProducts.reduce((sum, p) => {
      return sum + p.price * Math.max(0, p.stock);
    }, 0);
  }, [initialProducts]);

  const inventoryProjectedProfit = Math.max(0, inventoryRetailValue - inventoryInvestment);
  const inventoryProjectedMargin =
    inventoryRetailValue > 0 ? (inventoryProjectedProfit / inventoryRetailValue) * 100 : 0;

  // Shipping Statistics
  const totalShippingCharged = confirmedOrders.reduce((sum, o) => sum + o.shipping_cost, 0);
  const avgShippingCost =
    confirmedOrders.length > 0 ? totalShippingCharged / confirmedOrders.length : 0;

  const deliveryMethodStats = useMemo(() => {
    let domicilio = 0;
    let recogida = 0;
    for (const o of confirmedOrders) {
      if (o.delivery_method === "recoger") {
        recogida++;
      } else {
        domicilio++;
      }
    }
    const total = confirmedOrders.length || 1;
    return {
      domicilio,
      recogida,
      domicilioPct: Math.round((domicilio / total) * 100),
      recogidaPct: Math.round((recogida / total) * 100),
    };
  }, [confirmedOrders]);

  // Top Destination Cities
  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of confirmedOrders) {
      const c = (o.city || "Sin especificar").trim();
      counts[c] = (counts[c] || 0) + 1;
    }
    const total = confirmedOrders.length || 1;
    return Object.entries(counts)
      .map(([city, count]) => ({
        city,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [confirmedOrders]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header and Period Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#6D4BB8] font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F472A8]" />
            <span>Panel Ejecutivo Alyshop</span>
            <span>•</span>
            <span className="text-[#7A7590] font-normal">
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E2A3B] tracking-tight">
            Estadísticas y Rentabilidad
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7590] mt-0.5">
            Analiza inversión, ganancias reales, costos de envíos, tasas de cancelación y stock.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF5FB] rounded-2xl border border-[#F0E8F2] self-start lg:self-auto">
          {[
            { id: "todo", label: "Histórico" },
            { id: "30d", label: "Últimos 30d" },
            { id: "7d", label: "Últimos 7d" },
            { id: "hoy", label: "Hoy" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === item.id
                  ? "bg-[#6D4BB8] text-white shadow-xs"
                  : "text-[#7A7590] hover:text-[#2E2A3B] hover:bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ganancia Neta Real */}
        <div className="bg-gradient-to-br from-[#6D4BB8] to-[#5837A3] text-white p-5 rounded-3xl shadow-md space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-white/80">
            <span className="text-xs font-extrabold uppercase tracking-wider">Ganancia Neta Real</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#F472A8]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black truncate">
            {formatCOP(netProfit)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/90 pt-1 border-t border-white/10 font-medium">
            <span>Margen sobre ventas:</span>
            <strong className="text-[#F472A8] font-bold">{netMarginPct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Ventas Brutas */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#7A7590]">
            <span className="text-xs font-bold uppercase tracking-wider">Ventas Productos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2E2A3B] truncate">
            {formatCOP(grossSales)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7A7590]">
            <span>{confirmedOrders.length} compras efectivas</span>
            <span className="font-bold text-emerald-600">{confirmationRate.toFixed(0)}% éxito</span>
          </div>
        </div>

        {/* Inversión en Ventas (COGS) */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#7A7590]">
            <span className="text-xs font-bold uppercase tracking-wider">Inversión Mercancía</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2E2A3B] truncate">
            {formatCOP(cogsSold)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7A7590]">
            <span>Retorno de Inversión:</span>
            <strong className="font-bold text-[#6D4BB8]">{roiPct.toFixed(0)}% ROI</strong>
          </div>
        </div>

        {/* Pedidos Cancelados */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#7A7590]">
            <span className="text-xs font-bold uppercase tracking-wider">Cancelaciones</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {cancelledOrders.length}{" "}
            <span className="text-xs font-semibold text-[#7A7590]">({cancellationRate.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7A7590]">
            <span>Monto no concretado:</span>
            <span className="font-bold text-rose-500">{formatCOP(cancelledAmount)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F0E8F2] pb-3 overflow-x-auto text-xs font-bold">
        {[
          { id: "resumen", label: "Resumen General", icon: PieChart },
          { id: "rentabilidad", label: "Inversión vs Ganancia", icon: DollarSign },
          { id: "pedidos", label: "Pedidos y Cancelaciones", icon: ShoppingBag },
          { id: "envios", label: "Logística y Envíos", icon: Truck },
          { id: "inventario", label: "Salud del Inventario", icon: Boxes },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#6D4BB8] text-white shadow-xs"
                  : "bg-white text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] border border-[#F0E8F2]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESUMEN GENERAL & RENTABILIDAD HIGHLIGHTS */}
      {/* ========================================================================= */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Rentabilidad de Ventas */}
          <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#2E2A3B]">
                  Desglose Financiero: Inversión vs Ganancia en Ventas
                </h3>
                <p className="text-xs text-[#7A7590]">
                  Cálculo basado en el costo interno de cada producto vendido en pedidos confirmados.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EEEAFB] text-[#6D4BB8]">
                Margen {netMarginPct.toFixed(1)}%
              </span>
            </div>

            {/* Visual Margin Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#7A7590]">
                <span>Costo Inversión: {formatCOP(cogsSold)}</span>
                <span className="text-[#6D4BB8]">Ganancia Neta: {formatCOP(netProfit)}</span>
              </div>
              <div className="h-4 w-full bg-[#FAF5FB] rounded-full overflow-hidden flex border border-[#F0E8F2]">
                <div
                  style={{
                    width: `${grossSales > 0 ? (cogsSold / grossSales) * 100 : 50}%`,
                  }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title="Costo de mercancía"
                />
                <div
                  style={{
                    width: `${grossSales > 0 ? (netProfit / grossSales) * 100 : 50}%`,
                  }}
                  className="bg-[#6D4BB8] h-full transition-all duration-500"
                  title="Ganancia neta"
                />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-[#7A7590] pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Inversión en Productos ({grossSales > 0 ? ((cogsSold / grossSales) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6D4BB8] inline-block" />
                  Ganancia Neta Obtenida ({netMarginPct.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F0E8F2]">
              <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1">
                <span className="text-[11px] text-[#7A7590] font-semibold">Total Facturado</span>
                <p className="font-extrabold text-sm text-[#2E2A3B]">{formatCOP(totalRevenueWithShipping)}</p>
                <span className="text-[10px] text-[#7A7590] block">Incluye fletes</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1">
                <span className="text-[11px] text-[#7A7590] font-semibold">Ticket Promedio</span>
                <p className="font-extrabold text-sm text-[#2E2A3B]">{formatCOP(avgOrderTicket)}</p>
                <span className="text-[10px] text-[#7A7590] block">Por cliente confirmado</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1">
                <span className="text-[11px] text-[#7A7590] font-semibold">Flete Cobrado</span>
                <p className="font-extrabold text-sm text-[#6D4BB8]">{formatCOP(totalShippingCharged)}</p>
                <span className="text-[10px] text-[#7A7590] block">Prom: {formatCOP(avgShippingCost)}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-1">
                <span className="text-[11px] text-[#7A7590] font-semibold">Por Confirmar</span>
                <p className="font-extrabold text-sm text-amber-600">{formatCOP(pendingAmount)}</p>
                <span className="text-[10px] text-amber-700 block">{pendingOrders.length} pedidos</span>
              </div>
            </div>
          </div>

          {/* Card: Inventario Valorado */}
          <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#2E2A3B]">Valor de tu Inventario</h3>
              <Boxes className="w-5 h-5 text-[#6D4BB8]" />
            </div>

            <p className="text-xs text-[#7A7590]">
              Capital inmovilizado y potencial de venta de las existencias actuales en bodega.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#7A7590] font-semibold block">Inversión en Bodega</span>
                  <span className="text-xs text-[#7A7590]">(Costo total de stock)</span>
                </div>
                <span className="text-base font-extrabold text-[#2E2A3B]">
                  {formatCOP(inventoryInvestment)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#7A7590] font-semibold block">Valor de Venta Total</span>
                  <span className="text-xs text-[#7A7590]">(Si vendes todo el stock)</span>
                </div>
                <span className="text-base font-extrabold text-emerald-700">
                  {formatCOP(inventoryRetailValue)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EEEAFB] border border-[#E0D4F0] flex items-center justify-between text-[#6D4BB8]">
                <div>
                  <span className="text-xs font-bold block">Ganancia Proyectada</span>
                  <span className="text-[11px] opacity-80">Margen potencial</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black block">{formatCOP(inventoryProjectedProfit)}</span>
                  <span className="text-[11px] font-bold text-[#F472A8]">
                    +{inventoryProjectedMargin.toFixed(0)}% margen
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/admin/inventario"
              className="w-full py-2.5 rounded-xl border border-[#F0E8F2] hover:bg-[#FAF5FB] text-xs font-bold text-[#6D4BB8] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Ver Kárdex de Inventario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RENTABILIDAD DETALLADA (INVERSIÓN VS GANANCIA) */}
      {/* ========================================================================= */}
      {activeTab === "rentabilidad" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7590]">
                1. ¿Cuánto invertiste en lo vendido?
              </span>
              <div className="text-2xl font-black text-[#2E2A3B]">{formatCOP(cogsSold)}</div>
              <p className="text-xs text-[#7A7590] leading-relaxed">
                Es el costo de adquisición de los productos que ya fueron confirmados o entregados.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7590]">
                2. ¿A cuánto lo vendiste?
              </span>
              <div className="text-2xl font-black text-emerald-700">{formatCOP(grossSales)}</div>
              <p className="text-xs text-[#7A7590] leading-relaxed">
                Ingresos brutos percibidos únicamente por productos (sin incluir flete de envío).
              </p>
            </div>

            <div className="bg-[#FAF5FB] p-6 rounded-3xl border border-[#E0D4F0] shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8]">
                3. Tu Ganancia Neta Real
              </span>
              <div className="text-2xl font-black text-[#6D4BB8]">{formatCOP(netProfit)}</div>
              <p className="text-xs text-[#7A7590] leading-relaxed">
                Ganancia limpia en el bolsillo. Retorno de inversión del{" "}
                <strong className="text-[#6D4BB8]">{roiPct.toFixed(1)}%</strong> sobre tu costo.
              </p>
            </div>
          </div>

          {/* Profit Breakdown by Catalog Category */}
          <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-[#2E2A3B]">
                  Potencial de Ganancia por Producto en Catálogo
                </h3>
                <p className="text-xs text-[#7A7590]">
                  Monitorea cuánto ganas por cada unidad vendida de tus productos más populares.
                </p>
              </div>
              <Link
                href="/admin/productos"
                className="text-xs font-bold text-[#6D4BB8] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Ajustar costos y precios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F0E8F2] text-[11px] font-bold uppercase text-[#7A7590]">
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Costo Unitario</th>
                    <th className="py-2.5 px-3">Precio Venta</th>
                    <th className="py-2.5 px-3">Ganancia / Unidad</th>
                    <th className="py-2.5 px-3 text-center">Margen</th>
                    <th className="py-2.5 px-3 text-right">Stock Disp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F2F9]">
                  {initialProducts.slice(0, 10).map((prod) => {
                    const cost = prod.cost && prod.cost > 0 ? prod.cost : Math.round(prod.price * 0.5);
                    const unitProfit = Math.max(0, prod.price - cost);
                    const margin = prod.price > 0 ? (unitProfit / prod.price) * 100 : 0;

                    return (
                      <tr key={prod.id} className="hover:bg-[#FFFBF7]/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#2E2A3B]">{prod.name}</td>
                        <td className="py-2.5 px-3 text-[#7A7590]">{formatCOP(cost)}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#2E2A3B]">{formatCOP(prod.price)}</td>
                        <td className="py-2.5 px-3 font-extrabold text-[#6D4BB8]">+{formatCOP(unitProfit)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEAFB] text-[#6D4BB8]">
                            {margin.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#2E2A3B]">{prod.stock} un.</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ESTADÍSTICAS DE PEDIDOS Y CANCELACIONES */}
      {/* ========================================================================= */}
      {activeTab === "pedidos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">Total Registrados</span>
              <p className="text-2xl font-black text-[#2E2A3B]">{totalOrdersCount}</p>
              <span className="text-xs text-[#7A7590]">En el período seleccionado</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Compras Confirmadas</span>
              <p className="text-2xl font-black text-emerald-700">{confirmedOrders.length}</p>
              <span className="text-xs text-emerald-600 font-semibold">{confirmationRate.toFixed(1)}% del total</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pendientes</span>
              <p className="text-2xl font-black text-amber-600">{pendingOrders.length}</p>
              <span className="text-xs text-amber-700 font-semibold">Requieren atención o contacto</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Cancelados</span>
              <p className="text-2xl font-black text-rose-600">{cancelledOrders.length}</p>
              <span className="text-xs text-rose-600 font-semibold">Tasa de cancelación: {cancellationRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Cancellation Analysis Box */}
          <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-950">
                  Análisis de Pedidos Cancelados
                </h3>
                <p className="text-xs text-rose-800">
                  Se han cancelado {cancelledOrders.length} pedidos correspondientes a {formatCOP(cancelledAmount)} en ventas potenciales.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-rose-100 text-xs text-stone-700 space-y-2">
              <p className="font-bold text-stone-900">💡 Consejos para reducir cancelaciones:</p>
              <ul className="list-disc list-inside space-y-1 text-[#7A7590]">
                <li>Contacta al cliente por WhatsApp en los primeros 10 minutos tras recibir el pedido.</li>
                <li>Confirma disponibilidad de stock y acuerda si prefieren contraentrega o transferencia.</li>
                <li>Si el cliente desea modificar datos o un producto, utiliza el <strong>CRUD de Pedidos</strong> para ajustarlo sin necesidad de cancelar.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOGÍSTICA Y ENVÍOS */}
      {/* ========================================================================= */}
      {activeTab === "envios" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modalidades de Entrega */}
          <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#2E2A3B]">Modalidad de Despacho</h3>
            <p className="text-xs text-[#7A7590]">
              Preferencia de los clientes al realizar compras en alyshop.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2E2A3B] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#6D4BB8]" />
                    Envío a Domicilio
                  </span>
                  <span className="font-extrabold text-[#6D4BB8]">
                    {deliveryMethodStats.domicilio} pedidos ({deliveryMethodStats.domicilioPct}%)
                  </span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#F0E8F2]">
                  <div
                    style={{ width: `${deliveryMethodStats.domicilioPct}%` }}
                    className="h-full bg-[#6D4BB8] rounded-full"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2E2A3B] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#F472A8]" />
                    Recoger en Tienda / Bodega
                  </span>
                  <span className="font-extrabold text-[#F472A8]">
                    {deliveryMethodStats.recogida} pedidos ({deliveryMethodStats.recogidaPct}%)
                  </span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#F0E8F2]">
                  <div
                    style={{ width: `${deliveryMethodStats.recogidaPct}%` }}
                    className="h-full bg-[#F472A8] rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EEEAFB] text-xs text-[#6D4BB8] space-y-1">
              <span className="font-bold block">Total Recaudado en Fletes:</span>
              <p className="text-lg font-black">{formatCOP(totalShippingCharged)}</p>
              <span className="text-[11px] opacity-80">Promedio de flete: {formatCOP(avgShippingCost)} por pedido</span>
            </div>
          </div>

          {/* Top Destination Cities */}
          <div className="bg-white p-6 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-4 lg:col-span-2">
            <h3 className="font-extrabold text-base text-[#2E2A3B]">Ciudades Principales de Destino</h3>
            <p className="text-xs text-[#7A7590]">
              Lugares donde más compran tus clientes para enfocar tus campañas publicitarias.
            </p>

            <div className="space-y-3 pt-2">
              {topCities.length > 0 ? (
                topCities.map((item, idx) => (
                  <div
                    key={item.city}
                    className="p-3.5 rounded-2xl bg-[#FAF5FB] border border-[#F0E8F2] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#6D4BB8] text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-[#2E2A3B]">{item.city}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[#7A7590]">{item.count} pedidos</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEEAFB] text-[#6D4BB8] font-bold">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#7A7590] text-xs">
                  No hay pedidos con ciudad registrada en este período.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SALUD DEL INVENTARIO */}
      {/* ========================================================================= */}
      {activeTab === "inventario" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7590]">Total Referencias</span>
              <p className="text-2xl font-black text-[#2E2A3B]">{totalProducts}</p>
              <span className="text-xs text-[#7A7590]">Productos en catálogo</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D4BB8]">Unidades Físicas</span>
              <p className="text-2xl font-black text-[#6D4BB8]">{totalStockUnits}</p>
              <span className="text-xs text-[#7A7590]">Unidades en bodega</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Stock Bajo</span>
              <p className="text-2xl font-black text-amber-600">{lowStockProducts.length}</p>
              <span className="text-xs text-amber-700 font-semibold">Cerca de agotarse</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0E8F2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Agotados</span>
              <p className="text-2xl font-black text-rose-600">{outOfStockProducts.length}</p>
              <span className="text-xs text-rose-600 font-semibold">Sin existencias (0 un.)</span>
            </div>
          </div>

          {/* Quick Access to Inventory Actions */}
          <div className="p-6 bg-white rounded-3xl border border-[#F0E8F2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-[#2E2A3B]">Kárdex y Movimientos de Inventario</h3>
              <p className="text-xs text-[#7A7590]">
                Registra compras de mercancía a proveedores, ajustes por mermas o devoluciones.
              </p>
            </div>
            <Link
              href="/admin/inventario"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6D4BB8] hover:bg-[#5837A3] text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>Abrir Módulo de Inventario</span>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-[#F0E8F2] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#F0E8F2] flex items-center justify-between">
          <div>
            <h2 className="font-black text-base text-[#2E2A3B]">Últimos Pedidos Registrados</h2>
            <p className="text-xs text-[#7A7590]">Órdenes recibidas recientemente</p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs font-bold text-[#6D4BB8] hover:underline flex items-center gap-1"
          >
            <span>Ver todos los pedidos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#F7F2F9]">
          {filteredOrders.slice(0, 5).map((order) => {
            const statusStyles: Record<string, string> = {
              pendiente: "bg-amber-50 text-amber-800 border-amber-200",
              confirmado: "bg-blue-50 text-blue-800 border-blue-200",
              enviado: "bg-purple-50 text-purple-800 border-purple-200",
              entregado: "bg-emerald-50 text-emerald-800 border-emerald-200",
              cancelado: "bg-rose-50 text-rose-800 border-rose-200",
            };

            return (
              <div
                key={order.id}
                className="p-4 hover:bg-[#FFFBF7]/60 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#6D4BB8] bg-[#EEEAFB] px-2.5 py-0.5 rounded-lg">
                      {order.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                        statusStyles[order.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="font-bold text-[#2E2A3B] truncate">
                    {order.customer_name}{" "}
                    <span className="text-[#7A7590] font-normal">• {order.city}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-sm text-[#2E2A3B]">{formatCOP(order.total)}</p>
                  <Link
                    href={`/pedido/${order.code}?token=${order.public_token}`}
                    target="_blank"
                    className="text-[11px] text-[#F472A8] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Factura</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-[#7A7590] text-xs">
              No hay pedidos en el período seleccionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
