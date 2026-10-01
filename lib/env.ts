/**
 * Validacion de variables de entorno criticas.
 *
 * El objetivo es que una tienda desplegada con `ADMIN_PASSWORD=admin123` o sin
 * `ADMIN_SECRET` falle de forma ruidosa al arrancar, y no que se quede
 * funcionando con una credencial adivinable.
 */

/** Valores de ejemplo conocidos. Si alguien los copia tal cual, la app no arranca. */
const FORBIDDEN_VALUES: Record<string, string[]> = {
  ADMIN_PASSWORD: [
    "admin123",
    "cambia-esta-contrasena",
    "cambia-esta-clave-en-produccion",
    "changeme",
    "password",
    "12345678",
  ],
  ADMIN_SECRET: [
    "dev-admin-secret-change-me",
    "cambia-esta-clave-en-produccion",
    "changeme",
    "secret",
  ],
};

/** Longitud minima aceptable para cada clave. */
const MIN_LENGTH: Record<string, number> = {
  ADMIN_PASSWORD: 8,
  ADMIN_SECRET: 24,
};

function checkValue(key: string, problems: string[]): void {
  const raw = process.env[key];
  const value = raw?.trim() ?? "";

  if (value === "") {
    problems.push(`- ${key} esta vacia o no esta definida.`);
    return;
  }

  // Nunca se imprime el valor: solo se dice que coincide con uno de ejemplo.
  if (FORBIDDEN_VALUES[key]?.includes(value)) {
    problems.push(
      `- ${key} conserva un valor de ejemplo. Genera uno nuevo con \`npm run secret:admin\`.`
    );
    return;
  }

  const min = MIN_LENGTH[key];
  if (min !== undefined && value.length < min) {
    problems.push(
      `- ${key} es demasiado corta: ${value.length} caracteres, minimo ${min}.`
    );
  }
}

/**
 * Falla con un mensaje claro si la configuracion de produccion es insegura.
 * No hace nada en desarrollo ni durante `next build`, para no romper el build
 * local de quien aun no ha configurado el panel.
 */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const problems: string[] = [];
  checkValue("ADMIN_PASSWORD", problems);
  checkValue("ADMIN_SECRET", problems);

  if (problems.length > 0) {
    throw new Error(
      [
        "[seguridad] Configuracion de produccion insegura:",
        ...problems,
        "",
        "La tienda se detuvo para no exponer el panel de administracion.",
        "Corrige estas variables en el panel de Vercel (Settings > Environment",
        "Variables) y vuelve a desplegar. Para generar un secreto:",
        "  npm run secret:admin",
        "",
        "En local: copia .env.example a .env y cambia los valores.",
      ].join("\n")
    );
  }

  warnIfUpstashMissing();
}

/**
 * El rate limit usa Upstash si encuentra sus dos variables. Sin ellas cae al
 * contador en memoria, que en Vercel es uno por instancia: el tope real queda
 * varias veces mas alto que el configurado. No detiene la tienda (preferimos
 * vender a quedarnos sin proteccion), pero avisa en los logs del despliegue.
 */
function warnIfUpstashMissing(): void {
  const faltan = (["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const).filter(
    (key) => !process.env[key]?.trim()
  );
  if (faltan.length === 0) return;

  console.warn(
    [
      "",
      "[rate-limit] AVISO: falta " + faltan.join(" y ") + ".",
      "El limitador de peticiones caera al contador en memoria, que en Vercel",
      "es distinto en cada instancia: el tope real sera varias veces mayor al",
      "configurado (8 pedidos / 10 min, 5 intentos de login / 15 min).",
      "La tienda sigue vendiendo, pero con menos proteccion contra abuso.",
      "Para activarlo crea una base gratis en upstash.com y define ambas",
      "variables en el panel de Vercel (Settings > Environment Variables).",
      "",
    ].join("\n")
  );
}
