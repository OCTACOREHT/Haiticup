import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { getBearerToken, getServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RegistereRow = {
  id: string;
  team_name: string | null;
};

type RegistereStaffRow = {
  id: number;
  registere_id: string;
  badge_id: string | null;
  full_name: string | null;
  role: string | null;
  photo_url: string | null;
  qr_code_data_url: string | null;
  qr_payload: Record<string, unknown> | null;
};

type RegisterePlayerRow = {
  id: number;
  registere_id: string;
  badge_id: string | null;
  full_name: string | null;
  position: string | null;
  photo_url: string | null;
  qr_code_data_url: string | null;
  qr_payload: Record<string, unknown> | null;
};

type ApiMember = {
  key: string;
  memberType: "STAFF" | "PLAYER";
  registereId: string;
  teamName: string;
  badgeId: string;
  fullName: string;
  title: string;
  subtitle: string;
  photoUrl: string | null;
  qrCodeDataUrl: string | null;
  qrPayload: Record<string, unknown> | null;
};

const toCleanText = (value: string | null | undefined, fallback: string) => {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : fallback;
};

export async function GET(request: Request) {
  try {
    const adminAccess = await verifyAdminAccess(getBearerToken(request));
    if (!adminAccess.ok) {
      return Response.json({ error: adminAccess.error }, { status: adminAccess.status });
    }

    const supabase = getServiceSupabaseClient();

    const [teamsResult, staffResult, playersResult] = await Promise.all([
      supabase.from("registere").select("id, team_name"),
      supabase
        .from("registere_staff")
        .select("id, registere_id, badge_id, full_name, role, photo_url, qr_code_data_url, qr_payload"),
      supabase
        .from("registere_players")
        .select("id, registere_id, badge_id, full_name, position, photo_url, qr_code_data_url, qr_payload"),
    ]);

    if (teamsResult.error) {
      throw new Error(`registere: ${teamsResult.error.message}`);
    }
    if (staffResult.error) {
      throw new Error(`registere_staff: ${staffResult.error.message}`);
    }
    if (playersResult.error) {
      throw new Error(`registere_players: ${playersResult.error.message}`);
    }

    const teamMap = new Map<string, string>();
    (teamsResult.data as RegistereRow[]).forEach((team) => {
      teamMap.set(team.id, toCleanText(team.team_name, "Unknown Team"));
    });

    const staffMembers: ApiMember[] = (staffResult.data as RegistereStaffRow[])
      .filter((row) => Boolean(row.badge_id))
      .map((row) => ({
        key: `staff-${row.id}`,
        memberType: "STAFF",
        registereId: row.registere_id,
        teamName: teamMap.get(row.registere_id) ?? "Unknown Team",
        badgeId: row.badge_id as string,
        fullName: toCleanText(row.full_name, "Unknown Staff"),
        title: "STAFF",
        subtitle: toCleanText(row.role, "Staff"),
        photoUrl: row.photo_url,
        qrCodeDataUrl: row.qr_code_data_url,
        qrPayload: row.qr_payload,
      }));

    const playerMembers: ApiMember[] = (playersResult.data as RegisterePlayerRow[])
      .filter((row) => Boolean(row.badge_id))
      .map((row) => ({
        key: `player-${row.id}`,
        memberType: "PLAYER",
        registereId: row.registere_id,
        teamName: teamMap.get(row.registere_id) ?? "Unknown Team",
        badgeId: row.badge_id as string,
        fullName: toCleanText(row.full_name, "Unknown Player"),
        title: "PLAYER",
        subtitle: toCleanText(row.position, "Player"),
        photoUrl: row.photo_url,
        qrCodeDataUrl: row.qr_code_data_url,
        qrPayload: row.qr_payload,
      }));

    const members = [...staffMembers, ...playerMembers].sort((a, b) => a.fullName.localeCompare(b.fullName));

    return Response.json(
      {
        members,
        staffCount: staffMembers.length,
        playerCount: playerMembers.length,
        admin: {
          userId: adminAccess.userId,
          email: adminAccess.email,
          fullName: adminAccess.fullName,
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
