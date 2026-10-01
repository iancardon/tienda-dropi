import type { Metadata } from "next";
import { LegalShell, LegalValue } from "@/components/legal-shell";
import { legalField } from "@/lib/legal";
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
        <h2 className="text-xl font-semibold">WhatsApp</h2>
        <p>
          Es el canal más rápido para consultas de un pedido existente, cambios de
          dirección o estado de una entrega.
        </p>
        <p className="mt-2">
          {whatsappField.pending ? (
            <LegalValue field={whatsappField} />
          ) : (
            <a
              href={getWhatsAppUrl("Hola, tengo una consulta sobre mi pedido en " + STORE_CONFIG.name + ".")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-600 underline hover:text-emerald-700"
            >
              {formatPhone()}
            </a>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Correo electrónico</h2>
        <p>Para temas como facturación, datos personales o consultas generales.</p>
        <p className="mt-2">
          {emailField.pending ? (
            <LegalValue field={emailField} />
          ) : (
            <a
              href={`mailto:${STORE_CONFIG.email}`}
              className="font-medium text-emerald-600 underline hover:text-emerald-700"
            >
              {STORE_CONFIG.email}
            </a>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Teléfono</h2>
        <p>
          <LegalValue field={legalField("phone")} />
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Horario de atención</h2>
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
        <h2 className="text-xl font-semibold">Datos de la tienda</h2>
        <p>
          <LegalValue field={legalField("responsible")} />
          <br />
          <LegalValue field={legalField("address")} />
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Seguimiento de tu pedido</h2>
        <p>
          Cuando confirmes un pedido recibirás un número de pedido. Puedes pedir el
          estado de tu envío escribiendo por WhatsApp e indicando ese número, o
          puedes revisarlo en el enlace de confirmación que te enviamos.
        </p>
      </section>
    </LegalShell>
  );
}
