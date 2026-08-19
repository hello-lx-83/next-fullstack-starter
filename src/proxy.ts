import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  if (request.nextUrl.pathname.startsWith("/dashboard") && !getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
