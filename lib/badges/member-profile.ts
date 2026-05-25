import { getServiceSupabaseClient } from "@/lib/supabase/server";

type TeamRow = {
  id: string;
  team_name: string | null;
};

type PlayerRow = {
  id: string;
  registere_id: string;
  badge_id: string;
  full_name: string | null;
  position: string | null;
  jersey_number: string | null;
  age: number | null;
  photo_url: string | null;
};

type StaffRow = {
  id: string;
  registere_id: string;
  badge_id: string;
  full_name: string | null;
  role: string | null;
  email: string | null;
  phone_number: string | null;
  photo_url: string | null;
};

type GoalRow = {
  id: string;
  match_id: string;
  team_registere_id: string;
  minute: number | null;
  is_own_goal: boolean;
  created_at: string;
};

type MatchRow = {
  id: string;
  stage: string;
  home_registere_id: string;
  away_registere_id: string;
  kickoff_at: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

type SanctionRow = {
  id: string;
  badge_id: string;
  member_type: "PLAYER" | "STAFF";
  sanction_type: string;
  reason: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

type SupabaseQueryError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

export type PublicMemberGoal = {
  matchId: string;
  minute: number | null;
  stage: string;
  kickoffAt: string | null;
  teamName: string;
  opponentName: string;
  scoreLine: string;
};

export type PublicMemberSanction = {
  id: string;
  sanctionType: string;
  reason: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  notes: string;
  createdAt: string;
};

export type PublicMemberProfile = {
  badgeId: string;
  memberType: "PLAYER" | "STAFF";
  fullName: string;
  teamName: string;
  roleOrPosition: string;
  photoUrl: string | null;
  jerseyNumber: string | null;
  age: number | null;
  email: string | null;
  phoneNumber: string | null;
  goalsCount: number;
  isUnderSanction: boolean;
  sanctions: PublicMemberSanction[];
  goals: PublicMemberGoal[];
};

const toSafeText = (value: string | null | undefined, fallback: string) => {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : fallback;
};

const normalizeBadgeId = (value: string) => value.trim().toUpperCase();

const normalizeErrorCode = (error: SupabaseQueryError | null | undefined) =>
  String(error?.code ?? "")
    .trim()
    .toUpperCase();

const normalizeErrorMessage = (error: SupabaseQueryError | null | undefined) =>
  String(error?.message ?? "").toLowerCase();

const isMissingTableError = (error: SupabaseQueryError | null | undefined) => {
  const code = normalizeErrorCode(error);
  const message = normalizeErrorMessage(error);
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("relation") && message.includes("does not exist")
  );
};

const isMissingColumnError = (error: SupabaseQueryError | null | undefined) => {
  const code = normalizeErrorCode(error);
  const message = normalizeErrorMessage(error);
  return code === "42703" || code === "PGRST204" || (message.includes("column") && message.includes("does not exist"));
};

const isInvalidUuidInputError = (error: SupabaseQueryError | null | undefined) => {
  const code = normalizeErrorCode(error);
  const message = normalizeErrorMessage(error);
  return code === "22P02" && message.includes("uuid");
};

const isDateActive = ({
  startsAt,
  endsAt,
}: {
  startsAt: string | null;
  endsAt: string | null;
}) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (startsAt) {
    const start = new Date(startsAt);
    if (!Number.isNaN(start.getTime()) && start > today) {
      return false;
    }
  }

  if (endsAt) {
    const end = new Date(endsAt);
    if (!Number.isNaN(end.getTime()) && end < today) {
      return false;
    }
  }

  return true;
};

const toPublicSanction = (row: SanctionRow): PublicMemberSanction => ({
  id: row.id,
  sanctionType: toSafeText(row.sanction_type, "SANCTION"),
  reason: toSafeText(row.reason, "No reason provided"),
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  isActive: row.is_active,
  notes: toSafeText(row.notes, ""),
  createdAt: row.created_at,
});

const readSanctions = async ({
  supabase,
  badgeId,
  memberType,
}: {
  supabase: ReturnType<typeof getServiceSupabaseClient>;
  badgeId: string;
  memberType: "PLAYER" | "STAFF";
}) => {
  const sanctionsResult = await supabase
    .from("member_sanctions")
    .select("id, badge_id, member_type, sanction_type, reason, starts_at, ends_at, is_active, notes, created_at")
    .eq("badge_id", badgeId)
    .eq("member_type", memberType)
    .order("created_at", { ascending: false });

  if (sanctionsResult.error) {
    // If the sanctions table/columns are not ready yet, keep scan page functional.
    if (isMissingTableError(sanctionsResult.error) || isMissingColumnError(sanctionsResult.error)) {
      return [];
    }
    throw new Error(`member_sanctions: ${sanctionsResult.error.message}`);
  }

  return ((sanctionsResult.data ?? []) as SanctionRow[]).map(toPublicSanction);
};

export const getPublicMemberProfileByBadgeId = async (
  rawBadgeId: string,
): Promise<PublicMemberProfile | null> => {
  const badgeId = normalizeBadgeId(rawBadgeId);
  if (!badgeId) {
    return null;
  }

  const supabase = getServiceSupabaseClient();

  const playerResult = await supabase
    .from("registere_players")
    .select("id, registere_id, badge_id, full_name, position, jersey_number, age, photo_url")
    .eq("badge_id", badgeId)
    .limit(1);

  let playerRows = (playerResult.data ?? []) as PlayerRow[];
  if (playerResult.error && isMissingColumnError(playerResult.error)) {
    const fallbackResult = await supabase
      .from("registere_players")
      .select("id, registere_id, badge_id, full_name, position, jersey_number, photo_url")
      .eq("badge_id", badgeId)
      .limit(1);

    if (fallbackResult.error) {
      throw new Error(`registere_players: ${fallbackResult.error.message}`);
    }

    playerRows = ((fallbackResult.data ?? []) as Array<{
      id: string;
      registere_id: string;
      badge_id: string;
      full_name: string | null;
      position: string | null;
      jersey_number: string | null;
      photo_url: string | null;
    }>).map((row) => ({
      ...row,
      age: null,
    }));
  } else if (playerResult.error) {
    throw new Error(`registere_players: ${playerResult.error.message}`);
  }

  const player = playerRows[0];

  if (player) {
    const [teamResult, goalsResult, sanctions] = await Promise.all([
      supabase.from("registere").select("id, team_name").eq("id", player.registere_id).limit(1),
      supabase
        .from("tournament_match_goals")
        .select("id, match_id, team_registere_id, minute, is_own_goal, created_at")
        .eq("scorer_player_id", player.id)
        .eq("is_own_goal", false),
      readSanctions({ supabase, badgeId, memberType: "PLAYER" }),
    ]);

    if (teamResult.error) {
      throw new Error(`registere: ${teamResult.error.message}`);
    }
    if (
      goalsResult.error &&
      !isMissingTableError(goalsResult.error) &&
      !isMissingColumnError(goalsResult.error) &&
      !isInvalidUuidInputError(goalsResult.error)
    ) {
      throw new Error(`tournament_match_goals: ${goalsResult.error.message}`);
    }

    const team = ((teamResult.data ?? []) as TeamRow[])[0];
    const goalRows = goalsResult.error ? [] : ((goalsResult.data ?? []) as GoalRow[]);
    const matchIds = Array.from(new Set(goalRows.map((goal) => goal.match_id)));

    let matches: MatchRow[] = [];
    if (matchIds.length > 0) {
      const matchesResult = await supabase
        .from("tournament_matches")
        .select("id, stage, home_registere_id, away_registere_id, kickoff_at, home_score, away_score, status")
        .in("id", matchIds);

      if (
        matchesResult.error &&
        !isMissingTableError(matchesResult.error) &&
        !isMissingColumnError(matchesResult.error)
      ) {
        throw new Error(`tournament_matches: ${matchesResult.error.message}`);
      }

      matches = matchesResult.error ? [] : ((matchesResult.data ?? []) as MatchRow[]);
    }

    const teamIds = new Set<string>([player.registere_id]);
    matches.forEach((match) => {
      teamIds.add(match.home_registere_id);
      teamIds.add(match.away_registere_id);
    });

    let teams: TeamRow[] = [];
    if (teamIds.size > 0) {
      const teamsResult = await supabase.from("registere").select("id, team_name").in("id", Array.from(teamIds));
      if (teamsResult.error) {
        throw new Error(`registere: ${teamsResult.error.message}`);
      }
      teams = (teamsResult.data ?? []) as TeamRow[];
    }

    const teamNameById = new Map<string, string>();
    teams.forEach((entry) => {
      teamNameById.set(entry.id, toSafeText(entry.team_name, "Unknown Team"));
    });

    const matchById = new Map(matches.map((match) => [match.id, match]));

    const goals = goalRows
      .map((goal) => {
        const match = matchById.get(goal.match_id);
        if (!match || match.status !== "PLAYED") {
          return null;
        }

        const isHome = goal.team_registere_id === match.home_registere_id;
        const opponentId = isHome ? match.away_registere_id : match.home_registere_id;
        const teamName = teamNameById.get(goal.team_registere_id) ?? "Unknown Team";
        const opponentName = teamNameById.get(opponentId) ?? "Unknown Team";
        const scoreLine =
          typeof match.home_score === "number" && typeof match.away_score === "number"
            ? `${match.home_score} - ${match.away_score}`
            : "N/A";

        return {
          matchId: match.id,
          minute: goal.minute,
          stage: match.stage,
          kickoffAt: match.kickoff_at,
          teamName,
          opponentName,
          scoreLine,
        } satisfies PublicMemberGoal;
      })
      .filter((goal): goal is PublicMemberGoal => goal !== null)
      .sort((a, b) => {
        const dateA = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
        const dateB = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
        return dateB - dateA;
      });

    const isUnderSanction = sanctions.some(
      (sanction) => sanction.isActive && isDateActive({ startsAt: sanction.startsAt, endsAt: sanction.endsAt }),
    );

    return {
      badgeId,
      memberType: "PLAYER",
      fullName: toSafeText(player.full_name, "Unknown Player"),
      teamName: teamNameById.get(player.registere_id) ?? toSafeText(team?.team_name, "Unknown Team"),
      roleOrPosition: toSafeText(player.position, "Player"),
      photoUrl: player.photo_url,
      jerseyNumber: toSafeText(player.jersey_number, "") || null,
      age: typeof player.age === "number" ? player.age : null,
      email: null,
      phoneNumber: null,
      goalsCount: goals.length,
      isUnderSanction,
      sanctions,
      goals,
    };
  }

  const staffResult = await supabase
    .from("registere_staff")
    .select("id, registere_id, badge_id, full_name, role, email, phone_number, photo_url")
    .eq("badge_id", badgeId)
    .limit(1);

  let staffRows = (staffResult.data ?? []) as StaffRow[];
  if (staffResult.error && isMissingColumnError(staffResult.error)) {
    const fallbackResult = await supabase
      .from("registere_staff")
      .select("id, registere_id, badge_id, full_name, role, photo_url")
      .eq("badge_id", badgeId)
      .limit(1);

    if (fallbackResult.error) {
      throw new Error(`registere_staff: ${fallbackResult.error.message}`);
    }

    staffRows = ((fallbackResult.data ?? []) as Array<{
      id: string;
      registere_id: string;
      badge_id: string;
      full_name: string | null;
      role: string | null;
      photo_url: string | null;
    }>).map((row) => ({
      ...row,
      email: null,
      phone_number: null,
    }));
  } else if (staffResult.error) {
    throw new Error(`registere_staff: ${staffResult.error.message}`);
  }

  const staff = staffRows[0];
  if (!staff) {
    return null;
  }

  const [teamResult, sanctions] = await Promise.all([
    supabase.from("registere").select("id, team_name").eq("id", staff.registere_id).limit(1),
    readSanctions({ supabase, badgeId, memberType: "STAFF" }),
  ]);

  if (teamResult.error) {
    throw new Error(`registere: ${teamResult.error.message}`);
  }

  const team = ((teamResult.data ?? []) as TeamRow[])[0];
  const isUnderSanction = sanctions.some(
    (sanction) => sanction.isActive && isDateActive({ startsAt: sanction.startsAt, endsAt: sanction.endsAt }),
  );

  return {
    badgeId,
    memberType: "STAFF",
    fullName: toSafeText(staff.full_name, "Unknown Staff"),
    teamName: toSafeText(team?.team_name, "Unknown Team"),
    roleOrPosition: toSafeText(staff.role, "Staff"),
    photoUrl: staff.photo_url,
    jerseyNumber: null,
    age: null,
    email: toSafeText(staff.email, "") || null,
    phoneNumber: toSafeText(staff.phone_number, "") || null,
    goalsCount: 0,
    isUnderSanction,
    sanctions,
    goals: [],
  };
};
