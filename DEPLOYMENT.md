# Guía de Despliegue y Puesta en Producción: alyshop

Este documento describe paso a paso cómo desplegar la plataforma **alyshop** en **Vercel** conectada a su base de datos y almacenamiento en **Supabase**.

---

## 1. Arquitectura de la Aplicación

- **Frontend & Admin**: Next.js 16 (App Router con Turbopack) + TypeScript + Tailwind CSS v4.
- **Base de Datos & Auth**: Supabase PostgreSQL + Row Level Security (RLS) + Supabase Auth.
- **Almacenamiento**: Supabase Storage (Bucket `products` con compresión de imágenes en Canvas a <300 KB).
- **Checkout & Conversión**: Registro de pedidos con código correlativo (`ALY-0001`), generación de token público de seguridad (`public_token`) y enlace directo estructurado a WhatsApp (`+57 321 305 2913`).
- **Comprobante**: Página pública protegida con token para el cliente (`/pedido/ALY-XXXX?token=...`) con soporte para impresión y descarga.

---

## 2. Paso 1: Configurar Supabase

1. Entra a [https://supabase.com](https://supabase.com) e inicia sesión o crea una cuenta.
2. Haz clic en **"New Project"**, asígnale el nombre `alyshop` y elige la región más cercana (ej: `sa-east-1` São Paulo o `us-east-1` N. Virginia).
3. Una vez aprovisionado el proyecto, ve al menú lateral izquierdo y abre el **SQL Editor**.
4. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este repositorio, copia todo su contenido y pégalo en el editor de SQL de Supabase.
5. Haz clic en **"Run"** para crear:
   - Las 9 tablas relacionales (`categories`, `products`, `product_images`, `orders`, `order_items`, `inventory_movements`, `banners`, `settings`, `admins`).
   - La secuencia correlativa de pedidos (`order_code_seq` que genera `ALY-0001`, `ALY-0002`...).
   - La función transaccional atómica `create_order(...)`.
   - El bucket de almacenamiento público `products` en Supabase Storage.
   - Todas las políticas de Row Level Security (RLS).
   - Los datos semilla iniciales (categorías, productos con imágenes y banners promocionales).

### Crear el Usuario Administrador en Supabase Auth:
1. En el panel de Supabase, ve a **Authentication** $\rightarrow$ **Users**.
2. Haz clic en **"Add user"** $\rightarrow$ **"Create user"**.
3. Ingresa:
   - **Email**: `admin@alyshop.co` (o el correo corporativo del dueño de la tienda).
   - **Password**: Una contraseña segura de al menos 8 caracteres.
   - Marca **"Auto Confirm User?"** para que no requiera confirmación por email.

---

## 3. Paso 2: Obtener las Credenciales de Supabase

En el panel de tu proyecto de Supabase, ve a **Project Settings** $\rightarrow$ **API**:
1. **Project URL**: Copia el valor de `URL` (ej: `https://xyzcompany.supabase.co`).
2. **Project API keys**:
   - `anon` `public`: Copia la clave pública anónima.
   - `service_role` `secret`: Copia la clave de servicio con privilegios administrativos (esta clave **NUNCA** se expone en el cliente; solo la usan los Server Actions en Vercel).

---

## 4. Paso 3: Configurar Variables de Entorno

Crea tu archivo `.env.local` para pruebas locales o configúralas en la consola de Vercel para producción:

```env
# URL y Clave Anónima de Supabase (Públicas)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_publica_aqui

# Clave Service Role de Supabase (Privada / Servidor)
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_secreta_aqui

# Dominio público de tu tienda en producción
NEXT_PUBLIC_SITE_URL=https://alyshop.co

# Teléfono receptor de WhatsApp (código de país 57 + 10 dígitos)
NEXT_PUBLIC_WHATSAPP_NUMBER=573213052913
```

> **Nota:** La aplicación cuenta con un modo de respaldo en memoria (*fallback store*). Si estas variables no están configuradas durante el desarrollo, la plataforma continuará funcionando en modo demostración con datos simulados y autenticación demo (`admin@alyshop.co` / `admin123`).

---

## 5. Paso 4: Despliegue en Vercel

### Opción A: Desde la Interfaz Web de Vercel (Recomendado)
1. Sube tu código a un repositorio en **GitHub** o **GitLab**.
2. Entra a [https://vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New..."** $\rightarrow$ **"Project"**.
4. Selecciona el repositorio de `alyshopweb` e impórtalo.
5. En la sección **Environment Variables**, añade las 5 variables descritas en el paso 3.
6. Haz clic en **"Deploy"**.
7. En menos de 2 minutos tu tienda estará en línea con certificado SSL gratuito, CDN global y soporte para Server Actions.

### Opción B: Usando Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
# Para producción:
vercel --prod
```

---

## 6. Paso 5: Asociar Dominio Personalizado

1. En el dashboard de tu proyecto en Vercel, ve a **Settings** $\rightarrow$ **Domains**.
2. Escribe tu dominio adquirido (ej: `alyshop.co` y `www.alyshop.co`).
3. En tu proveedor de DNS (GoDaddy, Namecheap, Cloudflare, etc.), crea los siguientes registros recomendados por Vercel:
   - **Registro A**: `@` apuntando a `76.76.21.21`.
   - **Registro CNAME**: `www` apuntando a `cname.vercel-dns.com`.
4. Una vez validado, actualiza `NEXT_PUBLIC_SITE_URL` en las variables de entorno de Vercel a `https://alyshop.co`.

---

## 7. Paso 6: Verificación de Funcionalidades en Producción

Realiza las siguientes pruebas para verificar el correcto funcionamiento:

1. **Navegación y Catálogo**:
   - Abre la página principal `https://alyshop.co`.
   - Filtra productos por categoría (ej: `/categoria/hogar-y-decoracion`).
   - Usa el buscador `/buscar?q=termo`.
2. **Flujo de Compra**:
   - Agrega 2 productos al carrito.
   - Ve a `/checkout`, completa el formulario con datos reales de prueba y confirma la orden.
   - Verifica que se abra WhatsApp Web o la App de WhatsApp con el mensaje estructurado y el total en COP exacto.
   - Abre el comprobante generado con el token (`/pedido/ALY-XXXX?token=...`) y prueba la función de impresión de recibo.
3. **Panel Administrativo**:
   - Ingresa a `/admin/login` e inicia sesión con tu usuario administrador.
   - Verifica que el nuevo pedido aparezca en `/admin/pedidos`.
   - Cambia el estado del pedido a `confirmado` y comprueba que el stock del producto disminuya automáticamente en `/admin/inventario`.
   - Sube un nuevo producto con imagen en `/admin/productos` y comprueba que se visualice correctamente en la tienda pública.
4. **Indexación y SEO**:
   - Comprueba `https://alyshop.co/robots.txt`.
   - Comprueba `https://alyshop.co/sitemap.xml`.
