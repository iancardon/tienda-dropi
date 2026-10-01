import type { Metadata } from "next";
import Link from "next/link";
import { STORE_CONFIG } from "@/lib/store";

export const metadata: Metadata = {
  title: "Política de Envíos",
  description: "Información sobre envíos, costos y tiempos de entrega.",
};

export default function EnviosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Política de Envíos</h1>
      <p className="mt-2 text-zinc-500">
        Información sobre costos, tiempos y cobertura de envíos.
      </p>

      <div className="mt-8 space-y-6 text-zinc-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">Cobertura</h2>
          <p>
            Realizamos envíos a <strong>toda Colombia</strong> a través de
            transportadoras aliadas. Llegamos a ciudades principales, municipios
            y corregimientos donde tenga cobertura nuestra red logística.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Costo de envío</h2>
          <p>
            El costo de envío estándar es de <strong>{STORE_CONFIG.currency} {STORE_CONFIG.shippingCost.toLocaleString("es-CO")}</strong>
            y se paga <strong>contra entrega</strong> junto con el valor de los productos.
            El costo se calcula automáticamente en el carrito y checkout.
          </p>
          <p className="mt-2">
            <strong>Envío gratis:</strong> En pedidos superiores a $200.000 COP
            (promociones sujetas a cambios).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Tiempos de entrega</h2>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Ciudades principales: 2-3 días hábiles.</li>
            <li>Otras ciudades y municipios: 3-5 días hábiles.</li>
            <li>Zonas rurales/difícil acceso: 5-8 días hábiles.</li>
          </ul>
          <p className="mt-2 text-zinc-600">
            Los tiempos son estimados y pueden variar por condiciones climáticas,
            festivos, o situaciones de fuerza mayor. El conteo inicia tras la
            confirmación del pedido por WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Proceso de envío</h2>
          <ol className="mt-2 list-decimal list-inside space-y-2">
            <li>Confirma su pedido en el checkout.</li>
            <li>Le contactamos por WhatsApp para confirmar datos.</li>
            <li>Preparamos y empaquetamos su pedido.</li>
            <li>Entregamos a la transportadora (recibirá número de guía).</li>
            <li>La transportadora realiza la entrega en su dirección.</li>
            <li>Usted paga en efectivo al recibir (productos + envío).</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Seguimiento</h2>
          <p>
            Una vez despachado, le enviaremos el número de guía por WhatsApp
            para que pueda rastrear su envío en la web de la transportadora.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Entrega fallida</h2>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>La transportadora hará hasta 2 intentos de entrega en días hábiles consecutivos.</li>
            <li>Si no hay nadie para recibir, el paquete regresa a nuestra bodega.</li>
            <li>Nos pondremos en contacto para coordinar reenvío (costo adicional a cargo del cliente) o cancelación.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Dirección de entrega</h2>
          <p>
            Es responsabilidad del cliente proporcionar una dirección completa
            y correcta (barrio, casa/apartamento, referencia). Errores en la
            dirección que impidan la entrega generarán costos adicionales de reenvío.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Zonas no cubiertas</h2>
          <p>
            Algunas zonas de difícil acceso o riesgo alto pueden no tener cobertura.
            Si su dirección no tiene cobertura, nos pondremos en contacto para
            buscar alternativas (punto de recogida en ciudad cercana, etc.) o
            cancelar el pedido sin costo.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-zinc-200">
          <Link
            href="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}