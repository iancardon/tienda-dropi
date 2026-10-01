import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function prune(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Limitador en memoria: sirve en local y es el respaldo si Redis falla. */
function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

const REDIS_PREFIX = "tienda";
const limiters = new Map<string, Ratelimit>();
let warned = false;

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

/** Un limitador por combinacion de peticiones y ventana, para no recrear el cliente. */
function getLimiter(limit: number, windowMs: number): Ratelimit {
  const minutes = Math.max(1, Math.round(windowMs / 60_000));
  const cacheKey = `${limit}:${minutes}`;
  const cached = limiters.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(limit, `${minutes} m`),
    prefix: REDIS_PREFIX,
    analytics: false,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * Si Upstash esta configurado y responde, el limite queda compartido entre
 * todas las instancias de Vercel. Sin variables, o si Redis falla, se cae al
 * limite en memoria: preferimos un limite local blando a dejar la tienda sin
 * poder recibir pedidos.
 */
async function sharedRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  if (!redisConfigured()) return null;

  try {
    const result = await getLimiter(limit, windowMs).limit(key);
    return {
      ok: result.success,
      remaining: result.remaining,
      retryAfterSeconds: result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 0,
    };
  } catch (error) {
    if (!warned) {
      warned = true;
      console.error(
        "[rate-limit] Upstash no respondio; se usa el limite en memoria hasta que se recupere.",
        error instanceof Error ? error.message : error
      );
    }
    return null;
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // El limite se ajusta aqui y no en cada llamada, para que el margen de una
  // peticion sin IP sea el mismo en Redis y en el respaldo en memoria.
  const efectivo = limiteEfectivo(key, limit);
  const shared = await sharedRateLimit(key, efectivo, windowMs);
  return shared ?? memoryRateLimit(key, efectivo, windowMs);
}

export async function clearRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<void> {
  buckets.delete(key);
  if (!redisConfigured()) return;

  try {
    await getLimiter(limiteEfectivo(key, limit), windowMs).resetUsedTokens(key);
  } catch {
    // Sin Redis no se puede limpiar el contador compartido; no es critico.
  }
}

/**
 * Clave compartida de las peticiones sin IP, y factor que multiplica su limite.
 * Se reconoce delimitada por ":" para que ningun otro texto de una clave
 * active por error el margen mas alto.
 */
const SIN_IP = "sin-ip";
const LIMITE_SIN_IP_MULTIPLICADOR = 10;
const CLAVE_SIN_IP = new RegExp(`(^|:)${SIN_IP}($|:)`);

/**
 * Limite que corresponde a una clave: el de la peticion sin IP es mas alto,
 * para que un visitante al que no se le puede atribuir una IP no se bloquee
 * solo por el trafico de otras personas.
 */
export function limiteEfectivo(key: string, limit: number): number {
  return CLAVE_SIN_IP.test(key) ? limit * LIMITE_SIN_IP_MULTIPLICADOR : limit;
}

/** IPv4 con cuatro octetos validos y sin ceros a la izquierda. */
function esIpv4(valor: string): boolean {
  const partes = valor.split(".");
  if (partes.length !== 4) return false;
  return partes.every((parte) => {
    if (!/^\d{1,3}$/.test(parte)) return false;
    const numero = Number(parte);
    return numero >= 0 && numero <= 255 && String(numero) === parte;
  });
}

/** IPv6, con o sin compresion "::". */
function esIpv6(valor: string): boolean {
  if (valor.indexOf("::") !== valor.lastIndexOf("::")) return false;
  const grupos = (texto: string) => (texto === "" ? [] : texto.split(":"));

  if (!valor.includes("::")) {
    const partes = grupos(valor);
    return partes.length === 8 && partes.every((g) => /^[0-9a-f]{1,4}$/i.test(g));
  }

  const [izquierda, derecha] = valor.split("::");
  const partes = [...grupos(izquierda), ...grupos(derecha)];
  if (!partes.every((g) => /^[0-9a-f]{1,4}$/i.test(g))) return false;
  return partes.length <= 7;
}

/**
 * Normaliza la IP a una forma canonica.
 *
 * Una IPv4 mapeada dentro de IPv6 (::ffff:1.2.3.4, forma que emite el socket de
 * Node cuando la conexion llega por IPv4) se devuelve como IPv4. Asi el mismo
 * visitante no acaba con dos contadores distintos segun como lo reporte el
 * proxy. Devuelve null si el valor no es una IP.
 */
function normalizarIp(valor: string): string | null {
  const ip = valor.trim();
  if (!ip) return null;

  const mapeada = ip.match(/^(?:::ffff:|0:0:0:0:0:ffff:)(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapeada) return esIpv4(mapeada[1]) ? mapeada[1] : null;

  if (ip.includes(".")) return esIpv4(ip) ? ip : null;
  if (!ip.includes(":")) return null;
  return esIpv6(ip) ? ip.toLowerCase() : null;
}

/** Ultima IP valida de una cabecera, leida de derecha a izquierda. */
function ipDesdeCabecera(bruto: string | null): string | null {
  if (!bruto) return null;
  for (const parte of bruto.split(",").reverse()) {
    const ip = normalizarIp(parte);
    if (ip) return ip;
  }
  return null;
}

let avisoSinIp = false;

/**
 * IP del cliente para el limitador de peticiones.
 *
 * Prioridad de cabeceras:
 *  1. x-vercel-forwarded-for: la emite la plataforma y no se sobrescribe
 *     aunque haya un proxy delante de Vercel.
 *  2. x-real-ip: tambien la calcula la plataforma.
 *  3. x-forwarded-for: se usa el ultimo valor valido, nunca el primero, que
 *     es el que puede falsear el cliente.
 *
 * Sin IP valida se devuelve una clave compartida (no una por peticion, que
 * haria el limite evadible de un modo trivial) y se avisa una vez por proceso.
 * Esa clave lleva un limite mas alto, para que un visitante sin IP no se
 * bloquee solo aunque haya trafico de otras personas.
 */
export function getClientIp(headers: Headers): string {
  for (const nombre of ["x-vercel-forwarded-for", "x-real-ip"]) {
    const ip = ipDesdeCabecera(headers.get(nombre));
    if (ip) return ip;
  }

  const deProxy = ipDesdeCabecera(headers.get("x-forwarded-for"));
  if (deProxy) return deProxy;

  if (!avisoSinIp) {
    avisoSinIp = true;
    console.warn(
      "[rate-limit] AVISO: peticion sin IP de cliente detectable. Todas las peticiones sin IP comparten un contador con limite mas alto; revise que el proxy de Vercel este reenviando x-real-ip o x-vercel-forwarded-for."
    );
  }
  return SIN_IP;
}
