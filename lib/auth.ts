import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  readSetting,
  safeEqual,
  verifySessionToken,
} from "./session-token";

export { SESSION_COOKIE, SESSION_TTL_MS, createSessionToken, verifySessionToken };

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guardia para server actions del panel. Los actions son endpoints HTTP
 * públicos: validar en la página no es suficiente, hay que authorizing aquí.
 */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("No autorizado: se requiere una sesión de administrador.");
  }
}

export function checkCredentials(user: string, password: string): boolean {
  let adminUser: string;
  let adminPass: string;
  try {
    adminUser = readSetting("ADMIN_USER");
    adminPass = readSetting("ADMIN_PASSWORD");
  } catch {
    return false;
  }
  const userOk = safeEqual(user, adminUser);
  const passOk = safeEqual(password, adminPass);
  return userOk && passOk;
}
