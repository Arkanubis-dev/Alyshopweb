-- ==============================================================================
-- ALYSHOP - ESQUEMA DE BASE DE DATOS SUPABASE
-- Tienda online con catálogo, pedidos por WhatsApp, inventario y panel admin.
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNCIÓN DE ACTUALIZACIÓN AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLAS PRINCIPALES
-- ==============================================================================

-- 3.1 PROFILES (Administradores y personal de la tienda)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función para verificar si el usuario actual es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.2 CATEGORIES (Categorías de productos)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'Grid',
  color TEXT NOT NULL DEFAULT '#FCE4EF',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.3 PRODUCTS (Catálogo de productos)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '', -- Ej: "500 ml", "x5 unidades", "Varios colores"
  brand TEXT,
  sku TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_price NUMERIC(12, 2) CHECK (compare_price >= 0),
  cost NUMERIC(12, 2) CHECK (cost >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.0 CHECK (rating_avg >= 0 AND rating_avg <= 5.0),
  rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.4 PRODUCT_IMAGES (Galería de imágenes por producto)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 SECUENCIA Y TABLA ORDERS (Pedidos)
CREATE SEQUENCE IF NOT EXISTS public.order_code_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- Formato ALY-0001
  public_token TEXT NOT NULL UNIQUE, -- Token aleatorio seguro para consultar factura sin predecir
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'envio' CHECK (delivery_method IN ('envio', 'recoger')),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.6 ORDER_ITEMS (Líneas de pedido con snapshot de precio y nombre)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 INVENTORY_MOVEMENTS (Kárdex y auditoría de inventario)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste', 'devolucion')),
  quantity INT NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 BANNERS (Slides del carrusel del hero)
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  cta_text TEXT NOT NULL DEFAULT '¡Descubre más!',
  link TEXT NOT NULL DEFAULT '/#productos',
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.9 SETTINGS (Ajustes configurables de la tienda)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(code);
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);

-- ==============================================================================
-- 5. FUNCIÓN TRANSACCIONAL RPC: create_order
-- Valida stock, genera código ALY-0001, token público y crea pedido + items
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_city TEXT,
  p_neighborhood TEXT,
  p_address TEXT,
  p_delivery_method TEXT,
  p_notes TEXT,
  p_shipping_cost NUMERIC,
  p_items JSONB -- Array de objetos: [{ "product_id": uuid, "quantity": int }]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_code TEXT;
  v_public_token TEXT;
  v_subtotal NUMERIC(12, 2) := 0;
  v_total NUMERIC(12, 2) := 0;
  v_item RECORD;
  v_product RECORD;
  v_item_subtotal NUMERIC(12, 2);
  v_item_count INT;
BEGIN
  -- 1. Validar que vengan productos
  v_item_count := jsonb_array_length(p_items);
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'El pedido no contiene productos';
  END IF;

  -- 2. Validar disponibilidad y stock para cada producto
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para producto';
    END IF;

    SELECT id, name, price, stock, is_active,
           (SELECT url FROM public.product_images WHERE product_id = p.id AND is_primary LIMIT 1) AS primary_img
    INTO v_product
    FROM public.products p
    WHERE id = v_item.product_id
    FOR UPDATE; -- Bloqueo de fila para evitar condiciones de carrera

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto con ID % no existe', v_item.product_id;
    END IF;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'El producto "%" no está disponible en este momento', v_product.name;
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, solicitado: %',
        v_product.name, v_product.stock, v_item.quantity;
    END IF;

    v_item_subtotal := v_product.price * v_item.quantity;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;

  -- 3. Calcular total
  v_total := v_subtotal + COALESCE(p_shipping_cost, 0);

  -- 4. Generar código consecutivo ALY-0001 y token aleatorio
  v_order_code := 'ALY-' || LPAD(nextval('public.order_code_seq')::TEXT, 4, '0');
  v_public_token := encode(gen_random_bytes(24), 'hex');

  -- 5. Insertar encabezado de orden
  INSERT INTO public.orders (
    code,
    public_token,
    customer_name,
    customer_phone,
    city,
    neighborhood,
    address,
    notes,
    delivery_method,
    subtotal,
    shipping_cost,
    total,
    status
  ) VALUES (
    v_order_code,
    v_public_token,
    p_customer_name,
    p_customer_phone,
    p_city,
    p_neighborhood,
    p_address,
    p_notes,
    p_delivery_method,
    v_subtotal,
    COALESCE(p_shipping_cost, 0),
    v_total,
    'pendiente'
  ) RETURNING id INTO v_order_id;

  -- 6. Insertar items del pedido con snapshot de nombre y precio
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    SELECT id, name, price,
           (SELECT url FROM public.product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS primary_img
    INTO v_product
    FROM public.products p
    WHERE id = v_item.product_id;

    v_item_subtotal := v_product.price * v_item.quantity;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      subtotal,
      image_url
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_item.quantity,
      v_item_subtotal,
      v_product.primary_img
    );
  END LOOP;

  -- 7. Retornar información del pedido creado
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'code', v_order_code,
    'public_token', v_public_token,
    'subtotal', v_subtotal,
    'shipping_cost', COALESCE(p_shipping_cost, 0),
    'total', v_total
  );
END;
$$;

-- Otorgar permiso de ejecución al rol anónimo para el checkout
GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Activado en TODAS las tablas
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 6.1 POLÍTICAS PARA PROFILES
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins tienen acceso total a profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- 6.2 POLÍTICAS PARA CATEGORIES
CREATE POLICY "Público puede ver categorías activas"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins tienen acceso total a categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- 6.3 POLÍTICAS PARA PRODUCTS
CREATE POLICY "Público puede ver productos activos"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins tienen acceso total a products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- 6.4 POLÍTICAS PARA PRODUCT_IMAGES
CREATE POLICY "Público puede ver imágenes de productos"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins tienen acceso total a product_images"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- 6.5 POLÍTICAS PARA BANNERS
CREATE POLICY "Público puede ver banners activos"
  ON public.banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins tienen acceso total a banners"
  ON public.banners FOR ALL
  USING (public.is_admin());

-- 6.6 POLÍTICAS PARA SETTINGS
CREATE POLICY "Público puede leer ajustes generales"
  ON public.settings FOR SELECT
  USING (key IN ('store_info', 'shipping', 'whatsapp'));

CREATE POLICY "Admins tienen acceso total a settings"
  ON public.settings FOR ALL
  USING (public.is_admin());

-- 6.7 POLÍTICAS PARA ORDERS Y ORDER_ITEMS
-- El público NO puede insertar directamente en orders (solo a través de RPC create_order)
-- Puede leer una orden únicamente si conoce su public_token
CREATE POLICY "Público puede consultar pedido por token público"
  ON public.orders FOR SELECT
  USING (true); -- La API de Next.js filtrará siempre por public_token o ID seguro

CREATE POLICY "Público puede ver items de orden"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "Admins tienen acceso total a orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins tienen acceso total a order_items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- 6.8 POLÍTICAS PARA INVENTORY_MOVEMENTS
CREATE POLICY "Solo admins pueden ver y crear movimientos de inventario"
  ON public.inventory_movements FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 7. CONFIGURACIÓN DEL BUCKET DE STORAGE 'products'
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas del bucket de almacenamiento
CREATE POLICY "Imágenes de productos públicas para lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Admins pueden subir imágenes a products"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND public.is_admin());

CREATE POLICY "Admins pueden actualizar imágenes en products"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products' AND public.is_admin());

CREATE POLICY "Admins pueden eliminar imágenes en products"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'products' AND public.is_admin());

-- ==============================================================================
-- 8. SEED DATA (10 Categorías, 8 Productos, Banners y Ajustes)
-- ==============================================================================

-- 8.1 Categorías
INSERT INTO public.categories (id, name, slug, icon, color, sort_order, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Hogar y decoración', 'hogar-y-decoracion', 'Home', '#FCE4EF', 1, true),
  ('c0000000-0000-0000-0000-000000000002', 'Cocina y comedor', 'cocina-y-comedor', 'UtensilsCrossed', '#EEEAFB', 2, true),
  ('c0000000-0000-0000-0000-000000000003', 'Ropa y accesorios', 'ropa-y-accesorios', 'Shirt', '#DDF3EC', 3, true),
  ('c0000000-0000-0000-0000-000000000004', 'Belleza y cuidado personal', 'belleza-y-cuidado-personal', 'Sparkles', '#FDE8DD', 4, true),
  ('c0000000-0000-0000-0000-000000000005', 'Tecnología y accesorios', 'tecnologia-y-accesorios', 'Headphones', '#E0EEFB', 5, true),
  ('c0000000-0000-0000-0000-000000000006', 'Juguetes y juegos', 'juguetes-y-juegos', 'Gamepad2', '#FFF1CC', 6, true),
  ('c0000000-0000-0000-0000-000000000007', 'Papelería y oficina', 'papeleria-y-oficina', 'BookOpen', '#FCE4EF', 7, true),
  ('c0000000-0000-0000-0000-000000000008', 'Deportes y aire libre', 'deportes-y-aire-libre', 'Dumbbell', '#EEEAFB', 8, true),
  ('c0000000-0000-0000-0000-000000000009', 'Mascotas', 'mascotas', 'PawPrint', '#DDF3EC', 9, true),
  ('c0000000-0000-0000-0000-000000000010', 'Más variedades', 'mas-variedades', 'Grid', '#FFF1CC', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- 8.2 Productos
INSERT INTO public.products (
  id, category_id, name, slug, description, detail, brand, sku, price, compare_price, cost, stock, low_stock_threshold, is_active, is_featured, rating_avg, rating_count
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Termo de acero inoxidable 500 ml',
    'termo-de-acero-inoxidable-500-ml',
    'Termo con aislamiento al vacío de doble pared. Mantiene bebidas calientes por 12 horas y frías por 24 horas. Tapa hermética antiderrame.',
    '500 ml',
    'AlyHome',
    'COC-TRM-01',
    34900,
    42000,
    21000,
    8,
    3,
    true,
    true,
    4.9,
    38
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'Set de recipientes herméticos x5',
    'set-de-recipientes-hermeticos-x5',
    'Juego de 5 recipientes libres de BPA con cierre hermético de silicona. Aptos para microondas, lavavajillas y congelador.',
    'x5 recipientes',
    'AlyHome',
    'COC-REC-05',
    57800,
    68000,
    36000,
    2, -- Pocas unidades
    3,
    true,
    true,
    4.8,
    52
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'Morral escolar impermeable',
    'morral-escolar-impermeable',
    'Morral ergonómico con compartimento acolchado para laptop de hasta 15.6 pulgadas, bolsillos laterales para termo y tela resistente al agua.',
    'Varios colores',
    'AlyStyle',
    'ROP-MOR-03',
    64900,
    79900,
    41000,
    12,
    3,
    true,
    true,
    4.9,
    24
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000006',
    'Peluche conejito suave 35 cm',
    'peluche-conejito-suave-35-cm',
    'Peluche ultra suave de felpa hipoalergénica, costuras reforzadas y relleno de algodón siliconado. Ideal para regalo.',
    '35 cm',
    'AlyKids',
    'JUG-PEL-04',
    28500,
    35000,
    16000,
    5,
    3,
    true,
    true,
    5.0,
    19
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000004',
    'Set de cuidado facial con sérum',
    'set-de-cuidado-facial-con-serum',
    'Kit completo de rutina facial con sérum de ácido hialurónico, crema hidratante ligera y rodillo de masaje facial.',
    'Kit x3 piezas',
    'AlyGlow',
    'BEL-FAC-05',
    42900,
    54000,
    26000,
    3, -- Pocas unidades
    3,
    true,
    true,
    4.9,
    45
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000005',
    'Audífonos inalámbricos Bluetooth',
    'audifonos-inalambricos-bluetooth',
    'Conexión Bluetooth 5.3 de baja latencia, estuche de carga rápida con pantalla LED de batería, sonido estéreo nítido y control táctil.',
    'Touch + estuche',
    'AlyTech',
    'TEC-AUD-06',
    49900,
    65000,
    30000,
    15,
    4,
    true,
    true,
    4.7,
    63
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000007',
    'Cuaderno anillado tapa dura x100 hojas',
    'cuaderno-anillado-tapa-dura-x100-hojas',
    'Cuaderno de pasta dura con acabado mate soft touch, argollado metálico doble O, papel bond de 90g que no traspasa la tinta.',
    '100 hojas cuadros',
    'AlyNotes',
    'PAP-CUA-07',
    18900,
    24000,
    10500,
    20,
    4,
    true,
    true,
    4.8,
    31
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000009',
    'Plato comedero para mascota antiderrame',
    'plato-comedero-para-mascota-antiderrame',
    'Comedero de acero inoxidable desmontable con base de silicona antideslizante que atrapa salpicaduras. Higiénico y fácil de lavar.',
    'Acero y silicona',
    'AlyPet',
    'MAS-PLA-08',
    22900,
    29900,
    12500,
    0, -- Agotado
    3,
    true,
    true,
    4.9,
    28
  )
ON CONFLICT (slug) DO NOTHING;

-- 8.3 Imágenes de los productos
INSERT INTO public.product_images (id, product_id, url, sort_order, is_primary) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1608248597359-561354316a3a?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 1, true),
  ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 8.4 Banners Hero
INSERT INTO public.banners (id, title, subtitle, cta_text, link, image_url, sort_order, is_active) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Variedad que',
    'Productos únicos, útiles y a los mejores precios para ti y tu hogar.',
    '¡Descubre más!',
    '/#productos-destacados',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    1,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Detalles que',
    'Artículos seleccionados con amor para consentir a toda tu familia.',
    'Ver colecciones',
    '/#productos-destacados',
    'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&w=800&q=80',
    2,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Envíos rápidos a',
    'Pide fácil por WhatsApp y recibe tus compras directo en tu puerta.',
    'Comprar ahora',
    '/#productos-destacados',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    3,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 8.5 Ajustes de la tienda
INSERT INTO public.settings (key, value) VALUES
  ('store_info', '{
    "name": "alyshop",
    "slogan": "Todo lo que necesitas, en un solo lugar",
    "city": "Bogotá",
    "country": "Colombia",
    "phone": "+57 321 305 2913",
    "email": "contacto@alyshop.co",
    "footer_note": "Gracias por tu compra en alyshop. Resumen de pedido para gestión interna."
  }'::jsonb),
  ('whatsapp', '{
    "number": "573213052913",
    "default_greeting": "Hola alyshop, quisiera hacer el siguiente pedido:"
  }'::jsonb),
  ('shipping', '{
    "default_cost": 0,
    "free_shipping_threshold": 120000,
    "description": "Envíos a todo el país con pago contraentrega o transferencia previa."
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
