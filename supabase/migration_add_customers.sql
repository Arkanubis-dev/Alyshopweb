-- =========================================================================
-- MIGRACIÓN DE TABLA DE CLIENTES Y COLUMNAS DE PEDIDOS PARA ALYSHOP
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- (https://supabase.com/dashboard/project/iapvjjgirgculjdbycvc/sql)
-- =========================================================================

-- 1. AGREGAR COLUMNAS DE CÉDULA Y CORREO A LA TABLA ORDERS (Si no existen)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id_number TEXT;

-- 2. CREAR TABLA CUSTOMERS (Directorio de clientes para campañas y publicidad)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_number TEXT NOT NULL UNIQUE, -- Cédula / Documento de Identidad único
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bogotá',
  neighborhood TEXT,
  address TEXT,
  orders_count INT NOT NULL DEFAULT 1 CHECK (orders_count >= 0),
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  first_order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS y políticas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en customers" ON public.customers;
CREATE POLICY "Permitir todo a usuarios autenticados en customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion anonima en customers para checkout" ON public.customers;
CREATE POLICY "Permitir insercion anonima en customers para checkout"
  ON public.customers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Otorgar permisos
GRANT ALL ON TABLE public.customers TO authenticated;
GRANT ALL ON TABLE public.customers TO service_role;
GRANT SELECT, INSERT ON TABLE public.customers TO anon;

-- 3. ACTUALIZAR O CREAR FUNCIÓN RPC create_order CON ALIMENTACIÓN AUTOMÁTICA DE CLIENTES
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_customer_id_number TEXT,
  p_city TEXT,
  p_neighborhood TEXT,
  p_address TEXT,
  p_delivery_method TEXT,
  p_notes TEXT,
  p_shipping_cost NUMERIC,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_code TEXT;
  v_public_token TEXT;
  v_order_id UUID;
  v_subtotal NUMERIC(12, 2) := 0;
  v_total NUMERIC(12, 2) := 0;
  v_item RECORD;
  v_product RECORD;
BEGIN
  -- Generar código correlativo ALY-0001
  v_order_code := 'ALY-' || LPAD(nextval('public.order_code_seq')::TEXT, 4, '0');
  -- Generar token público seguro
  v_public_token := encode(gen_random_bytes(16), 'hex');

  -- Validar inventario y calcular subtotal
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no existe', v_item.product_id;
    END IF;
    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%": solo quedan % unidades', v_product.name, v_product.stock;
    END IF;
    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  END LOOP;

  v_total := v_subtotal + COALESCE(p_shipping_cost, 0);

  -- 1. Insertar el pedido en orders con email y cédula
  INSERT INTO public.orders (
    code,
    public_token,
    customer_name,
    customer_phone,
    customer_email,
    customer_id_number,
    city,
    neighborhood,
    address,
    delivery_method,
    notes,
    subtotal,
    shipping_cost,
    total,
    status
  ) VALUES (
    v_order_code,
    v_public_token,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_customer_id_number,
    p_city,
    p_neighborhood,
    p_address,
    p_delivery_method,
    p_notes,
    v_subtotal,
    COALESCE(p_shipping_cost, 0),
    v_total,
    'pendiente'
  ) RETURNING id INTO v_order_id;

  -- 2. Insertar items y actualizar stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id;
    
    INSERT INTO public.order_items (
      order_id, product_id, product_name, unit_price, quantity, subtotal, image_url
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_item.quantity,
      v_product.price * v_item.quantity,
      (SELECT url FROM public.product_images WHERE product_id = v_product.id ORDER BY sort_order ASC LIMIT 1)
    );

    UPDATE public.products SET stock = stock - v_item.quantity WHERE id = v_product.id;

    INSERT INTO public.inventory_movements (
      product_id, type, quantity, reason, order_id
    ) VALUES (
      v_product.id, 'salida', v_item.quantity, 'Venta en pedido ' || v_order_code, v_order_id
    );
  END LOOP;

  -- 3. ALIMENTAR AUTOMÁTICAMENTE LA BASE DE DATOS DE CLIENTES
  -- Si el cliente tiene cédula, se registra o actualiza con upsert
  IF p_customer_id_number IS NOT NULL AND TRIM(p_customer_id_number) <> '' THEN
    INSERT INTO public.customers (
      id_number, name, email, phone, city, neighborhood, address,
      orders_count, total_spent, first_order_date, last_order_date
    ) VALUES (
      TRIM(p_customer_id_number),
      TRIM(p_customer_name),
      TRIM(p_customer_email),
      TRIM(p_customer_phone),
      p_city,
      p_neighborhood,
      p_address,
      1,
      v_total,
      NOW(),
      NOW()
    )
    ON CONFLICT (id_number) DO UPDATE SET
      name = EXCLUDED.name,
      email = COALESCE(EXCLUDED.email, public.customers.email),
      phone = EXCLUDED.phone,
      city = EXCLUDED.city,
      neighborhood = COALESCE(EXCLUDED.neighborhood, public.customers.neighborhood),
      address = COALESCE(EXCLUDED.address, public.customers.address),
      orders_count = public.customers.orders_count + 1,
      total_spent = public.customers.total_spent + EXCLUDED.total_spent,
      last_order_date = NOW(),
      updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'code', v_order_code,
    'public_token', v_public_token,
    'subtotal', v_subtotal,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated, service_role;
