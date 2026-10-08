export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // lucide icon name
  color: string; // pastel bg color token or hex
  sort_order: number;
  is_active: boolean;
  item_count?: number;
  subcategories?: string[];
  image_url?: string; // Optional custom PNG logo/icon
}

export interface ProductImage {
  id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  category_name?: string;
  subcategory?: string;
  name: string;
  slug: string;
  description: string;
  detail: string; // e.g. "500 ml", "x5 unidades", "varios colores"
  brand?: string;
  sku?: string;
  price: number;
  compare_price?: number;
  cost?: number;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  images: ProductImage[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
}

export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "ajuste_anterior";

export interface Order {
  id: string;
  code: string; // ALY-0001
  public_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_id_number?: string;
  city: string;
  neighborhood: string;
  address: string;
  notes?: string;
  delivery_method: "envio" | "recoger";
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  internal_notes?: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface UpdateOrderInput {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id_number?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  notes?: string;
  delivery_method?: "envio" | "recoger";
  shipping_cost?: number;
  status?: OrderStatus;
  internal_notes?: string;
  order_items?: {
    id?: string;
    product_id?: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal?: number;
    image_url?: string;
  }[];
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_id_number: string;
  city: string;
  neighborhood: string;
  address: string;
  indications?: string;
  delivery_method: "envio" | "recoger";
  notes?: string;
}

export interface Customer {
  id: string;
  id_number: string; // Cédula o documento de identidad único
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood?: string;
  address?: string;
  orders_count: number;
  total_spent: number;
  first_order_date: string;
  last_order_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateCustomerInput {
  id_number: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  id_number?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  type: "entrada" | "salida" | "ajuste" | "devolucion";
  quantity: number;
  reason: string;
  order_id?: string;
  created_by?: string;
  created_at: string;
}

export interface StoreSettings {
  name: string;
  slogan: string;
  city: string;
  whatsapp_number: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  default_shipping_cost: number;
  low_stock_threshold: number;
  footer_invoice_text: string;
  logo_url?: string;
  color_palette?: string;
  primary_color?: string;
  secondary_color?: string;
  header_bg_color?: string;
  text_color?: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  highlight_text?: string;
  cta_text: string;
  link: string;
  image_url: string;
  bg_gradient: string;
  sort_order: number;
  is_active: boolean;
}

export interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

