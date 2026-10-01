import { STORE_CONFIG } from "@/lib/store";

/**
 * Soporte para las páginas legales.
 *
 * Los textos son genéricos y los datos que dependen de la tienda (responsable,
 * NIT, correo, teléfono, horarios, plazos) aparecen marcados como
 * `[[COMPLETAR: ...]]` mientras no se hayan definido de verdad.
 *
 * Un campo se considera "pendiente" si la variable de entorno está vacía o
 * todavía tiene el valor de ejemplo. En cuanto pones el dato real en `.env`
 * (o editas el texto de la página), el aviso desaparece solo.
 */

/** Valores de ejemplo que siguen contando como "sin completar". */
const PLACEHOLDER_VALUES = new Set([
  "",
  "colombia",
  "+57 300 000 0000",
  "300 000 0000",
  "573000000000",
  "contacto@mitienda.com",
  "contacto@tiendadropi.co",
  "mi tienda",
  "mitienda",
  "mitienda (titular por definir)",
  "tiendadropi",
  "tiendadropi sas",
  "paga cuando recibes",
]);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function isPendingValue(value: string | undefined | null): boolean {
  return PLACEHOLDER_VALUES.has(normalize(value ?? ""));
}

/** Texto visible para un campo todavía sin completar. */
export function pendingText(label: string): string {
  return `[[COMPLETAR: ${label}]]`;
}

export type LegalField = {
  /** Clave interna del campo. */
  key: string;
  /** Qué hay que poner ahí. */
  label: string;
  /** Variable de entorno que lo alimenta, si existe. */
  env: string | null;
  /** Valor actual (o cadena vacía si hay que escribirlo en la página). */
  value: string;
  /** Si todavía hay que completarlo. */
  pending: boolean;
};

const fromEnv = (key: string, label: string, env: string, value: string): LegalField => ({
  key,
  label,
  env,
  value,
  pending: isPendingValue(value),
});

/** Campo que solo se completa editando el texto de la página. */
const manual = (key: string, label: string): LegalField => ({
  key,
  label,
  env: null,
  value: "",
  pending: true,
});

/** Datos de la tienda que aparecen en los textos legales. */
export const LEGAL_FIELDS: LegalField[] = [
  fromEnv("storeName", "nombre comercial de la tienda", "NEXT_PUBLIC_STORE_NAME", STORE_CONFIG.name),
  fromEnv("responsible", "nombre o razón social del responsable del tratamiento", "STORE_RESPONSIBLE", STORE_CONFIG.responsible),
  fromEnv("address", "domicilio del responsable", "STORE_ADDRESS", STORE_CONFIG.address),
  fromEnv("email", "correo electrónico de contacto", "STORE_EMAIL", STORE_CONFIG.email),
  fromEnv("phone", "teléfono de contacto", "STORE_PHONE", STORE_CONFIG.phone),
  fromEnv("whatsapp", "número de WhatsApp de atención", "STORE_WHATSAPP", STORE_CONFIG.whatsapp),
  manual("nit", "NIT o identificación del responsable (se escribe en la página de privacidad)"),
  manual("privacyEmail", "correo para ejercer derechos sobre datos personales (se escribe en la página de privacidad)"),
  manual("hours", "horario de atención (se escribe en la página de contacto)"),
  manual("supportHours", "horario de atención de soporte posventa (se escribe en la página de devoluciones)"),
];

export function pendingLegalFields(): LegalField[] {
  return LEGAL_FIELDS.filter((field) => field.pending);
}

/**
 * Devuelve el valor listo para pintar: si el campo está pendiente devuelve el
 * texto marcado, y si no, el valor real.
 */
export function legalValue(field: LegalField): string {
  return field.pending ? pendingText(field.label) : field.value;
}

export function legalField(key: string): LegalField {
  const field = LEGAL_FIELDS.find((f) => f.key === key);
  if (!field) throw new Error(`Campo legal desconocido: ${key}`);
  return field;
}

/** Fecha de última actualización, en formato legible. */
export function legalUpdatedAt(): string {
  return new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
