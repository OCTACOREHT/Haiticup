import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { getBearerToken, getServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function DELETE(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const payload = (await request.json()) as { id?: unknown };
    if (!isNonEmptyString(payload.id)) {
      return Response.json({ error: "Team id is required." }, { status: 400 });
    }

    const teamId = payload.id.trim();
    const supabase = getServiceSupabaseClient();

    // 1. Find all matches involving this team
    const { data: teamMatches, error: matchFetchError } = await supabase
      .from("tournament_matches")
      .select("id")
      .or(`home_registere_id.eq.${teamId},away_registere_id.eq.${teamId}`);

    if (matchFetchError) {
      return Response.json({ error: matchFetchError.message }, { status: 500 });
    }

    const matchIds = (teamMatches ?? []).map((m: { id: string }) => m.id);

    // 2. Delete goals for those matches
    if (matchIds.length > 0) {
      const { error: goalsError } = await supabase
        .from("tournament_match_goals")
        .delete()
        .in("match_id", matchIds);

      if (goalsError) {
        return Response.json({ error: goalsError.message }, { status: 500 });
      }
    }

    // 3. Delete the matches themselves
    if (matchIds.length > 0) {
      const { error: matchesError } = await supabase
        .from("tournament_matches")
        .delete()
        .in("id", matchIds);

      if (matchesError) {
        return Response.json({ error: matchesError.message }, { status: 500 });
      }
    }

    // 4. Delete group entries
    const { error: groupEntriesError } = await supabase
      .from("tournament_group_entries")
      .delete()
      .eq("registere_id", teamId);

    if (groupEntriesError) {
      return Response.json({ error: groupEntriesError.message }, { status: 500 });
    }

    // 5. Delete staff
    const { error: staffError } = await supabase
      .from("registere_staff")
      .delete()
      .eq("registere_id", teamId);

    if (staffError) {
      return Response.json({ error: staffError.message }, { status: 500 });
    }

    // 6. Delete players
    const { error: playersError } = await supabase
      .from("registere_players")
      .delete()
      .eq("registere_id", teamId);

    if (playersError) {
      return Response.json({ error: playersError.message }, { status: 500 });
    }

    // 7. Delete the team registration itself
    const { error: teamError } = await supabase
      .from("registere")
      .delete()
      .eq("id", teamId);

    if (teamError) {
      return Response.json({ error: teamError.message }, { status: 500 });
    }

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

export async function PATCH(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const payload = (await request.json()) as { id?: string; clubLogoUrl?: string };
    if (!isNonEmptyString(payload.id)) {
      return Response.json({ error: "Team id is required." }, { status: 400 });
    }

    if (!isNonEmptyString(payload.clubLogoUrl)) {
      return Response.json({ error: "clubLogoUrl is required." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase
      .from("registere")
      .update({ club_logo_url: payload.clubLogoUrl.trim() })
      .eq("id", payload.id.trim());

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

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
