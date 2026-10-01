"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";
import { clearRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | null;

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const user = String(formData.get("user") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const ip = getClientIp(await headers());
  const limitKey = `login:${ip}`;
  const limit = await rateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return {
      error: `Demasiados intentos fallidos. Espera ${minutes} minuto(s) e inténtalo de nuevo.`,
    };
  }

  if (!checkCredentials(user, password)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await clearRateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  redirect("/admin");
}