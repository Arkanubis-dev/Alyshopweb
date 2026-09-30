# 🛍️ alyshop - Tienda Online & Panel de Gestión

Tienda online para **alyshop** (Colombia), diseñada para variedad de artículos (hogar, cocina, ropa, belleza, tecnología, juguetes, papelería, deportes y mascotas). 

Todo el catálogo y checkout está optimizado para pedidos rápidos vía WhatsApp con formato de factura, sincronización en **Supabase** y administración completa en `/admin`.

---

## 🚀 Stack Tecnológico

- **Framework**: [Next.js 14+ / 16 (App Router)](https://nextjs.org/) con TypeScript y Turbopack
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth y Storage)
- **Estado Global**: [Zustand](https://github.com/pmndrs/zustand) con persistencia en `localStorage`
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Tipografías**: Pacifico (script) y Nunito (sans-serif) vía `next/font`
- **Moneda**: Pesos Colombianos (COP) formato `$ 34.900`

---

## 🗄️ Configuración de Supabase (Paso a Paso)

### 1. Crear el Proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com/) e inicia sesión.
2. Crea una nueva organización / proyecto con el nombre **alyshop**.
3. Selecciona una región cercana (por ejemplo, `sa-east-1` São Paulo o `us-east-1`).
4. Guarda de forma segura la contraseña de la base de datos.

### 2. Ejecutar el Esquema de Base de Datos (`schema.sql`)
1. En el panel de tu proyecto en Supabase, dirígete al menú lateral **SQL Editor**.
2. Haz clic en **New Query**.
3. Copia todo el contenido del archivo [`supabase/schema.sql`](./supabase/schema.sql) y pégalo en el editor.
4. Haz clic en **Run** (Ejecutar).
5. Este script creará automáticamente:
   - Tablas: `profiles`, `categories`, `products`, `product_images`, `orders`, `order_items`, `inventory_movements`, `banners`, `settings`.
   - Secuencia para códigos de pedido consecutivos (`ALY-0001`, `ALY-0002`...).
   - Función transaccional `create_order` con validación de stock y generación de token seguro.
   - Políticas de seguridad **Row Level Security (RLS)** para todas las tablas.
   - Bucket de almacenamiento `products` para imágenes.
   - Datos iniciales (**Seed**): 10 categorías, 8 productos destacados, 3 banners hero y ajustes predeterminados.

### 3. Crear el Primer Usuario Administrador
1. En Supabase, ve a **Authentication** -> **Users**.
2. Haz clic en **Add User** -> **Create User**.
3. Ingresa tu correo (ejemplo: `admin@alyshop.co`) y una contraseña segura.
4. Copia el **User UID** generado.
5. Vuelve al **SQL Editor** y ejecuta la siguiente consulta para asignarle rol de administrador:

```sql
INSERT INTO public.profiles (id, nombre, role)
VALUES ('PEGA_AQUI_EL_UID_COPIADO', 'Administrador alyshop', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## ⚙️ Variables de Entorno

Copia el archivo `.env.example` como `.env.local`:

```bash
cp .env.example .env.local
```

Configura tus credenciales obtenidas en Supabase (**Project Settings** -> **API**):

```env
# URL y Clave Anónima (Públicas)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave Service Role (Privada - Solo para operaciones de servidor)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Número de WhatsApp de la tienda (Colombia: 57 + número)
NEXT_PUBLIC_WHATSAPP_NUMBER=573213052913

# URL pública de la tienda
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 💻 Desarrollo Local

Para ejecutar el proyecto en tu máquina local:

```bash
# Instalar dependencias si no lo has hecho
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor en producción
npm run start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la tienda.

---

## 📦 Despliegue en Vercel

1. Sube tu código al repositorio en GitHub:
   ```bash
   git add .
   git commit -m "feat: alyshop store setup"
   git push origin main
   ```
2. Conecta el repositorio en [Vercel](https://vercel.com/).
3. Agrega las mismas variables de entorno de tu `.env.local` en **Project Settings** -> **Environment Variables**.
4. Despliega con un clic.
