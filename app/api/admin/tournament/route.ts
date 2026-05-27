import { verifyAdminAccess } from "@/lib/supabase/admin-access";
import { getBearerToken, getServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type TeamRow = {
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
  badge_id: string | null;
};

type StaffRow = {
  id: number;
  registere_id: string;
  full_name: string | null;
  role: string | null;
  badge_id: string | null;
};

type GroupRow = {
  id: string;
  code: string;
  name: string;
  order_index: number;
};

type GroupEntryRow = {
  id: string;
  group_id: string;
  registere_id: string;
  seed: number | null;
};

type MatchRow = {
  id: string;
  stage: string;
  group_id: string | null;
  round_label: string | null;
  home_registere_id: string;
  away_registere_id: string;
  kickoff_at: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  created_at: string;
};

type GoalRow = {
  id: string;
  match_id: string;
  team_registere_id: string;
  scorer_player_id: string | null;
  minute: number | null;
  is_own_goal: boolean;
  created_at: string;
};

type GroupStandingRow = {
  registereId: string;
  teamName: string;
  seed: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type TopScorerRow = {
  playerId: string;
  fullName: string;
  teamName: string;
  position: string;
  goals: number;
};

type CreateGroupAction = {
  action: "CREATE_GROUP";
  code: string;
  name: string;
  orderIndex?: number | null;
};

type AssignTeamToGroupAction = {
  action: "ASSIGN_TEAM_TO_GROUP";
  groupId: string;
  registereId: string;
  seed?: number | null;
};

type DeleteGroupAction = {
  action: "DELETE_GROUP";
  groupId: string;
};

type DeleteBadgeAction = {
  action: "DELETE_BADGE";
  memberKey: string;
};

type CreateMatchAction = {
  action: "CREATE_MATCH";
  stage: string;
  groupId?: string | null;
  roundLabel?: string | null;
  homeRegistereId: string;
  awayRegistereId: string;
  kickoffAt?: string | null;
  venue?: string | null;
};

type SaveMatchResultGoal = {
  teamRegistereId: string;
  scorerPlayerId?: string | null;
  minute?: number | null;
  isOwnGoal?: boolean;
};

type SaveMatchResultAction = {
  action: "SAVE_MATCH_RESULT";
  matchId: string;
  homeScore: number;
  awayScore: number;
  goals: SaveMatchResultGoal[];
};

type AutoDraw8TeamsAction = {
  action: "AUTO_DRAW_8_TEAMS";
  teamIds: string[];
  clearExisting?: boolean;
};

type UpdateMatchAction = {
  action: "UPDATE_MATCH";
  matchId: string;
  stage?: string;
  groupId?: string | null;
  roundLabel?: string | null;
  homeRegistereId?: string;
  awayRegistereId?: string;
  kickoffAt?: string | null;
  venue?: string | null;
};

type DeleteMatchAction = {
  action: "DELETE_MATCH";
  matchId: string;
};

type PurgeRegistrationsAction = {
  action: "PURGE_REGISTRATIONS";
};

type TournamentAction =
  | CreateGroupAction
  | AssignTeamToGroupAction
  | DeleteGroupAction
  | DeleteBadgeAction
  | CreateMatchAction
  | SaveMatchResultAction
  | AutoDraw8TeamsAction
  | UpdateMatchAction
  | DeleteMatchAction
  | PurgeRegistrationsAction;

const STAGES = new Set([
  "GROUP",
  "ROUND_OF_16",
  "QUARTERFINAL",
  "SEMIFINAL",
  "THIRD_PLACE",
  "FINAL",
]);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toSafeText = (value: string | null | undefined, fallback: string) => {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : fallback;
};

const buildStandings = ({
  groups,
  entries,
  matches,
  teamNameById,
}: {
  groups: GroupRow[];
  entries: GroupEntryRow[];
  matches: MatchRow[];
  teamNameById: Map<string, string>;
}) => {
  const standingsByGroup = new Map<string, Map<string, GroupStandingRow>>();

  groups.forEach((group) => {
    standingsByGroup.set(group.id, new Map<string, GroupStandingRow>());
  });

  entries.forEach((entry) => {
    const groupMap = standingsByGroup.get(entry.group_id);
    if (!groupMap) return;

    groupMap.set(entry.registere_id, {
      registereId: entry.registere_id,
      teamName: teamNameById.get(entry.registere_id) ?? "Unknown Team",
      seed: entry.seed,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  });

  matches
    .filter(
      (match) =>
        match.stage === "GROUP" &&
        !!match.group_id &&
        match.status === "PLAYED" &&
        typeof match.home_score === "number" &&
        typeof match.away_score === "number",
    )
    .forEach((match) => {
      const groupMap = standingsByGroup.get(match.group_id as string);
      if (!groupMap) return;

      const ensureRow = (registereId: string) => {
        const existing = groupMap.get(registereId);
        if (existing) return existing;

        const created: GroupStandingRow = {
          registereId,
          teamName: teamNameById.get(registereId) ?? "Unknown Team",
          seed: null,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };

        groupMap.set(registereId, created);
        return created;
      };

      const home = ensureRow(match.home_registere_id);
      const away = ensureRow(match.away_registere_id);
      const homeScore = match.home_score as number;
      const awayScore = match.away_score as number;

      home.played += 1;
      away.played += 1;

      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (homeScore < awayScore) {
        away.wins += 1;
        away.points += 3;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

  return groups.map((group) => {
    const rows = Array.from((standingsByGroup.get(group.id) ?? new Map()).values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });

    return {
      groupId: group.id,
      groupCode: group.code,
      groupName: group.name,
      teams: rows,
    };
  });
};

const buildTopScorers = ({
  goals,
  matches,
  players,
  teamNameById,
}: {
  goals: GoalRow[];
  matches: MatchRow[];
  players: PlayerRow[];
  teamNameById: Map<string, string>;
}): TopScorerRow[] => {
  const playedMatchById = new Set(
    matches.filter((match) => match.status === "PLAYED").map((match) => match.id),
  );

  const playerById = new Map(players.map((player) => [player.id, player]));
  const scorerMap = new Map<string, TopScorerRow>();

  goals.forEach((goal) => {
    if (goal.scorer_player_id === null || goal.is_own_goal) return;
    if (!playedMatchById.has(goal.match_id)) return;

    const player = playerById.get(goal.scorer_player_id);
    if (!player) return;

    const existing = scorerMap.get(player.id);
    if (existing) {
      existing.goals += 1;
      return;
    }

    scorerMap.set(player.id, {
      playerId: player.id,
      fullName: toSafeText(player.full_name, "Unknown Player"),
      teamName: teamNameById.get(player.registere_id) ?? "Unknown Team",
      position: toSafeText(player.position, "Player"),
      goals: 1,
    });
  });

  return Array.from(scorerMap.values()).sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.fullName.localeCompare(b.fullName);
  });
};

const readTournamentData = async () => {
  const supabase = getServiceSupabaseClient();

  const [teamsResult, playersResult, staffResult, groupsResult, entriesResult, matchesResult, goalsResult] =
    await Promise.all([
    supabase.from("registere").select("id, team_name, club_logo_url"),
    supabase.from("registere_players").select("id, registere_id, full_name, position, jersey_number, badge_id"),
    supabase.from("registere_staff").select("id, registere_id, full_name, role, badge_id"),
    supabase.from("tournament_groups").select("id, code, name, order_index").order("order_index", { ascending: true }),
    supabase
      .from("tournament_group_entries")
      .select("id, group_id, registere_id, seed")
      .order("group_id", { ascending: true })
      .order("seed", { ascending: true, nullsFirst: true }),
    supabase
      .from("tournament_matches")
      .select(
        "id, stage, group_id, round_label, home_registere_id, away_registere_id, kickoff_at, venue, home_score, away_score, status, created_at",
      )
      .order("kickoff_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("tournament_match_goals")
      .select("id, match_id, team_registere_id, scorer_player_id, minute, is_own_goal, created_at")
      .order("created_at", { ascending: true }),
    ]);

  if (teamsResult.error) throw new Error(`registere: ${teamsResult.error.message}`);
  if (playersResult.error) throw new Error(`registere_players: ${playersResult.error.message}`);
  if (staffResult.error) throw new Error(`registere_staff: ${staffResult.error.message}`);
  if (groupsResult.error) throw new Error(`tournament_groups: ${groupsResult.error.message}`);
  if (entriesResult.error) throw new Error(`tournament_group_entries: ${entriesResult.error.message}`);
  if (matchesResult.error) throw new Error(`tournament_matches: ${matchesResult.error.message}`);
  if (goalsResult.error) throw new Error(`tournament_match_goals: ${goalsResult.error.message}`);

  const teams = (teamsResult.data ?? []) as TeamRow[];
  const players = (playersResult.data ?? []) as PlayerRow[];
  const staff = (staffResult.data ?? []) as StaffRow[];
  const groups = (groupsResult.data ?? []) as GroupRow[];
  const entries = (entriesResult.data ?? []) as GroupEntryRow[];
  const matches = (matchesResult.data ?? []) as MatchRow[];
  const goals = (goalsResult.data ?? []) as GoalRow[];

  const teamNameById = new Map<string, string>();
  teams.forEach((team) => {
    teamNameById.set(team.id, toSafeText(team.team_name, "Unknown Team"));
  });

  const standings = buildStandings({
    groups,
    entries,
    matches,
    teamNameById,
  });

  const topScorers = buildTopScorers({
    goals,
    matches,
    players,
    teamNameById,
  });

  return {
    teams: teams.map((team) => ({
      id: team.id,
      teamName: toSafeText(team.team_name, "Unknown Team"),
      logoUrl: isNonEmptyString(team.club_logo_url) ? team.club_logo_url.trim() : null,
    })),
    players: players.map((player) => ({
      id: player.id,
      registereId: player.registere_id,
      teamName: teamNameById.get(player.registere_id) ?? "Unknown Team",
      fullName: toSafeText(player.full_name, "Unknown Player"),
      position: toSafeText(player.position, "Player"),
      jerseyNumber: toSafeText(player.jersey_number, "-"),
      badgeId: player.badge_id,
    })),
    staff: staff.map((member) => ({
      id: String(member.id),
      registereId: member.registere_id,
      teamName: teamNameById.get(member.registere_id) ?? "Unknown Team",
      fullName: toSafeText(member.full_name, "Unknown Staff"),
      role: toSafeText(member.role, "Staff"),
      badgeId: member.badge_id,
    })),
    groups,
    groupEntries: entries,
    matches,
    goals,
    standings,
    topScorers,
  };
};

export async function GET(request: Request) {
  try {
    const adminAccess = await verifyAdminAccess(getBearerToken(request));
    if (!adminAccess.ok) {
      return Response.json({ error: adminAccess.error }, { status: adminAccess.status });
    }

    const data = await readTournamentData();

    return Response.json(
      {
        ...data,
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

const ensurePlayedScore = (value: unknown, label: string) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }

  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }

  return value;
};

export async function POST(request: Request) {
  try {
    const adminAccess = await verifyAdminAccess(getBearerToken(request));
    if (!adminAccess.ok) {
      return Response.json({ error: adminAccess.error }, { status: adminAccess.status });
    }

    const payload = (await request.json()) as TournamentAction;
    const supabase = getServiceSupabaseClient();

    if (!payload || typeof payload !== "object" || !("action" in payload)) {
      return Response.json({ error: "Invalid payload." }, { status: 400 });
    }

    if (payload.action === "CREATE_GROUP") {
      if (!isNonEmptyString(payload.code) || !isNonEmptyString(payload.name)) {
        return Response.json({ error: "Group code and name are required." }, { status: 400 });
      }

      const orderIndex =
        typeof payload.orderIndex === "number" && Number.isFinite(payload.orderIndex)
          ? Math.max(1, Math.trunc(payload.orderIndex))
          : 1;

      const { error } = await supabase.from("tournament_groups").insert({
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        order_index: orderIndex,
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "ASSIGN_TEAM_TO_GROUP") {
      if (!isNonEmptyString(payload.groupId) || !isNonEmptyString(payload.registereId)) {
        return Response.json({ error: "groupId and registereId are required." }, { status: 400 });
      }

      const seed =
        typeof payload.seed === "number" && Number.isFinite(payload.seed)
          ? Math.max(1, Math.trunc(payload.seed))
          : null;

      const { error } = await supabase.from("tournament_group_entries").upsert(
        {
          group_id: payload.groupId.trim(),
          registere_id: payload.registereId.trim(),
          seed,
        },
        { onConflict: "registere_id" },
      );

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "DELETE_GROUP") {
      if (!isNonEmptyString(payload.groupId)) {
        return Response.json({ error: "groupId is required." }, { status: 400 });
      }

      const groupId = payload.groupId.trim();

      const { data: matches, error: matchesError } = await supabase
        .from("tournament_matches")
        .select("id")
        .eq("group_id", groupId);

      if (matchesError) {
        return Response.json({ error: matchesError.message }, { status: 400 });
      }

      const matchIds = (matches ?? [])
        .map((row) => (typeof row.id === "string" ? row.id : ""))
        .filter((id) => id.length > 0);

      if (matchIds.length > 0) {
        const { error: goalsError } = await supabase
          .from("tournament_match_goals")
          .delete()
          .in("match_id", matchIds);

        if (goalsError) {
          return Response.json({ error: goalsError.message }, { status: 400 });
        }

        const { error: deleteMatchesError } = await supabase
          .from("tournament_matches")
          .delete()
          .eq("group_id", groupId);

        if (deleteMatchesError) {
          return Response.json({ error: deleteMatchesError.message }, { status: 400 });
        }
      }

      const { error: entriesError } = await supabase
        .from("tournament_group_entries")
        .delete()
        .eq("group_id", groupId);

      if (entriesError) {
        return Response.json({ error: entriesError.message }, { status: 400 });
      }

      const { error: groupError } = await supabase
        .from("tournament_groups")
        .delete()
        .eq("id", groupId);

      if (groupError) {
        return Response.json({ error: groupError.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "DELETE_BADGE") {
      if (!isNonEmptyString(payload.memberKey)) {
        return Response.json({ error: "memberKey is required." }, { status: 400 });
      }

      const match = payload.memberKey.trim().match(/^(staff|player)-(\d+)$/i);
      if (!match) {
        return Response.json({ error: "Invalid memberKey format." }, { status: 400 });
      }

      const memberType = match[1].toLowerCase();
      const memberId = Number.parseInt(match[2], 10);
      if (!Number.isFinite(memberId) || memberId <= 0) {
        return Response.json({ error: "Invalid member id." }, { status: 400 });
      }

      const tableName = memberType === "staff" ? "registere_staff" : "registere_players";
      const { error } = await supabase
        .from(tableName)
        .update({ badge_id: null, qr_code_data_url: null, qr_payload: null })
        .eq("id", memberId);

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "CREATE_MATCH") {
      if (!STAGES.has(payload.stage)) {
        return Response.json({ error: "Invalid stage value." }, { status: 400 });
      }

      if (!isNonEmptyString(payload.homeRegistereId) || !isNonEmptyString(payload.awayRegistereId)) {
        return Response.json({ error: "Home and away teams are required." }, { status: 400 });
      }

      if (payload.homeRegistereId.trim() === payload.awayRegistereId.trim()) {
        return Response.json({ error: "A match must have two different teams." }, { status: 400 });
      }

      const isGroupMatch = payload.stage === "GROUP";
      if (isGroupMatch && !isNonEmptyString(payload.groupId ?? "")) {
        return Response.json({ error: "groupId is required for GROUP stage." }, { status: 400 });
      }

      const { error } = await supabase.from("tournament_matches").insert({
        stage: payload.stage,
        group_id: isGroupMatch ? payload.groupId?.trim() ?? null : null,
        round_label: payload.roundLabel?.trim() || null,
        home_registere_id: payload.homeRegistereId.trim(),
        away_registere_id: payload.awayRegistereId.trim(),
        kickoff_at: payload.kickoffAt?.trim() || null,
        venue: payload.venue?.trim() || null,
        status: "SCHEDULED",
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "AUTO_DRAW_8_TEAMS") {
      const rawTeamIds = Array.isArray(payload.teamIds) ? payload.teamIds : [];
      const teamIds = Array.from(
        new Set(rawTeamIds.filter((value): value is string => isNonEmptyString(value)).map((value) => value.trim())),
      );

      if (teamIds.length !== 8) {
        return Response.json({ error: "Exactly 8 unique teams are required for this draw." }, { status: 400 });
      }

      const { data, error } = await supabase.rpc("run_tournament_draw_8", {
        p_team_ids: teamIds,
        p_created_by: adminAccess.userId,
        p_clear_existing: payload.clearExisting !== false,
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true, drawId: data }, { status: 200 });
    }

    if (payload.action === "SAVE_MATCH_RESULT") {
      if (!isNonEmptyString(payload.matchId)) {
        return Response.json({ error: "matchId is required." }, { status: 400 });
      }

      const homeScore = ensurePlayedScore(payload.homeScore, "homeScore");
      const awayScore = ensurePlayedScore(payload.awayScore, "awayScore");

      const { data: matchRow, error: matchError } = await supabase
        .from("tournament_matches")
        .select("id, home_registere_id, away_registere_id")
        .eq("id", payload.matchId.trim())
        .maybeSingle();

      if (matchError) {
        return Response.json({ error: matchError.message }, { status: 400 });
      }

      if (!matchRow) {
        return Response.json({ error: "Match not found." }, { status: 404 });
      }

      const match = matchRow as {
        id: string;
        home_registere_id: string;
        away_registere_id: string;
      };

      const validTeamIds = new Set([match.home_registere_id, match.away_registere_id]);
      const goals = Array.isArray(payload.goals) ? payload.goals : [];

      for (const goal of goals) {
        if (!isNonEmptyString(goal.teamRegistereId) || !validTeamIds.has(goal.teamRegistereId.trim())) {
          return Response.json({ error: "Goal has invalid teamRegistereId." }, { status: 400 });
        }

        if (
          goal.minute !== undefined &&
          goal.minute !== null &&
          (typeof goal.minute !== "number" || !Number.isFinite(goal.minute) || goal.minute < 0 || goal.minute > 130)
        ) {
          return Response.json({ error: "Goal minute must be between 0 and 130." }, { status: 400 });
        }
      }

      const { error: matchUpdateError } = await supabase
        .from("tournament_matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: "PLAYED",
        })
        .eq("id", match.id);

      if (matchUpdateError) {
        return Response.json({ error: matchUpdateError.message }, { status: 400 });
      }

      const { error: deleteGoalsError } = await supabase
        .from("tournament_match_goals")
        .delete()
        .eq("match_id", match.id);

      if (deleteGoalsError) {
        return Response.json({ error: deleteGoalsError.message }, { status: 400 });
      }

      if (goals.length > 0) {
        const rows = goals.map((goal) => ({
          match_id: match.id,
          team_registere_id: goal.teamRegistereId.trim(),
          scorer_player_id: isNonEmptyString(goal.scorerPlayerId) ? goal.scorerPlayerId.trim() : null,
          minute: typeof goal.minute === "number" ? Math.trunc(goal.minute) : null,
          is_own_goal: Boolean(goal.isOwnGoal),
        }));

        const { error: insertGoalsError } = await supabase.from("tournament_match_goals").insert(rows);

        if (insertGoalsError) {
          return Response.json({ error: insertGoalsError.message }, { status: 400 });
        }
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "UPDATE_MATCH") {
      if (!isNonEmptyString(payload.matchId)) {
        return Response.json({ error: "matchId is required." }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {};

      if (payload.stage !== undefined) {
        if (!STAGES.has(payload.stage)) {
          return Response.json({ error: "Invalid stage value." }, { status: 400 });
        }
        updateData.stage = payload.stage;
        if (payload.stage !== "GROUP") updateData.group_id = null;
      }

      if (payload.groupId !== undefined) {
        updateData.group_id = isNonEmptyString(payload.groupId) ? payload.groupId.trim() : null;
      }

      if (payload.roundLabel !== undefined) {
        updateData.round_label = isNonEmptyString(payload.roundLabel) ? payload.roundLabel.trim() : null;
      }

      if (payload.homeRegistereId !== undefined) {
        if (!isNonEmptyString(payload.homeRegistereId)) {
          return Response.json({ error: "homeRegistereId cannot be empty." }, { status: 400 });
        }
        updateData.home_registere_id = payload.homeRegistereId.trim();
      }

      if (payload.awayRegistereId !== undefined) {
        if (!isNonEmptyString(payload.awayRegistereId)) {
          return Response.json({ error: "awayRegistereId cannot be empty." }, { status: 400 });
        }
        updateData.away_registere_id = payload.awayRegistereId.trim();
      }

      if (payload.kickoffAt !== undefined) {
        updateData.kickoff_at = isNonEmptyString(payload.kickoffAt) ? payload.kickoffAt.trim() : null;
      }

      if (payload.venue !== undefined) {
        updateData.venue = isNonEmptyString(payload.venue) ? payload.venue.trim() : null;
      }

      if (Object.keys(updateData).length === 0) {
        return Response.json({ error: "No fields to update." }, { status: 400 });
      }

      const { error } = await supabase
        .from("tournament_matches")
        .update(updateData)
        .eq("id", payload.matchId.trim());

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "DELETE_MATCH") {
      if (!isNonEmptyString(payload.matchId)) {
        return Response.json({ error: "matchId is required." }, { status: 400 });
      }

      const matchId = payload.matchId.trim();

      const { error: goalsError } = await supabase
        .from("tournament_match_goals")
        .delete()
        .eq("match_id", matchId);

      if (goalsError) {
        return Response.json({ error: goalsError.message }, { status: 400 });
      }

      const { error } = await supabase
        .from("tournament_matches")
        .delete()
        .eq("id", matchId);

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    if (payload.action === "PURGE_REGISTRATIONS") {
      const tableOrder = [
        "tournament_match_goals",
        "tournament_matches",
        "tournament_group_entries",
        "tournament_groups",
        "registere_players",
        "registere_staff",
        "registere",
      ] as const;

      for (const tableName of tableOrder) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .not("id", "is", null);

        if (error) {
          return Response.json(
            { error: `Failed to purge ${tableName}: ${error.message}` },
            { status: 400 },
          );
        }
      }

      return Response.json({ ok: true }, { status: 200 });
    }

    return Response.json({ error: "Unsupported admin action." }, { status: 400 });
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
