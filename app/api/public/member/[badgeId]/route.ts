import { getPublicMemberProfileByBadgeId } from "@/lib/badges/member-profile";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ badgeId: string }> },
) {
  try {
    const { badgeId } = await params;
    const profile = await getPublicMemberProfileByBadgeId(badgeId);

    if (!profile) {
      return Response.json({ error: "Badge not found." }, { status: 404 });
    }

    return Response.json({ profile }, { status: 200 });
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
