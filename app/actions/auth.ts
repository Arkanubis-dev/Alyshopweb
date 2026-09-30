"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginAdminAction(
  formData: FormData
): Promise<LoginResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!email || !password) {
    return { success: false, error: "Por favor ingresa correo y contraseña" };
  }

  try {
    const supabase = await createClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: "Credenciales inválidas: " + error.message };
      }

      if (data?.user) {
        // Asegurar que el usuario tenga registro en profiles con rol 'admin'
        const adminSupabase = createAdminClient();
        if (adminSupabase) {
          const { data: profile } = await adminSupabase
            .from("profiles")
            .select("role, nombre")
            .eq("id", data.user.id)
            .single();

          if (profile && profile.role !== "admin") {
            await supabase.auth.signOut();
            return {
              success: false,
              error: "Acceso denegado: tu cuenta no tiene permisos de administrador.",
            };
          }

          if (!profile) {
            await adminSupabase.from("profiles").insert({
              id: data.user.id,
              nombre: data.user.user_metadata?.full_name || email.split("@")[0] || "Administrador",
              role: "admin",
            });
          }
        }

        // Set demo admin cookie as well for hybrid environments
        const cookieStore = await cookies();
        cookieStore.set("alyshop_admin_session", "true", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return { success: true };
      }
    }

    // Modo local / demostración sin credenciales de Supabase aún vinculadas
    if (
      (email === "admin@alyshop.co" || email === "admin@alyshop.com" || email === "admin") &&
      (password === "admin123" || password === "alyshop2026")
    ) {
      const cookieStore = await cookies();
      cookieStore.set("alyshop_admin_session", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });

      return { success: true };
    }

    return {
      success: false,
      error:
        "Usuario o contraseña incorrectos. En modo local puedes usar: admin@alyshop.co con admin123",
    };
  } catch (err: any) {
    console.error("Login error:", err);
    return { success: false, error: err.message || "Error al iniciar sesión" };
  }
}

export async function logoutAdminAction() {
  try {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    const cookieStore = await cookies();
    cookieStore.delete("alyshop_admin_session");
  } catch (err) {
    console.error("Logout error:", err);
  }

  redirect("/admin/login");
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("alyshop_admin_session")?.value === "true") {
      return true;
    }

    const supabase = await createClient();
    if (!supabase) return false;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    return profile?.role === "admin";
  } catch {
    return false;
  }
}
