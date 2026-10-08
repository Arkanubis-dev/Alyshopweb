"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/types";
import {
  getFallbackCustomers,
  getFallbackCustomerByIdNumber,
  saveFallbackCustomer,
  updateFallbackCustomer,
  deleteFallbackCustomer,
  registerOrUpdateFallbackCustomerFromOrder,
  normalizeIdNumber,
} from "@/lib/customers-cache";
import { getAllFallbackOrders } from "@/lib/orders-cache";

/**
 * Fetch all registered customers for the Admin panel.
 * Automatically synchronizes with all existing orders ("Pedido creado = Cliente creado").
 */
export async function getAllAdminCustomersAction(): Promise<Customer[]> {
  try {
    const supabase = createAdminClient();
    const customersMap = new Map<string, Customer>();

    // 1. Cargar desde Supabase si la tabla customers existe
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          for (const d of data) {
            const c: Customer = {
              id: d.id,
              id_number: d.id_number,
              name: d.name,
              email: d.email,
              phone: d.phone,
              city: d.city,
              neighborhood: d.neighborhood || undefined,
              address: d.address || undefined,
              orders_count: Number(d.orders_count) || 1,
              total_spent: Number(d.total_spent) || 0,
              first_order_date: d.first_order_date || d.created_at,
              last_order_date: d.last_order_date || d.created_at,
              notes: d.notes || undefined,
              created_at: d.created_at,
              updated_at: d.updated_at,
            };
            customersMap.set(c.id, c);
            if (c.id_number) customersMap.set(normalizeIdNumber(c.id_number), c);
          }
        }
      } catch (err) {
        console.warn("Could not query Supabase customers table:", err);
      }
    }

    // 2. Cargar y combinar con almacenamiento persistente local
    const localList = getFallbackCustomers();
    for (const c of localList) {
      const norm = normalizeIdNumber(c.id_number);
      if (!customersMap.has(c.id) && !customersMap.has(norm)) {
        customersMap.set(c.id, c);
        if (c.id_number) customersMap.set(norm, c);
      }
    }

    // 3. SINCRONIZACIÓN AUTOMÁTICA CON TODOS LOS PEDIDOS
    // "Pedido creado = Cliente creado automáticamente"
    // Leemos pedidos de Supabase y pedidos locales
    const allOrders: any[] = [];
    if (supabase) {
      try {
        const { data: dbOrders } = await supabase
          .from("orders")
          .select("id, code, customer_name, customer_phone, customer_email, customer_id_number, city, neighborhood, address, total, created_at")
          .order("created_at", { ascending: false });
        if (dbOrders && dbOrders.length > 0) {
          allOrders.push(...dbOrders);
        }
      } catch {
        try {
          const { data: dbOrdersFallback } = await supabase
            .from("orders")
            .select("id, code, customer_name, customer_phone, city, neighborhood, address, total, created_at")
            .order("created_at", { ascending: false });
          if (dbOrdersFallback) allOrders.push(...dbOrdersFallback);
        } catch {}
      }
    }

    // Sumar pedidos locales
    const localOrders = getAllFallbackOrders();
    allOrders.push(...localOrders);

    // Para cada pedido encontrado, asegurar que existe un cliente registrado
    for (const order of allOrders) {
      if (!order.customer_name || !order.customer_phone) continue;

      const rawId = (order.customer_id_number || "").trim();
      const idNumber = rawId || `CC-${order.customer_phone.trim()}`;
      const normId = normalizeIdNumber(idNumber);
      const existing = customersMap.get(normId);

      if (!existing) {
        // Cliente nuevo detectado en los pedidos -> crearlo inmediatamente
        const newCust: Customer = {
          id: `cust-order-${order.id || Date.now()}`,
          id_number: idNumber,
          name: order.customer_name.trim(),
          email: order.customer_email?.trim() || "",
          phone: order.customer_phone.trim(),
          city: order.city?.trim() || "Bogotá",
          neighborhood: order.neighborhood?.trim(),
          address: order.address?.trim(),
          orders_count: 1,
          total_spent: Number(order.total) || 0,
          first_order_date: order.created_at || new Date().toISOString(),
          last_order_date: order.created_at || new Date().toISOString(),
          created_at: order.created_at || new Date().toISOString(),
          updated_at: order.created_at || new Date().toISOString(),
        };

        saveFallbackCustomer(newCust);
        customersMap.set(newCust.id, newCust);
        customersMap.set(normId, newCust);
      }
    }

    // Filtrar clientes únicos
    const uniqueMap = new Map<string, Customer>();
    for (const c of customersMap.values()) {
      uniqueMap.set(c.id, c);
    }

    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.error("Error in getAllAdminCustomersAction:", err);
    return getFallbackCustomers();
  }
}

/**
 * Create a new customer manually from the Admin panel.
 * Enforces unique cédula (id_number).
 */
export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  try {
    const cleanIdNumber = (input.id_number || "").trim();
    const cleanName = (input.name || "").trim();
    const cleanEmail = (input.email || "").trim().toLowerCase();
    const cleanPhone = (input.phone || "").trim();

    if (!cleanIdNumber) {
      return { success: false, error: "El número de cédula o documento es obligatorio" };
    }
    if (!cleanName) {
      return { success: false, error: "El nombre del cliente es obligatorio" };
    }

    const supabase = createAdminClient();

    // 1. Check if customer already exists by cédula
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from("customers")
          .select("id, id_number")
          .eq("id_number", cleanIdNumber)
          .maybeSingle();

        if (existing) {
          return {
            success: false,
            error: `Ya existe un cliente registrado con la cédula ${cleanIdNumber}`,
          };
        }
      } catch {}
    }

    const existingFallback = getFallbackCustomerByIdNumber(cleanIdNumber);
    if (existingFallback) {
      return {
        success: false,
        error: `Ya existe un cliente registrado con la cédula ${cleanIdNumber}`,
      };
    }

    const now = new Date().toISOString();
    const payload = {
      id_number: cleanIdNumber,
      name: cleanName,
      email: cleanEmail || null,
      phone: cleanPhone || "No especificado",
      city: (input.city || "Bogotá").trim(),
      neighborhood: input.neighborhood?.trim() || null,
      address: input.address?.trim() || null,
      orders_count: 0,
      total_spent: 0,
      first_order_date: now,
      last_order_date: now,
      notes: input.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    let createdCustomer: Customer | undefined;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("customers")
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          createdCustomer = {
            id: data.id,
            id_number: data.id_number,
            name: data.name,
            email: data.email,
            phone: data.phone,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address,
            orders_count: data.orders_count,
            total_spent: data.total_spent,
            first_order_date: data.first_order_date,
            last_order_date: data.last_order_date,
            notes: data.notes,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {
        console.warn("Supabase insert customer warning:", err);
      }
    }

    if (!createdCustomer) {
      const fallbackItem: Customer = {
        id: `cust-${Date.now()}`,
        ...payload,
        email: payload.email || "",
        neighborhood: payload.neighborhood || undefined,
        address: payload.address || undefined,
        notes: payload.notes || undefined,
      };
      saveFallbackCustomer(fallbackItem);
      createdCustomer = fallbackItem;
    } else {
      saveFallbackCustomer(createdCustomer);
    }

    try { revalidatePath("/admin/clientes"); } catch {}
    return { success: true, customer: createdCustomer };
  } catch (err: any) {
    console.error("Error in createCustomerAction:", err);
    return { success: false, error: err.message || "Error al registrar cliente" };
  }
}

/**
 * Update an existing customer's contact details.
 */
export async function updateCustomerAction(
  id: string,
  input: UpdateCustomerInput
): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const updatePayload: Record<string, any> = {
      updated_at: now,
    };
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.id_number !== undefined) updatePayload.id_number = input.id_number.trim();
    if (input.email !== undefined) updatePayload.email = input.email?.trim().toLowerCase() || null;
    if (input.phone !== undefined) updatePayload.phone = input.phone.trim();
    if (input.city !== undefined) updatePayload.city = input.city.trim();
    if (input.neighborhood !== undefined) updatePayload.neighborhood = input.neighborhood?.trim() || null;
    if (input.address !== undefined) updatePayload.address = input.address?.trim() || null;
    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;

    let updated: Customer | null = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("customers")
          .update(updatePayload)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          updated = {
            id: data.id,
            id_number: data.id_number,
            name: data.name,
            email: data.email,
            phone: data.phone,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address,
            orders_count: data.orders_count,
            total_spent: data.total_spent,
            first_order_date: data.first_order_date,
            last_order_date: data.last_order_date,
            notes: data.notes,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {
        console.warn("Supabase update customer warning:", err);
      }
    }

    const fallbackRes = updateFallbackCustomer(id, {
      ...input,
      email: input.email || undefined,
      neighborhood: input.neighborhood || undefined,
      address: input.address || undefined,
      notes: input.notes || undefined,
    });

    try { revalidatePath("/admin/clientes"); } catch {}
    return { success: true, customer: updated || fallbackRes || undefined };
  } catch (err: any) {
    console.error("Error in updateCustomerAction:", err);
    return { success: false, error: err.message || "Error al actualizar cliente" };
  }
}

/**
 * Delete a customer from the registry.
 */
export async function deleteCustomerAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      try {
        await supabase.from("customers").delete().eq("id", id);
      } catch {}
    }

    deleteFallbackCustomer(id);
    try { revalidatePath("/admin/clientes"); } catch {}
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteCustomerAction:", err);
    return { success: false, error: err.message || "Error al eliminar cliente" };
  }
}

/**
 * Record customer from checkout or manual order.
 * If customer with id_number (cédula) does NOT exist, saves them as a new customer.
 * If already exists, updates their orders_count and total_spent.
 * Guarantees persistent storage and automatic customer registration for EVERY order!
 */
export async function recordOrderCustomerAction(orderData: {
  id_number?: string;
  name: string;
  email?: string;
  phone: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  total: number;
}): Promise<{ isNew: boolean; customer: Customer }> {
  const cleanPhone = (orderData.phone || "").trim();
  const cleanIdNumber = (orderData.id_number || "").trim() || (cleanPhone ? `CC-${cleanPhone}` : `CLI-${Date.now()}`);
  const cleanName = (orderData.name || "").trim() || "Cliente Alyshop";
  const cleanEmail = (orderData.email || "").trim().toLowerCase();
  const cleanCity = (orderData.city || "Bogotá").trim();
  const total = Number(orderData.total || 0);
  const now = new Date().toISOString();

  // 1. Guardar de forma PERSISTENTE en disco (data/customers.json) SIEMPRE
  const fallbackResult = registerOrUpdateFallbackCustomerFromOrder({
    id_number: cleanIdNumber,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    city: cleanCity,
    neighborhood: orderData.neighborhood,
    address: orderData.address,
    total,
  });

  // 2. Si Supabase está disponible, intentar guardar en la tabla customers
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data: existing, error: selectErr } = await supabase
        .from("customers")
        .select("*")
        .eq("id_number", cleanIdNumber)
        .maybeSingle();

      if (!selectErr && existing) {
        const updatedCount = (Number(existing.orders_count) || 1) + 1;
        const updatedSpent = (Number(existing.total_spent) || 0) + total;

        const { data: updated } = await supabase
          .from("customers")
          .update({
            name: cleanName || existing.name,
            email: cleanEmail || existing.email,
            phone: cleanPhone || existing.phone,
            city: cleanCity || existing.city,
            neighborhood: orderData.neighborhood?.trim() || existing.neighborhood,
            address: orderData.address?.trim() || existing.address,
            orders_count: updatedCount,
            total_spent: updatedSpent,
            last_order_date: now,
            updated_at: now,
          })
          .eq("id", existing.id)
          .select()
          .single();

        try { revalidatePath("/admin/clientes"); } catch {}
        return { isNew: false, customer: updated || fallbackResult.customer };
      } else if (!selectErr && !existing) {
        const { data: inserted, error: insertError } = await supabase
          .from("customers")
          .insert({
            id_number: cleanIdNumber,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            city: cleanCity,
            neighborhood: orderData.neighborhood?.trim() || null,
            address: orderData.address?.trim() || null,
            orders_count: 1,
            total_spent: total,
            first_order_date: now,
            last_order_date: now,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (!insertError && inserted) {
          try { revalidatePath("/admin/clientes"); } catch {}
          return { isNew: true, customer: inserted };
        }
      }
    }
  } catch (err) {
    console.warn("Supabase recordOrderCustomerAction warning:", err);
  }

  try { revalidatePath("/admin/clientes"); } catch {}
  return fallbackResult;
}
