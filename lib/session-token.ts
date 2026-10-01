import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/** Valores por defecto solo para desarrollo. En producción la app se niega a arrancar sin config. */
const DEV_FALLBACKS = {
  ADMIN_SECRET: "dev-admin-secret-change-me",
  ADMIN_USER: "admin",
  ADMIN_PASSWORD: "admin123",
} as const;

export type AdminSetting = keyof typeof DEV_FALLBACKS;

/** Ajustes cuyo valor por defecto no es aceptable en produccion. */
const REJECT_DEFAULTS_IN_PROD: AdminSetting[] = ["ADMIN_PASSWORD", "ADMIN_SECRET"];

export function readSetting(name: AdminSetting): string {
  const value = process.env[name]?.trim();
  if (value) {
    if (
      process.env.NODE_ENV === "production" &&
      REJECT_DEFAULTS_IN_PROD.includes(name) &&
      value === DEV_FALLBACKS[name]
    ) {
      throw new Error(
        `[seguridad] ${name} conserva un valor de ejemplo. Configura uno nuevo antes de publicar.`
      );
    }
    return value;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `[seguridad] Falta ${name} en las variables de entorno. El panel de administración queda bloqueado.`
    );
  }
  return DEV_FALLBACKS[name];
}

/** Devuelve "" si la configuración de producción es inválida, para poder Comparar sin fallar. */
function secretOrEmpty(): string {
  try {
    return readSetting("ADMIN_SECRET");
  } catch {
    return "";
  }
}

function sign(data: string): string {
  return createHmac("sha256", secretOrEmpty()).update(data).digest("hex");
}

export function createSessionToken(username: string): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = `${username}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  if (secretOrEmpty() === "") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const expiry = Number(parts[1]);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = sign(`${parts[0]}.${parts[1]}`);
  const actual = Buffer.from(parts[2]);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

/** Comparación en tiempo constante que no filtra-longitudes. */
export function safeEqual(a: string, b: string): boolean {
  const key = secretOrEmpty() || "sin-configuracion";
  const hashA = createHmac("sha256", key).update(a).digest();
  const hashB = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(hashA, hashB);
}
