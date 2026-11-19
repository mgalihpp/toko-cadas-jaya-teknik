import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_LOGIN = "/admin/masuk";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN && !hasSession) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
  }

  const needsLogin = pathname === "/checkout" || pathname.startsWith("/pesanan");
  if (needsLogin && !hasSession) {
    const url = new URL("/masuk", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/pesanan/:path*"],
};
