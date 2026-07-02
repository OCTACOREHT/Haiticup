import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { getBearerToken, getServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RegistereRow = {
  id: string;
  team_name: string | null;
  club_logo_url: string | null;
};

type PlayerRow = {
  id: string;
  registere_id: string;
  full_name: string | null;
  position: string | null;
  jersey_number: string | null;
  age: number | null;
  photo_url: string | null;
  photo_size_bytes: number | null;
  badge_id: string | null;
};

type UpdatePlayerPayload = {
  id: string;
  registereId?: string;
  teamName?: string;
  fullName: string;
  position: string;
  jerseyNumber: string;
  age: number;
  photoUrl?: string;
  photoSizeBytes?: number;
};

type DeletePlayerPayload = {
  id: string;
};

type CreatePlayerPayload = {
  registereId: string;
  teamName: string;
  fullName: string;
  position: string;
  jerseyNumber: string;
  age: number;
  photoUrl: string;
  photoSizeBytes: number;
  badgeId: string;
  qrPayload: any;
  qrCodeDataUrl: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toSafeText = (value: string | null | undefined, fallback: string) => {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : fallback;
};

const readPlayers = async () => {
  const supabase = getServiceSupabaseClient();

  const [teamsResult, playersResult] = await Promise.all([
    supabase.from("registere").select("id, team_name, club_logo_url"),
    supabase
      .from("registere_players")
      .select("id, registere_id, full_name, position, jersey_number, age, photo_url, photo_size_bytes, badge_id"),
  ]);

  if (teamsResult.error) throw new Error(`registere: ${teamsResult.error.message}`);
  if (playersResult.error) throw new Error(`registere_players: ${playersResult.error.message}`);

  const teams = (teamsResult.data ?? []) as RegistereRow[];
  const players = (playersResult.data ?? []) as PlayerRow[];

  const teamById = new Map<string, { teamName: string; clubLogoUrl: string | null }>();
  teams.forEach((team) => {
    teamById.set(team.id, {
      teamName: toSafeText(team.team_name, "Unknown Team"),
      clubLogoUrl: isNonEmptyString(team.club_logo_url) ? team.club_logo_url.trim() : null,
    });
  });

  return {
    teams: teams
      .map((team) => ({
        id: team.id,
        teamName: toSafeText(team.team_name, "Unknown Team"),
        clubLogoUrl: isNonEmptyString(team.club_logo_url) ? team.club_logo_url.trim() : null,
      }))
      .sort((a, b) => a.teamName.localeCompare(b.teamName)),
    players: players
      .map((player) => {
        const team = teamById.get(player.registere_id);
        return {
          id: player.id,
          registereId: player.registere_id,
          teamName: team?.teamName ?? "Unknown Team",
          clubLogoUrl: team?.clubLogoUrl ?? null,
          fullName: toSafeText(player.full_name, "Unknown Player"),
          position: toSafeText(player.position, "Player"),
          jerseyNumber: toSafeText(player.jersey_number, "-"),
          age: typeof player.age === "number" ? player.age : null,
          photoUrl: player.photo_url,
          photoSizeBytes: typeof player.photo_size_bytes === "number" ? player.photo_size_bytes : null,
          badgeId: player.badge_id,
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
  };
};

export async function GET(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const data = await readPlayers();
    return Response.json(
      {
        ...data,
        admin: {
          userId: access.userId,
          email: access.email,
          fullName: access.fullName,
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

export async function PATCH(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const payload = (await request.json()) as UpdatePlayerPayload;
    if (
      !isNonEmptyString(payload.id) ||
      !isNonEmptyString(payload.fullName) ||
      !isNonEmptyString(payload.position) ||
      !isNonEmptyString(payload.jerseyNumber) ||
      typeof payload.age !== "number" ||
      !Number.isFinite(payload.age) ||
      !Number.isInteger(payload.age) ||
      payload.age < 10 ||
      payload.age > 80
    ) {
      return Response.json({ error: "Invalid player update payload." }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      full_name: payload.fullName.trim(),
      position: payload.position.trim(),
      jersey_number: payload.jerseyNumber.trim(),
      age: payload.age,
    };

    if (payload.registereId !== undefined) {
      if (!isNonEmptyString(payload.registereId)) {
        return Response.json({ error: "registereId cannot be empty." }, { status: 400 });
      }
      updatePayload.registere_id = payload.registereId.trim();
    }

    if (payload.photoUrl !== undefined) {
      if (!isNonEmptyString(payload.photoUrl)) {
        return Response.json({ error: "photoUrl cannot be empty." }, { status: 400 });
      }

      if (
        typeof payload.photoSizeBytes !== "number" ||
        !Number.isFinite(payload.photoSizeBytes) ||
        payload.photoSizeBytes <= 0 ||
        payload.photoSizeBytes > MAX_IMAGE_SIZE_BYTES
      ) {
        return Response.json({ error: "photoSizeBytes must be between 1 byte and 5 MB." }, { status: 400 });
      }

      updatePayload.photo_url = payload.photoUrl;
      updatePayload.photo_size_bytes = Math.trunc(payload.photoSizeBytes);
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("registere_players").update(updatePayload).eq("id", payload.id.trim());

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (payload.teamName !== undefined) {
      if (!isNonEmptyString(payload.teamName)) {
        return Response.json({ error: "teamName cannot be empty." }, { status: 400 });
      }

      const targetTeamId =
        isNonEmptyString(payload.registereId) ? payload.registereId.trim() : undefined;

      if (!targetTeamId) {
        return Response.json({ error: "registereId is required when teamName is provided." }, { status: 400 });
      }

      const { error: teamUpdateError } = await supabase
        .from("registere")
        .update({ team_name: payload.teamName.trim() })
        .eq("id", targetTeamId);

      if (teamUpdateError) {
        return Response.json({ error: teamUpdateError.message }, { status: 400 });
      }
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

export async function DELETE(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const payload = (await request.json()) as DeletePlayerPayload;
    if (!isNonEmptyString(payload.id)) {
      return Response.json({ error: "Player id is required." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("registere_players").delete().eq("id", payload.id.trim());

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
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

export async function POST(request: Request) {
  try {
    const access = await verifyAdminAccess(getBearerToken(request));
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const payload = (await request.json()) as CreatePlayerPayload;

    if (
      !isNonEmptyString(payload.registereId) ||
      !isNonEmptyString(payload.teamName) ||
      !isNonEmptyString(payload.fullName) ||
      !isNonEmptyString(payload.position) ||
      !isNonEmptyString(payload.jerseyNumber) ||
      typeof payload.age !== "number" ||
      !Number.isFinite(payload.age) ||
      !Number.isInteger(payload.age) ||
      payload.age < 10 ||
      payload.age > 80 ||
      !isNonEmptyString(payload.photoUrl) ||
      typeof payload.photoSizeBytes !== "number" ||
      !isNonEmptyString(payload.badgeId) ||
      !isNonEmptyString(payload.qrCodeDataUrl) ||
      !payload.qrPayload
    ) {
      return Response.json({ error: "Invalid player creation payload." }, { status: 400 });
    }

    const insertPayload = {
      registere_id: payload.registereId.trim(),
      full_name: payload.fullName.trim(),
      position: payload.position.trim(),
      jersey_number: payload.jerseyNumber.trim(),
      age: payload.age,
      photo_url: payload.photoUrl,
      photo_size_bytes: payload.photoSizeBytes,
      badge_id: payload.badgeId.trim(),
      qr_payload: payload.qrPayload,
      qr_code_data_url: payload.qrCodeDataUrl,
    };

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("registere_players").insert([insertPayload]);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
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
