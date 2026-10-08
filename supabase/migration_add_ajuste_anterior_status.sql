-- ============================================================================
-- Migración: Permitir estado 'ajuste_anterior' en la tabla 'orders'
-- Permite registrar pedidos históricos ya facturados sin alterar inventario
-- ============================================================================

-- 1. Modificar restricción CHECK en orders.status para admitir 'ajuste_anterior'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado', 'ajuste_anterior'));

-- 2. Comentario explicativo
COMMENT ON COLUMN public.orders.status IS 'Estado del pedido: pendiente, confirmado, enviado, entregado, cancelado o ajuste_anterior (histórico sin movimiento de existencias)';
