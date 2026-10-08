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

/**
 * Fetch all registered customers for the Admin panel.
 */
export async function getAllAdminCustomersAction(): Promise<Customer[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
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
        }));
      }
    }

    return getFallbackCustomers();
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
    } else {
      const existing = getFallbackCustomerByIdNumber(cleanIdNumber);
      if (existing) {
        return {
          success: false,
          error: `Ya existe un cliente registrado con la cédula ${cleanIdNumber}`,
        };
      }
    }

    const now = new Date().toISOString();
    let finalId = `cust-${Date.now()}`;

    // 2. Insert into Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          id_number: cleanIdNumber,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          city: (input.city || "Bogotá").trim(),
          neighborhood: input.neighborhood?.trim() || null,
          address: input.address?.trim() || null,
          orders_count: 0,
          total_spent: 0,
          first_order_date: now,
          last_order_date: now,
          notes: input.notes?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return {
            success: false,
            error: `Ya existe un cliente con la cédula ${cleanIdNumber}`,
          };
        }
        throw error;
      }

      if (data) finalId = data.id;
    }

    // 3. Insert into fallback cache
    const newCustomer: Customer = {
      id: finalId,
      id_number: cleanIdNumber,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      city: (input.city || "Bogotá").trim(),
      neighborhood: input.neighborhood?.trim(),
      address: input.address?.trim(),
      orders_count: 0,
      total_spent: 0,
      first_order_date: now,
      last_order_date: now,
      notes: input.notes?.trim(),
      created_at: now,
      updated_at: now,
    };

    saveFallbackCustomer(newCustomer);

    revalidatePath("/admin/clientes");
    return { success: true, customer: newCustomer };
  } catch (err: any) {
    console.error("Error in createCustomerAction:", err);
    return { success: false, error: err.message || "Error al crear cliente" };
  }
}

/**
 * Update customer details.
 */
export async function updateCustomerAction(
  id: string,
  input: UpdateCustomerInput
): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    if (supabase) {
      const updateData: Record<string, any> = {
        updated_at: now,
      };
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.email !== undefined) updateData.email = input.email.trim().toLowerCase();
      if (input.phone !== undefined) updateData.phone = input.phone.trim();
      if (input.city !== undefined) updateData.city = input.city.trim();
      if (input.neighborhood !== undefined) updateData.neighborhood = input.neighborhood?.trim() || null;
      if (input.address !== undefined) updateData.address = input.address?.trim() || null;
      if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;

      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
    }

    const updated = updateFallbackCustomer(id, input);
    revalidatePath("/admin/clientes");
    return { success: true, customer: updated || undefined };
  } catch (err: any) {
    console.error("Error in updateCustomerAction:", err);
    return { success: false, error: err.message || "Error al actualizar cliente" };
  }
}

/**
 * Delete a customer record from Admin.
 */
export async function deleteCustomerAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    }

    deleteFallbackCustomer(id);
    revalidatePath("/admin/clientes");
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
 */
export async function recordOrderCustomerAction(orderData: {
  id_number: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood?: string;
  address?: string;
  total: number;
}): Promise<{ isNew: boolean; customer: Customer }> {
  const cleanIdNumber = (orderData.id_number || "").trim();
  const cleanName = (orderData.name || "").trim();
  const cleanEmail = (orderData.email || "").trim().toLowerCase();
  const cleanPhone = (orderData.phone || "").trim();
  const cleanCity = (orderData.city || "Bogotá").trim();
  const total = Number(orderData.total || 0);
  const now = new Date().toISOString();

  // If no cédula provided, skip recording to prevent empty keys
  if (!cleanIdNumber) {
    return { isNew: false, customer: undefined as any };
  }

  try {
    const supabase = createAdminClient();
    if (supabase) {
      // Check if customer exists by id_number
      const { data: existing } = await supabase
        .from("customers")
        .select("*")
        .eq("id_number", cleanIdNumber)
        .maybeSingle();

      if (existing) {
        // Customer exists: update stats
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

        // Also update local cache
        const res = registerOrUpdateFallbackCustomerFromOrder({
          id_number: cleanIdNumber,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          city: cleanCity,
          neighborhood: orderData.neighborhood,
          address: orderData.address,
          total,
        });

        revalidatePath("/admin/clientes");
        return { isNew: false, customer: updated || res.customer };
      } else {
        // Brand new customer!
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

        const res = registerOrUpdateFallbackCustomerFromOrder({
          id_number: cleanIdNumber,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          city: cleanCity,
          neighborhood: orderData.neighborhood,
          address: orderData.address,
          total,
        });

        revalidatePath("/admin/clientes");
        return { isNew: true, customer: inserted || res.customer };
      }
    }
  } catch (err) {
    console.error("Error in recordOrderCustomerAction with Supabase:", err);
  }

  // Fallback memory cache
  const result = registerOrUpdateFallbackCustomerFromOrder({
    id_number: cleanIdNumber,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    city: cleanCity,
    neighborhood: orderData.neighborhood,
    address: orderData.address,
    total,
  });

  revalidatePath("/admin/clientes");
  return result;
}
