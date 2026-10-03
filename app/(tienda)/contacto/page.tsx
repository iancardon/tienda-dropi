import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalValue } from "@/components/legal-shell";
import { legalField } from "@/lib/legal";
import { IconChat, IconMail, IconMapPin, IconPhone, IconWhatsApp } from "@/components/icons";
import { STORE_CONFIG, formatPhone, getWhatsAppUrl } from "@/lib/store";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Contacta a ${STORE_CONFIG.name} por WhatsApp o correo electrónico.`,
};

export default function ContactoPage() {
  const whatsappField = legalField("whatsapp");
  const emailField = legalField("email");

  return (
    <LegalShell
      title="Contacto"
      intro="Escríbenos por cualquiera de estos canales y te respondemos lo antes posible."
    >
      <section>
        <h2>WhatsApp</h2>
        <p>
          Es el canal más rápido para consultas de un pedido existente, cambios de
          dirección o estado de una entrega.
        </p>
        <p className="mt-2">
          {whatsappField.pending ? (
            <LegalValue field={whatsappField} />
          ) : (
            <a
              href={getWhatsAppUrl(
                "Hola, tengo una consulta sobre mi pedido en " + STORE_CONFIG.name + "."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <IconWhatsApp className="h-4 w-4" />
              {formatPhone()}
            </a>
          )}
        </p>
      </section>

      <section>
        <h2>Correo electrónico</h2>
        <p>Para temas como facturación, datos personales o consultas generales.</p>
        <p className="mt-2">
          {emailField.pending ? (
            <LegalValue field={emailField} />
          ) : (
            <a
              href={`mailto:${STORE_CONFIG.email}`}
              className="inline-flex items-center gap-2 font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              <IconMail className="h-4 w-4" />
              {STORE_CONFIG.email}
            </a>
          )}
        </p>
      </section>

      <section>
        <h2>Teléfono</h2>
        <p className="flex items-center gap-2">
          <IconPhone className="h-4 w-4 shrink-0 text-zinc-400" />
          <LegalValue field={legalField("phone")} />
        </p>
      </section>

      <section>
        <h2>Horario de atención</h2>
        <p>
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: horario de atención]]
          </span>
        </p>
        <p className="mt-2">
          Los pedidos se pueden hacer cualquier día. Fuera del horario publicado,
          te responderemos por WhatsApp en el siguiente día hábil.
        </p>
      </section>

      <section>
        <h2>Datos de la tienda</h2>
        <p className="flex items-start gap-2">
          <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <span>
            <LegalValue field={legalField("responsible")} />
            <br />
            <LegalValue field={legalField("address")} />
          </span>
        </p>
      </section>

      <section>
        <h2>Seguimiento de tu pedido</h2>
        <p>
          Cuando confirmes un pedido recibirás un número de pedido. Puedes pedir el
          estado de tu envío escribiendo por WhatsApp e indicando ese número, o
          puedes revisarlo en el enlace de confirmación que te enviamos.
        </p>
        <p className="mt-3">
          <Link
            href="/envios"
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            Consultar política de envíos
          </Link>
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <h2 className="flex items-center gap-2">
          <IconChat className="h-5 w-5 text-emerald-600" />
          ¿Necesitas algo más?
        </h2>
        <p>
          Si tienes dudas sobre un pedido, un envío o un producto, escríbenos por
          WhatsApp: es la forma más rápida de resolverlo.
        </p>
      </section>
    </LegalShell>
  );
}