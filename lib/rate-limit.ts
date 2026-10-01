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
  const shared = await sharedRateLimit(key, limit, windowMs);
  return shared ?? memoryRateLimit(key, limit, windowMs);
}

export async function clearRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<void> {
  buckets.delete(key);
  if (!redisConfigured()) return;

  try {
    await getLimiter(limit, windowMs).resetUsedTokens(key);
  } catch {
    // Sin Redis no se puede limpiar el contador compartido; no es critico.
  }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
