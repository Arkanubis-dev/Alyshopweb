-- ============================================================================
-- Migración: Soporte para Despacho Parcial y Transferencia de Pedidos Pendientes
-- Permite transferir productos de una orden a una nueva orden sin duplicidad de stock
-- ============================================================================

-- 1. Agregar columnas a order_items para trazabilidad de transferencia entre pedidos
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS transferred_to_code TEXT,
  ADD COLUMN IF NOT EXISTS transferred_from_code TEXT;

-- 2. Agregar columna a orders para vincular la orden padre / orden original
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parent_order_code TEXT;

-- 3. Índices para agilizar búsquedas y filtros por pedidos transferidos
CREATE INDEX IF NOT EXISTS idx_order_items_transferred_to ON public.order_items (transferred_to_code);
CREATE INDEX IF NOT EXISTS idx_order_items_transferred_from ON public.order_items (transferred_from_code);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_code ON public.orders (parent_order_code);

-- 4. Comentarios explicativos en PostgreSQL
COMMENT ON COLUMN public.order_items.transferred_to_code IS 'Código de la orden derivada a la que fue transferido este producto (ej: ALY-0005)';
COMMENT ON COLUMN public.order_items.transferred_from_code IS 'Código de la orden de origen desde donde proviene este producto (ej: ALY-0004)';
COMMENT ON COLUMN public.orders.parent_order_code IS 'Código de la orden original si este pedido fue generado por un despacho parcial (ej: ALY-0004)';
