import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { getBearerToken } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    return Response.json(
      {
        user: {
          id: access.userId,
          email: access.email,
          full_name: access.fullName,
        },
      },
      { status: 200 },
    );
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
