import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Segunda barrera para /admin: además de la validación dentro de cada página y
 * cada server action, aquí se bloquean las peticiones sin sesión válida.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const authenticated = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (isLogin) {
    return authenticated
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
