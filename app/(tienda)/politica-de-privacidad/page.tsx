import type { Metadata } from "next";
import { LegalShell, LegalValue } from "@/components/legal-shell";
import { legalField } from "@/lib/legal";
import { STORE_CONFIG } from "@/lib/store";

export const metadata: Metadata = {
  title: "Política de Privacidad y Tratamiento de Datos Personales",
  description: `Política de privacidad y tratamiento de datos personales de ${STORE_CONFIG.name}, conforme a la Ley 1581 de 2012.`,
};

export default function PoliticaDePrivacidadPage() {
  return (
    <LegalShell
      title="Política de Privacidad y Tratamiento de Datos Personales"
      intro="Cómo tratamos sus datos personales, conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015 (que compiló el Decreto 1377 de 2013) en Colombia."
    >
      <section>
        <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
        <p>
          <LegalValue field={legalField("responsible")} />, identificado con NIT{" "}
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: NIT o identificación del responsable]]
          </span>
          , con domicilio en <LegalValue field={legalField("address")} />, correo
          electrónico <LegalValue field={legalField("email")} /> y teléfono{" "}
          <LegalValue field={legalField("phone")} />, es responsable del tratamiento de
          sus datos personales. Para cualquier asunto relacionado con datos personales
          puede escribirnos a{" "}
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: correo para ejercer derechos sobre datos personales]]
          </span>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. ¿Qué datos recogemos?</h2>
        <p>Cuando realiza un pedido en nuestro sitio recogemos:</p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Nombre completo.</li>
          <li>Número de celular (obligatorio).</li>
          <li>Correo electrónico (opcional).</li>
          <li>
            Dirección de entrega: calle/carrera, número, barrio o sector, ciudad y
            departamento.
          </li>
          <li>Referencia adicional de la entrega (opcional).</li>
          <li>
            Datos del pedido: productos, cantidades, precios y valor total.
          </li>
        </ul>
        <p className="mt-2">
          No solicitamos datos sensibles (salud, orientación, biometría, datos de
          menores) ni datos de tarjetas de crédito, porque el pago es contra entrega.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Finalidades del tratamiento</h2>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Procesar, preparar y entregar su pedido.</li>
          <li>
            Contactarle por WhatsApp, llamada o correo para confirmar el pedido y los
            datos de entrega.
          </li>
          <li>Enviarle avisos sobre el estado de su pedido.</li>
          <li>Gestionar solicitudes de cambios, devoluciones y garantía.</li>
          <li>Cumplir obligaciones legales, tributarias y contables.</li>
        </ul>
        <p className="mt-2">
          La base legal es la ejecución del contrato de compraventa y su consentimiento
          expreso al aceptar la casilla de autorización durante el proceso de pedido.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Terceros y transferencias</h2>
        <p>
          Sus datos se comparten únicamente con la transportadora contratada para
          entregar el pedido y, cuando corresponda, con el proveedor que despacha los
          productos, siempre con la única finalidad de cumplir la entrega. No vendemos,
          alquilamos ni cedemos su información a terceros con fines publicitarios.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Conservación de los datos</h2>
        <p>
          Conservamos sus datos mientras dure la relación comercial y, después, por los
          plazos legales y contables aplicables en Colombia. El plazo concreto de
          conservación de cada tipo de dato está pendiente de definir:{" "}
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: plazo de conservación de datos personales]]
          </span>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Sus derechos como titular</h2>
        <p>
          Usted tiene derecho a conocer sus datos, actualizarlos, rectificarlos,
          solicitar prueba de la autorización otorgada, ser informado sobre su uso, revocar
          la autorización y solicitar la supresión del dato cuando proceda. También puede
          presentar quejas o reclamaciones ante la Superintendencia de Industria y
          Comercio (SIC) de Colombia.
        </p>
        <p className="mt-2">
          Para ejercer estos derechos escríbanos a{" "}
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: correo para ejercer derechos sobre datos personales]]
          </span>{" "}
          e identifique su pedido. Respondemos dentro de los plazos que fija la ley.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Seguridad de la información</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger sus datos
          contra el acceso no autorizado, la pérdida o la alteración, entre ellas
          acceso restringido al panel administrativo, conexiones cifradas y la
          minimización de los datos que guardamos.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política. Cualquier cambio se publicará en esta misma
          página con su nueva fecha de actualización.
        </p>
      </section>
    </LegalShell>
  );
}
