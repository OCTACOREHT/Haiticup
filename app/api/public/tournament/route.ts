import { getServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type TeamRow = {
  id: string;
  team_name: string | null;
  club_logo_url: string | null;
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

export async function GET() {
  try {
    const supabase = getServiceSupabaseClient();

    const [teamsResult, groupsResult, entriesResult, matchesResult] = await Promise.all([
      supabase.from("registere").select("id, team_name, club_logo_url"),
      supabase.from("tournament_groups").select("id, code, name, order_index").order("order_index", { ascending: true }),
      supabase.from("tournament_group_entries").select("id, group_id, registere_id, seed"),
      supabase
        .from("tournament_matches")
        .select("id, stage, group_id, round_label, home_registere_id, away_registere_id, kickoff_at, venue, home_score, away_score, status, created_at")
        .order("kickoff_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
    ]);

    if (teamsResult.error) throw new Error(`registere: ${teamsResult.error.message}`);
    if (groupsResult.error) throw new Error(`tournament_groups: ${groupsResult.error.message}`);
    if (entriesResult.error) throw new Error(`tournament_group_entries: ${entriesResult.error.message}`);
    if (matchesResult.error) throw new Error(`tournament_matches: ${matchesResult.error.message}`);

    const teams = (teamsResult.data ?? []) as TeamRow[];
    const groups = (groupsResult.data ?? []) as GroupRow[];
    const entries = (entriesResult.data ?? []) as GroupEntryRow[];
    const matches = (matchesResult.data ?? []) as MatchRow[];

    const teamNameById = new Map<string, string>();
    teams.forEach((t) => {
      teamNameById.set(t.id, t.team_name ?? "Unknown Team");
    });

    const standings = buildStandings({
      groups,
      entries,
      matches,
      teamNameById,
    });

    return Response.json(
      {
        teams: teams.map(t => ({
          id: t.id,
          teamName: t.team_name ?? "Unknown Team",
          logoUrl: t.club_logo_url?.trim() || null,
        })),
        groups,
        groupEntries: entries,
        matches,
        standings,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
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
