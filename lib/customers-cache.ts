import { Customer } from "@/types";

// In-memory store for customers fallback / development
const globalForCustomers = global as unknown as {
  fallbackCustomers: Map<string, Customer>;
  hasSeededCustomers: boolean;
};

export const fallbackCustomers =
  globalForCustomers.fallbackCustomers || new Map<string, Customer>();

if (process.env.NODE_ENV !== "production") {
  globalForCustomers.fallbackCustomers = fallbackCustomers;
}

// Initial realistic seed customers for Alyshop
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    id_number: "1020789456",
    name: "Carolina Gómez",
    email: "carolina.gomez@gmail.com",
    phone: "3105551234",
    city: "Bogotá",
    neighborhood: "Usaquén",
    address: "Calle 140 # 11-45 Apto 502",
    orders_count: 2,
    total_spent: 178000,
    first_order_date: "2026-09-15T14:20:00.000Z",
    last_order_date: "2026-10-02T10:15:00.000Z",
    notes: "Cliente recurrente. Interesada en novedades de hogar y cocina.",
    created_at: "2026-09-15T14:20:00.000Z",
  },
  {
    id: "cust-2",
    id_number: "1032456789",
    name: "Andrés Felipe Ramos",
    email: "andres.ramos@hotmail.com",
    phone: "3204445678",
    city: "Medellín",
    neighborhood: "El Poblado",
    address: "Carrera 43A # 1-50",
    orders_count: 1,
    total_spent: 89900,
    first_order_date: "2026-09-28T16:40:00.000Z",
    last_order_date: "2026-09-28T16:40:00.000Z",
    notes: "Prefiere envíos rápidos. Compró accesorios de tecnología.",
    created_at: "2026-09-28T16:40:00.000Z",
  },
  {
    id: "cust-3",
    id_number: "1014238910",
    name: "Valentina Morales",
    email: "vale.morales@outlook.com",
    phone: "3158889900",
    city: "Cali",
    neighborhood: "Granada",
    address: "Avenida 9N # 14-22",
    orders_count: 3,
    total_spent: 245000,
    first_order_date: "2026-08-20T11:00:00.000Z",
    last_order_date: "2026-10-05T18:30:00.000Z",
    notes: "Cliente VIP. Excelente respuesta a promociones de belleza.",
    created_at: "2026-08-20T11:00:00.000Z",
  },
  {
    id: "cust-4",
    id_number: "52987123",
    name: "Sofía Rodríguez",
    email: "sofia.rodriguez@gmail.com",
    phone: "3001234567",
    city: "Bogotá",
    neighborhood: "Chapinero",
    address: "Carrera 7 # 60-15 Casa 4",
    orders_count: 1,
    total_spent: 54900,
    first_order_date: "2026-10-04T09:12:00.000Z",
    last_order_date: "2026-10-04T09:12:00.000Z",
    notes: "Nueva clienta. Llegó por recomendación.",
    created_at: "2026-10-04T09:12:00.000Z",
  },
  {
    id: "cust-5",
    id_number: "1000543219",
    name: "Mateo Herrera",
    email: "mateo.h@yahoo.com",
    phone: "3189991122",
    city: "Bucaramanga",
    neighborhood: "Cabecera del Llano",
    address: "Calle 48 # 33-10 Apto 901",
    orders_count: 1,
    total_spent: 120000,
    first_order_date: "2026-10-06T15:45:00.000Z",
    last_order_date: "2026-10-06T15:45:00.000Z",
    notes: "Interesado en productos de mascotas y deportes.",
    created_at: "2026-10-06T15:45:00.000Z",
  },
];

// Initialize seed data once
if (!globalForCustomers.hasSeededCustomers && fallbackCustomers.size === 0) {
  for (const c of INITIAL_CUSTOMERS) {
    fallbackCustomers.set(c.id, c);
    fallbackCustomers.set(normalizeIdNumber(c.id_number), c);
  }
  globalForCustomers.hasSeededCustomers = true;
}

export function normalizeIdNumber(idNumber: string): string {
  return (idNumber || "").trim().toLowerCase().replace(/[^0-9a-z]/g, "");
}

export function getFallbackCustomers(): Customer[] {
  // Collect unique customers by their id
  const uniqueMap = new Map<string, Customer>();
  for (const customer of fallbackCustomers.values()) {
    uniqueMap.set(customer.id, customer);
  }
  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getFallbackCustomerById(id: string): Customer | null {
  return fallbackCustomers.get(id) || null;
}

export function getFallbackCustomerByIdNumber(idNumber: string): Customer | null {
  const normalized = normalizeIdNumber(idNumber);
  return fallbackCustomers.get(normalized) || null;
}

export function saveFallbackCustomer(customer: Customer): Customer {
  const normalized = normalizeIdNumber(customer.id_number);
  fallbackCustomers.set(customer.id, customer);
  fallbackCustomers.set(normalized, customer);
  return customer;
}

export function updateFallbackCustomer(
  id: string,
  input: Partial<Customer>
): Customer | null {
  const current = getFallbackCustomerById(id);
  if (!current) return null;

  const updated: Customer = {
    ...current,
    ...input,
    updated_at: new Date().toISOString(),
  };

  const oldNormalized = normalizeIdNumber(current.id_number);
  if (input.id_number && input.id_number !== current.id_number) {
    fallbackCustomers.delete(oldNormalized);
  }

  saveFallbackCustomer(updated);
  return updated;
}

export function deleteFallbackCustomer(id: string): boolean {
  const customer = getFallbackCustomerById(id);
  if (!customer) return false;

  fallbackCustomers.delete(customer.id);
  fallbackCustomers.delete(normalizeIdNumber(customer.id_number));
  return true;
}

/**
 * Register or update customer when placing an order.
 * If customer with id_number (cédula) already exists, update their order history.
 * If not, create them as a NEW customer!
 */
export function registerOrUpdateFallbackCustomerFromOrder(orderData: {
  id_number: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood?: string;
  address?: string;
  total: number;
}): { isNew: boolean; customer: Customer } {
  const existing = getFallbackCustomerByIdNumber(orderData.id_number);
  const now = new Date().toISOString();

  if (existing) {
    // Existing customer - update statistics & contact info if changed
    const updated: Customer = {
      ...existing,
      name: orderData.name || existing.name,
      email: orderData.email || existing.email,
      phone: orderData.phone || existing.phone,
      city: orderData.city || existing.city,
      neighborhood: orderData.neighborhood || existing.neighborhood,
      address: orderData.address || existing.address,
      orders_count: (existing.orders_count || 1) + 1,
      total_spent: (Number(existing.total_spent) || 0) + Number(orderData.total || 0),
      last_order_date: now,
      updated_at: now,
    };
    saveFallbackCustomer(updated);
    return { isNew: false, customer: updated };
  }

  // Brand new customer!
  const newCustomer: Customer = {
    id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    id_number: orderData.id_number.trim(),
    name: orderData.name.trim(),
    email: (orderData.email || "").trim(),
    phone: (orderData.phone || "").trim(),
    city: (orderData.city || "Bogotá").trim(),
    neighborhood: orderData.neighborhood?.trim(),
    address: orderData.address?.trim(),
    orders_count: 1,
    total_spent: Number(orderData.total || 0),
    first_order_date: now,
    last_order_date: now,
    created_at: now,
    updated_at: now,
  };

  saveFallbackCustomer(newCustomer);
  return { isNew: true, customer: newCustomer };
}
