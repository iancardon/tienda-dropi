/**
 * Punto de entrada del servidor. Next.js llama a `register()` una vez al
 * arrancar, antes de atender la primera peticion. Lo usamos para revisar la
 * configuracion critica y detener la tienda si el panel de administracion
 * quedaria con credenciales inseguras.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertProductionEnv } = await import("./lib/env");
  assertProductionEnv();
}
