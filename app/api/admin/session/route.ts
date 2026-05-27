import { cookies } from "next/headers";
import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { ADMIN_SESSION_COOKIE, getAdminSessionCookieOptions } from "@/lib/supabase/admin-session";
import { getBearerToken } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    const access = await verifyAdminAccess(token);
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    if (!token) {
      return Response.json({ error: "Missing Authorization bearer token." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions());

    return Response.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Unexpected server error.";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, "", {
      ...getAdminSessionCookieOptions(),
      maxAge: 0,
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Unexpected server error.";

    return Response.json({ error: message }, { status: 500 });
  }
}

