import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { ADMIN_SESSION_COOKIE, getAdminSessionCookieOptions } from "@/lib/supabase/admin-session";

const buildLoginRedirect = (request: NextRequest) => {
  const loginUrl = new URL("/admin/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath || "/admin");
  return loginUrl;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value?.trim() ?? "";

  if (!token) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  const access = await verifyAdminAccess(token);
  if (!access.ok) {
    const response = NextResponse.redirect(buildLoginRedirect(request));
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      ...getAdminSessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/badges/:path*"],
};

