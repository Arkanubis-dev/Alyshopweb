import { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  Truck,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes y Envíos | alyshop Colombia",
  description:
    "Conoce cómo comprar en alyshop, métodos de pago, costos de envío a toda Colombia, tiempos de entrega y garantías de tus productos.",
};

const FAQS = [
  {
    category: "Proceso de Compra",
    icon: HelpCircle,
    questions: [
      {
        q: "¿Cómo realizo mi pedido en alyshop?",
        a: "Es muy fácil: navega por la tienda, añade los artículos que deseas al carrito, ve a 'Finalizar Compra', llena tus datos de despacho (nombre, dirección y teléfono) y haz clic en 'Confirmar y Enviar por WhatsApp'. El sistema abrirá automáticamente tu WhatsApp con el mensaje estructurado de tu pedido para que una asesora confirme tu compra de inmediato.",
      },
      {
        q: "¿Tengo que registrarme o crear una cuenta para comprar?",
        a: "No. En alyshop no necesitas recordar contraseñas ni registrarte antes. Solo ingresas los datos necesarios para el envío y te atendemos de forma directa y personalizada por WhatsApp.",
      },
      {
        q: "¿Qué pasa si cierro la página antes de enviar el WhatsApp?",
        a: "¡No te preocupes! Al confirmar tu pedido se genera un código único (ej: ALY-0001) y un enlace de recibo. Puedes volver a abrir el enlace de tu pedido en cualquier momento desde tu teléfono y enviar el mensaje cuando gustes.",
      },
    ],
  },
  {
    category: "Envíos y Entregas",
    icon: Truck,
    questions: [
      {
        q: "¿A qué ciudades de Colombia realizan envíos?",
        a: "Hacemos envíos a toda Colombia. Desde nuestra sede principal en Cali despachamos a Bogotá, Medellín, Barranquilla, Bucaramanga, Cartagena, Pereira, Manizales, Cúcuta y todos los municipios del territorio nacional cubiertos por transportadoras reconocidas (Interrapidísimo, Servientrega, Envía o Coordinadora).",
      },
      {
        q: "¿Cuánto tiempo tarda en llegar mi pedido?",
        a: "Para Cali y el área metropolitana las entregas se realizan entre 24 a 48 horas hábiles. Para el resto de ciudades principales del país, el tiempo promedio es de 2 a 4 días hábiles posteriores a la confirmación del despacho.",
      },
      {
        q: "¿Cómo puedo rastrear mi paquete?",
        a: "Una vez la transportadora recolecta tu paquete, te enviamos el número de guía y el enlace de rastreo directamente a tu WhatsApp para que puedas ver el estado de tu entrega paso a paso.",
      },
    ],
  },
  {
    category: "Métodos de Pago y Garantías",
    icon: CreditCard,
    questions: [
      {
        q: "¿Cuáles son las formas de pago disponibles?",
        a: "Aceptamos transferencias electrónicas a través de Nequi, Daviplata, Bancolombia y PSE/Bancos aliados. En zonas seleccionadas también coordinamos pago contra entrega con el asesor al momento de confirmar el pedido.",
      },
      {
        q: "¿Mis compras tienen garantía?",
        a: "Sí, todos nuestros productos cuentan con garantía por defectos de fábrica. Si tu producto llega averiado o con fallas, contáctanos dentro de los primeros 5 días hábiles tras recibirlo para gestionar el cambio o reposición sin costo adicional.",
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className="py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-primary text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Centro de Ayuda</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Preguntas Frecuentes & Envíos
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
            Todo lo que necesitas saber sobre cómo pedir, nuestros tiempos de despacho nacional y medios de pago en alyshop.
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="space-y-10">
          {FAQS.map((group, gIdx) => {
            const Icon = group.icon;
            return (
              <div key={gIdx} className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-stone-900">{group.category}</h2>
                </div>

                <div className="space-y-3">
                  {group.questions.map((faq, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs transition-all hover:border-primary/30"
                    >
                      <h3 className="font-black text-stone-900 text-sm sm:text-base mb-2">
                        {faq.q}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Support Banner */}
        <div className="mt-14 bg-gradient-to-r from-orange-50 via-[#FFFBF7] to-pink-50 rounded-3xl p-6 sm:p-8 border border-orange-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-stone-900">
              ¿Tienes una duda adicional?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Escríbenos a nuestra línea de atención en WhatsApp y te responderemos con gusto.
            </p>
          </div>

          <a
            href="https://wa.me/573213052913?text=Hola%20alyshop,%20tengo%20una%20pregunta%20sobre%20los%20env%C3%ADos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-bold shadow-md transition-all shrink-0 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Hablar con un asesor</span>
          </a>
        </div>
      </div>
    </div>
  );
}
