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
  customer_email: z
    .string()
    .min(1, "Por favor ingresa tu correo electrónico")
    .email("Ingresa un correo electrónico válido (ej. usuario@gmail.com)")
    .max(100, "El correo electrónico es demasiado largo"),
  customer_id_number: z
    .string()
    .min(5, "Por favor ingresa un número de cédula o documento válido")
    .max(20, "El número de documento no puede exceder 20 caracteres")
    .regex(/^[0-9a-zA-Z\s.-]+$/, "Ingresa un número de identificación válido"),
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
