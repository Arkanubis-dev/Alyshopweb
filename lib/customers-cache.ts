import { Customer } from "@/types";

// In-memory store for customers fallback / development
const globalForCustomers = global as unknown as {
  fallbackCustomers: Map<string, Customer>;
};

export const fallbackCustomers =
  globalForCustomers.fallbackCustomers || new Map<string, Customer>();

if (process.env.NODE_ENV !== "production") {
  globalForCustomers.fallbackCustomers = fallbackCustomers;
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
