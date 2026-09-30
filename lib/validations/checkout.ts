import { z } from "zod";

export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .min(3, "Por favor ingresa tu nombre y apellido completo")
    .max(100, "El nombre es demasiado largo"),
  customer_phone: z
    .string()
    .regex(
      /^3[0-9]{9}$/,
      "Ingresa un número celular colombiano válido de 10 dígitos (ej. 3001234567)"
    ),
  city: z
    .string()
    .min(2, "Por favor ingresa tu ciudad o municipio")
    .max(50, "El nombre de la ciudad es demasiado largo"),
  neighborhood: z
    .string()
    .min(2, "Por favor ingresa el barrio")
    .max(60, "El nombre del barrio es demasiado largo"),
  address: z
    .string()
    .min(5, "Por favor ingresa tu dirección completa (ej. Calle 10 # 5-20)")
    .max(120, "La dirección es demasiado larga"),
  indications: z
    .string()
    .max(150, "Las indicaciones son demasiado largas")
    .optional()
    .or(z.literal("")),
  delivery_method: z.enum(["envio", "recoger"]),
  notes: z
    .string()
    .max(200, "Las notas son demasiado largas")
    .optional()
    .or(z.literal("")),
});

export type CheckoutSchemaType = z.infer<typeof checkoutSchema>;
