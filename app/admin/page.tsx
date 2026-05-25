"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  CommandIcon,
  FileChartColumnIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSupabaseClient } from "@/lib/supabase/client";

type Team = {
  id: string;
  teamName: string;
};

type Player = {
  id: string;
  registereId: string;
  teamName: string;
  fullName: string;
  position: string;
  jerseyNumber: string;
  badgeId: string | null;
};

type Group = {
  id: string;
  code: string;
  name: string;
  order_index: number;
};

type Match = {
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

type Goal = {
  id: string;
  match_id: string;
  team_registere_id: string;
  scorer_player_id: string | null;
  minute: number | null;
  is_own_goal: boolean;
  created_at: string;
};

type StandingTeam = {
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

type StandingGroup = {
  groupId: string;
  groupCode: string;
  groupName: string;
  teams: StandingTeam[];
};

type TopScorer = {
  playerId: string;
  fullName: string;
  teamName: string;
  position: string;
  goals: number;
};

type TournamentResponse = {
  teams: Team[];
  players: Player[];
  groups: Group[];
  matches: Match[];
  goals: Goal[];
  standings: StandingGroup[];
  topScorers: TopScorer[];
  admin?: {
    userId: string;
    email: string;
    fullName: string;
  };
  error?: string;
};

type AdminBadgeMember = {
  key: string;
  memberType: "STAFF" | "PLAYER";
  registereId: string;
  teamName: string;
  fullName: string;
  title: string;
  subtitle: string;
  badgeId: string;
};

type MembersApiResponse = {
  members: AdminBadgeMember[];
  staffCount: number;
  playerCount: number;
  error?: string;
};

type StatusTone = "info" | "success" | "error";

type GoalInputRow = {
  id: string;
  teamRegistereId: string;
  scorerPlayerId: string;
  minute: string;
  isOwnGoal: boolean;
};

type AdminSection = "overview" | "poules" | "matches" | "results" | "players" | "badges" | "scorers";

const stageOptions = ["GROUP", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "THIRD_PLACE", "FINAL"];

const sectionItems: Array<{ id: AdminSection; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboardIcon /> },
  { id: "poules", label: "Poules", icon: <ListIcon /> },
  { id: "matches", label: "Match Schedule", icon: <ListIcon /> },
  { id: "results", label: "Result Match", icon: <ChartBarIcon /> },
  { id: "players", label: "Joueur", icon: <UsersIcon /> },
  { id: "badges", label: "Badges", icon: <FileTextIcon /> },
  { id: "scorers", label: "Meilleurs Buteurs", icon: <FileChartColumnIcon /> },
];

const toIsoFromLocal = (value: string) => {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const createGoalInputRow = (): GoalInputRow => ({
  id: crypto.randomUUID(),
  teamRegistereId: "",
  scorerPlayerId: "",
  minute: "",
  isOwnGoal: false,
});

function LoadingButton({
  isLoading,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & { isLoading?: boolean }) {
  return (
    <Button {...props} disabled={Boolean(disabled) || Boolean(isLoading)}>
      {isLoading ? <span className="mr-2 size-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </Button>
  );
}

const selectClassName =
  "flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60";

export default function AdminPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [adminName, setAdminName] = useState("");
  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [badgeMembers, setBadgeMembers] = useState<AdminBadgeMember[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [badgeMemberKey, setBadgeMemberKey] = useState("");

  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupOrder, setGroupOrder] = useState("1");

  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignSeed, setAssignSeed] = useState("");

  const [matchStage, setMatchStage] = useState("GROUP");
  const [matchGroupId, setMatchGroupId] = useState("");
  const [matchRoundLabel, setMatchRoundLabel] = useState("");
  const [matchHomeId, setMatchHomeId] = useState("");
  const [matchAwayId, setMatchAwayId] = useState("");
  const [matchKickoffLocal, setMatchKickoffLocal] = useState("");
  const [matchVenue, setMatchVenue] = useState("");

  const [resultMatchId, setResultMatchId] = useState("");
  const [resultHomeScore, setResultHomeScore] = useState("0");
  const [resultAwayScore, setResultAwayScore] = useState("0");
  const [goalRows, setGoalRows] = useState<GoalInputRow[]>([]);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    (tournament?.teams ?? []).forEach((team) => {
      map.set(team.id, team.teamName);
    });
    return map;
  }, [tournament?.teams]);

  const selectedBadgeMember = useMemo(
    () => badgeMembers.find((member) => member.key === badgeMemberKey) ?? null,
    [badgeMemberKey, badgeMembers],
  );

  const defaultGroupId = tournament?.groups[0]?.id ?? "";
  const defaultTeamId = tournament?.teams[0]?.id ?? "";
  const defaultAwayTeamId = tournament?.teams[1]?.id ?? defaultTeamId;
  const defaultMatchId =
    tournament?.matches.find((match) => match.status !== "PLAYED")?.id ?? tournament?.matches[0]?.id ?? "";

  const effectiveAssignGroupId = assignGroupId || defaultGroupId;
  const effectiveAssignTeamId = assignTeamId || defaultTeamId;
  const effectiveMatchGroupId = matchGroupId || defaultGroupId;
  const effectiveMatchHomeId = matchHomeId || defaultTeamId;
  const effectiveMatchAwayId = matchAwayId || defaultAwayTeamId;
  const effectiveResultMatchId = resultMatchId || defaultMatchId;

  const selectedResultMatch = useMemo(
    () => (tournament?.matches ?? []).find((match) => match.id === effectiveResultMatchId) ?? null,
    [effectiveResultMatchId, tournament?.matches],
  );

  const syncResultFormFromTournament = useCallback((source: TournamentResponse | null, matchId: string) => {
    if (!source) {
      setGoalRows([]);
      setResultHomeScore("0");
      setResultAwayScore("0");
      return;
    }

    const match = source.matches.find((item) => item.id === matchId);
    if (!match) {
      setGoalRows([]);
      setResultHomeScore("0");
      setResultAwayScore("0");
      return;
    }

    setResultHomeScore(String(match.home_score ?? 0));
    setResultAwayScore(String(match.away_score ?? 0));

    const rows = source.goals
      .filter((goal) => goal.match_id === matchId)
      .map((goal) => ({
        id: crypto.randomUUID(),
        teamRegistereId: goal.team_registere_id,
        scorerPlayerId: goal.scorer_player_id ?? "",
        minute: goal.minute === null ? "" : String(goal.minute),
        isOwnGoal: goal.is_own_goal,
      }));

    setGoalRows(rows);
  }, []);

  const loadData = useCallback(
    async (token: string, options?: { quiet?: boolean }) => {
      if (!options?.quiet) {
        setStatusMessage("Loading admin data...");
        setStatusTone("info");
      }

      const [tournamentResponse, membersResponse] = await Promise.all([
        fetch("/api/admin/tournament", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
        fetch("/api/members", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
      ]);

      if (tournamentResponse.status === 401 || tournamentResponse.status === 403) {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        router.replace("/admin/login?next=/admin");
        return;
      }

      const tournamentPayload = (await tournamentResponse.json().catch(() => null)) as TournamentResponse | null;
      const membersPayload = (await membersResponse.json().catch(() => null)) as MembersApiResponse | null;

      if (!tournamentResponse.ok) {
        throw new Error(tournamentPayload?.error || "Failed to load tournament data.");
      }

      if (!membersResponse.ok) {
        throw new Error(membersPayload?.error || "Failed to load badge members.");
      }

      const safeTournament = tournamentPayload ?? {
        teams: [],
        players: [],
        groups: [],
        matches: [],
        goals: [],
        standings: [],
        topScorers: [],
      };

      const safeBadgeMembers = membersPayload?.members ?? [];

      setTournament(safeTournament);
      setAdminName(safeTournament.admin?.fullName ?? safeTournament.admin?.email ?? "Admin");
      setBadgeMembers(safeBadgeMembers);
      setStaffCount(membersPayload?.staffCount ?? 0);
      setPlayerCount(membersPayload?.playerCount ?? 0);

      const nextDefaultGroupId = safeTournament.groups[0]?.id ?? "";
      const nextDefaultTeamId = safeTournament.teams[0]?.id ?? "";
      const nextDefaultAwayTeamId = safeTournament.teams[1]?.id ?? nextDefaultTeamId;
      const nextDefaultMatchId =
        safeTournament.matches.find((match) => match.status !== "PLAYED")?.id ?? safeTournament.matches[0]?.id ?? "";

      setAssignGroupId((current) => {
        if (current && safeTournament.groups.some((group) => group.id === current)) return current;
        return nextDefaultGroupId;
      });

      setAssignTeamId((current) => {
        if (current && safeTournament.teams.some((team) => team.id === current)) return current;
        return nextDefaultTeamId;
      });

      setMatchGroupId((current) => {
        if (current && safeTournament.groups.some((group) => group.id === current)) return current;
        return nextDefaultGroupId;
      });

      setMatchHomeId((current) => {
        if (current && safeTournament.teams.some((team) => team.id === current)) return current;
        return nextDefaultTeamId;
      });

      setMatchAwayId((current) => {
        if (current && safeTournament.teams.some((team) => team.id === current)) return current;
        return nextDefaultAwayTeamId;
      });

      const currentResultExists = resultMatchId && safeTournament.matches.some((match) => match.id === resultMatchId);
      const nextResultMatchId = currentResultExists ? resultMatchId : nextDefaultMatchId;
      setResultMatchId(nextResultMatchId);
      syncResultFormFromTournament(safeTournament, nextResultMatchId);

      setBadgeMemberKey((current) => {
        if (current && safeBadgeMembers.some((member) => member.key === current)) return current;
        return safeBadgeMembers[0]?.key ?? "";
      });

      if (!options?.quiet) {
        setStatusMessage(null);
      }
    },
    [resultMatchId, router, syncResultFormFromTournament],
  );

  useEffect(() => {
    let active = true;

    const boot = async () => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.replace("/admin/login?next=/admin");
          return;
        }

        if (!active) return;

        setAccessToken(session.access_token);
        await loadData(session.access_token);
      } catch (error: unknown) {
        if (!active) return;
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unable to load admin panel.";
        setStatusMessage(message);
        setStatusTone("error");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void boot();
    return () => {
      active = false;
    };
  }, [loadData, router]);

  const postTournamentAction = async (payload: Record<string, unknown>, successMessage: string) => {
    if (!accessToken) {
      setStatusMessage("No active admin session.");
      setStatusTone("error");
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving...");
    setStatusTone("info");

    try {
      const response = await fetch("/api/admin/tournament", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error || "Request failed.");
      }

      await loadData(accessToken, { quiet: true });
      setStatusMessage(successMessage);
      setStatusTone("success");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Action failed.";
      setStatusMessage(message);
      setStatusTone("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    try {
      await loadData(accessToken);
    } catch {
      // Handled in loadData caller status.
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await postTournamentAction(
      {
        action: "CREATE_GROUP",
        code: groupCode,
        name: groupName,
        orderIndex: Number(groupOrder) || 1,
      },
      "Group created successfully.",
    );
    setGroupCode("");
    setGroupName("");
    setGroupOrder("1");
  };

  const handleAssignTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await postTournamentAction(
      {
        action: "ASSIGN_TEAM_TO_GROUP",
        groupId: effectiveAssignGroupId,
        registereId: effectiveAssignTeamId,
        seed: assignSeed.trim() ? Number(assignSeed) : null,
      },
      "Team assigned to group.",
    );
  };

  const handleCreateMatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await postTournamentAction(
      {
        action: "CREATE_MATCH",
        stage: matchStage,
        groupId: matchStage === "GROUP" ? effectiveMatchGroupId : null,
        roundLabel: matchRoundLabel || null,
        homeRegistereId: effectiveMatchHomeId,
        awayRegistereId: effectiveMatchAwayId,
        kickoffAt: toIsoFromLocal(matchKickoffLocal),
        venue: matchVenue || null,
      },
      "Match created successfully.",
    );
    setMatchRoundLabel("");
    setMatchKickoffLocal("");
    setMatchVenue("");
  };

  const handleSaveResult = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const goalsPayload = goalRows
      .filter((row) => row.teamRegistereId.trim().length > 0)
      .map((row) => ({
        teamRegistereId: row.teamRegistereId,
        scorerPlayerId: row.scorerPlayerId || null,
        minute: row.minute.trim() ? Number(row.minute) : null,
        isOwnGoal: row.isOwnGoal,
      }));

    await postTournamentAction(
      {
        action: "SAVE_MATCH_RESULT",
        matchId: effectiveResultMatchId,
        homeScore: Number(resultHomeScore),
        awayScore: Number(resultAwayScore),
        goals: goalsPayload,
      },
      "Match result saved and standings updated.",
    );
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login?next=/admin");
  };

  const statusToneClass =
    statusTone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : statusTone === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-blue-200 bg-blue-50 text-blue-800";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Admin Panel</CardTitle>
            <CardDescription>Please wait while we connect to your tournament data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="mr-2 size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Initializing...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3.25rem",
        } as React.CSSProperties
      }
    >
      <Sidebar variant="inset" collapsible="offcanvas">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CommandIcon className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Granpanpan Nations Cup</p>
              <p className="text-sm font-semibold">Admin Console</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {sectionItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton isActive={activeSection === item.id} onClick={() => setActiveSection(item.id)}>
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="space-y-2 px-2 pb-2">
            <p className="text-xs text-muted-foreground">Connected as</p>
            <p className="truncate text-sm font-medium">{adminName || "Admin"}</p>
            <LoadingButton variant="outline" className="w-full" onClick={handleLogout}>
              Logout
            </LoadingButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-[var(--header-height)] items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold md:text-base">
              {sectionItems.find((section) => section.id === activeSection)?.label ?? "Dashboard"}
            </h1>
          </div>
          <LoadingButton variant="outline" isLoading={isRefreshing} onClick={handleRefresh}>
            Refresh
          </LoadingButton>
        </header>

        <main className="space-y-4 p-4 md:p-6">
          {statusMessage ? (
            <Card className={statusToneClass}>
              <CardContent className="pt-4 text-sm">{statusMessage}</CardContent>
            </Card>
          ) : null}

          {activeSection === "overview" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Teams</CardDescription>
                    <CardTitle>{tournament?.teams.length ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Joueurs</CardDescription>
                    <CardTitle>{tournament?.players.length ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Groups</CardDescription>
                    <CardTitle>{tournament?.groups.length ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Matches</CardDescription>
                    <CardTitle>{tournament?.matches.length ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Staff Badges</CardDescription>
                    <CardTitle>{staffCount}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Player Badges</CardDescription>
                    <CardTitle>{playerCount}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Matches</CardTitle>
                  <CardDescription>Latest fixtures and scores.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b bg-muted/50 text-muted-foreground uppercase">
                      <tr>
                        <th className="px-2 py-2">Stage</th>
                        <th className="px-2 py-2">Match</th>
                        <th className="px-2 py-2">Kickoff</th>
                        <th className="px-2 py-2">Score</th>
                        <th className="px-2 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tournament?.matches ?? []).slice(0, 8).map((match) => (
                        <tr key={match.id} className="border-b">
                          <td className="px-2 py-2">{match.stage}</td>
                          <td className="px-2 py-2 font-medium">
                            {(teamNameById.get(match.home_registere_id) ?? "Home")} vs{" "}
                            {teamNameById.get(match.away_registere_id) ?? "Away"}
                          </td>
                          <td className="px-2 py-2">{formatDateTime(match.kickoff_at)}</td>
                          <td className="px-2 py-2">
                            {typeof match.home_score === "number" && typeof match.away_score === "number"
                              ? `${match.home_score} - ${match.away_score}`
                              : "-"}
                          </td>
                          <td className="px-2 py-2">
                            <Badge variant={match.status === "PLAYED" ? "secondary" : "outline"}>{match.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === "poules" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGroup} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="group-code">Group code</Label>
                      <Input id="group-code" value={groupCode} onChange={(e) => setGroupCode(e.target.value)} placeholder="A" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="group-name">Group name</Label>
                      <Input
                        id="group-name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Poule A"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="group-order">Order index</Label>
                      <Input
                        id="group-order"
                        type="number"
                        min={1}
                        value={groupOrder}
                        onChange={(e) => setGroupOrder(e.target.value)}
                        required
                      />
                    </div>
                    <LoadingButton type="submit" isLoading={isSaving}>
                      Add Group
                    </LoadingButton>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assign Team To Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignTeam} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="assign-group">Group</Label>
                      <select id="assign-group" className={selectClassName} value={effectiveAssignGroupId} onChange={(e) => setAssignGroupId(e.target.value)} required>
                        {(tournament?.groups ?? []).map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.code} - {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="assign-team">Team</Label>
                      <select id="assign-team" className={selectClassName} value={effectiveAssignTeamId} onChange={(e) => setAssignTeamId(e.target.value)} required>
                        {(tournament?.teams ?? []).map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="assign-seed">Seed (optional)</Label>
                      <Input id="assign-seed" value={assignSeed} onChange={(e) => setAssignSeed(e.target.value)} />
                    </div>
                    <LoadingButton type="submit" isLoading={isSaving}>
                      Save Assignment
                    </LoadingButton>
                  </form>
                </CardContent>
              </Card>

              {(tournament?.standings ?? []).map((groupStanding) => (
                <Card key={groupStanding.groupId} className="xl:col-span-1">
                  <CardHeader>
                    <CardTitle>
                      {groupStanding.groupCode} - {groupStanding.groupName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b bg-muted/50 text-muted-foreground uppercase">
                        <tr>
                          <th className="px-2 py-2">Team</th>
                          <th className="px-2 py-2 text-center">Pts</th>
                          <th className="px-2 py-2 text-center">J</th>
                          <th className="px-2 py-2 text-center">G</th>
                          <th className="px-2 py-2 text-center">N</th>
                          <th className="px-2 py-2 text-center">P</th>
                          <th className="px-2 py-2 text-center">GF</th>
                          <th className="px-2 py-2 text-center">GA</th>
                          <th className="px-2 py-2 text-center">GD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStanding.teams.map((team) => (
                          <tr key={team.registereId} className="border-b">
                            <td className="px-2 py-2 font-medium">{team.teamName}</td>
                            <td className="px-2 py-2 text-center font-semibold">{team.points}</td>
                            <td className="px-2 py-2 text-center">{team.played}</td>
                            <td className="px-2 py-2 text-center">{team.wins}</td>
                            <td className="px-2 py-2 text-center">{team.draws}</td>
                            <td className="px-2 py-2 text-center">{team.losses}</td>
                            <td className="px-2 py-2 text-center">{team.goalsFor}</td>
                            <td className="px-2 py-2 text-center">{team.goalsAgainst}</td>
                            <td className="px-2 py-2 text-center">{team.goalDifference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {activeSection === "matches" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Match</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateMatch} className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="match-stage">Stage</Label>
                      <select id="match-stage" className={selectClassName} value={matchStage} onChange={(e) => setMatchStage(e.target.value)} required>
                        {stageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="match-group">Group (GROUP only)</Label>
                      <select
                        id="match-group"
                        className={selectClassName}
                        value={effectiveMatchGroupId}
                        onChange={(e) => setMatchGroupId(e.target.value)}
                        disabled={matchStage !== "GROUP"}
                      >
                        {(tournament?.groups ?? []).map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.code} - {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="match-round">Round label</Label>
                      <Input id="match-round" value={matchRoundLabel} onChange={(e) => setMatchRoundLabel(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="match-kickoff">Kickoff</Label>
                      <Input
                        id="match-kickoff"
                        type="datetime-local"
                        value={matchKickoffLocal}
                        onChange={(e) => setMatchKickoffLocal(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="match-home">Home team</Label>
                      <select id="match-home" className={selectClassName} value={effectiveMatchHomeId} onChange={(e) => setMatchHomeId(e.target.value)} required>
                        {(tournament?.teams ?? []).map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="match-away">Away team</Label>
                      <select id="match-away" className={selectClassName} value={effectiveMatchAwayId} onChange={(e) => setMatchAwayId(e.target.value)} required>
                        {(tournament?.teams ?? []).map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor="match-venue">Venue</Label>
                      <Input id="match-venue" value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} />
                    </div>
                    <div className="lg:col-span-2">
                      <LoadingButton type="submit" isLoading={isSaving}>
                        Add Match
                      </LoadingButton>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Match Schedule</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b bg-muted/50 text-muted-foreground uppercase">
                      <tr>
                        <th className="px-2 py-2">Stage</th>
                        <th className="px-2 py-2">Match</th>
                        <th className="px-2 py-2">Kickoff</th>
                        <th className="px-2 py-2">Venue</th>
                        <th className="px-2 py-2">Score</th>
                        <th className="px-2 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tournament?.matches ?? []).map((match) => (
                        <tr key={match.id} className="border-b">
                          <td className="px-2 py-2">{match.stage}</td>
                          <td className="px-2 py-2 font-medium">
                            {(teamNameById.get(match.home_registere_id) ?? "Home")} vs{" "}
                            {teamNameById.get(match.away_registere_id) ?? "Away"}
                          </td>
                          <td className="px-2 py-2">{formatDateTime(match.kickoff_at)}</td>
                          <td className="px-2 py-2">{match.venue || "-"}</td>
                          <td className="px-2 py-2">
                            {typeof match.home_score === "number" && typeof match.away_score === "number"
                              ? `${match.home_score} - ${match.away_score}`
                              : "-"}
                          </td>
                          <td className="px-2 py-2">
                            <Badge variant={match.status === "PLAYED" ? "secondary" : "outline"}>{match.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === "results" ? (
            <Card>
              <CardHeader>
                <CardTitle>Result Match</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveResult} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="result-match">Match</Label>
                    <select
                      id="result-match"
                      className={selectClassName}
                      value={effectiveResultMatchId}
                      onChange={(e) => {
                        const nextMatchId = e.target.value;
                        setResultMatchId(nextMatchId);
                        syncResultFormFromTournament(tournament, nextMatchId);
                      }}
                      required
                    >
                      {(tournament?.matches ?? []).map((match) => (
                        <option key={match.id} value={match.id}>
                          {match.stage} - {(teamNameById.get(match.home_registere_id) ?? "Home")} vs{" "}
                          {teamNameById.get(match.away_registere_id) ?? "Away"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedResultMatch ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>{teamNameById.get(selectedResultMatch.home_registere_id) ?? "Home"} score</Label>
                        <Input type="number" min={0} value={resultHomeScore} onChange={(e) => setResultHomeScore(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <Label>{teamNameById.get(selectedResultMatch.away_registere_id) ?? "Away"} score</Label>
                        <Input type="number" min={0} value={resultAwayScore} onChange={(e) => setResultAwayScore(e.target.value)} required />
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Goals (choose scorer)</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setGoalRows((current) => [...current, createGoalInputRow()])}>
                        Add Goal
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {goalRows.map((row, index) => {
                        const playersByTeam = (tournament?.players ?? []).filter(
                          (player) => player.registereId === row.teamRegistereId,
                        );

                        return (
                          <div key={row.id} className="grid gap-2 rounded-md border p-2 md:grid-cols-12">
                            <div className="space-y-1 md:col-span-4">
                              <Label className="text-[10px] uppercase text-muted-foreground">Team</Label>
                              <select
                                className={selectClassName}
                                value={row.teamRegistereId}
                                onChange={(e) =>
                                  setGoalRows((current) =>
                                    current.map((item) =>
                                      item.id === row.id ? { ...item, teamRegistereId: e.target.value, scorerPlayerId: "" } : item,
                                    ),
                                  )
                                }
                              >
                                <option value="">Select team</option>
                                {selectedResultMatch ? (
                                  <>
                                    <option value={selectedResultMatch.home_registere_id}>
                                      {teamNameById.get(selectedResultMatch.home_registere_id) ?? "Home"}
                                    </option>
                                    <option value={selectedResultMatch.away_registere_id}>
                                      {teamNameById.get(selectedResultMatch.away_registere_id) ?? "Away"}
                                    </option>
                                  </>
                                ) : null}
                              </select>
                            </div>
                            <div className="space-y-1 md:col-span-4">
                              <Label className="text-[10px] uppercase text-muted-foreground">Scorer</Label>
                              <select
                                className={selectClassName}
                                value={row.scorerPlayerId}
                                onChange={(e) =>
                                  setGoalRows((current) =>
                                    current.map((item) => (item.id === row.id ? { ...item, scorerPlayerId: e.target.value } : item)),
                                  )
                                }
                              >
                                <option value="">Select player</option>
                                {playersByTeam.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.fullName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-[10px] uppercase text-muted-foreground">Minute</Label>
                              <Input
                                type="number"
                                min={0}
                                max={130}
                                value={row.minute}
                                onChange={(e) =>
                                  setGoalRows((current) =>
                                    current.map((item) => (item.id === row.id ? { ...item, minute: e.target.value } : item)),
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end gap-3 md:col-span-2">
                              <label className="flex items-center gap-2 pb-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={row.isOwnGoal}
                                  onChange={(e) =>
                                    setGoalRows((current) =>
                                      current.map((item) => (item.id === row.id ? { ...item, isOwnGoal: e.target.checked } : item)),
                                    )
                                  }
                                />
                                OG
                              </label>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setGoalRows((current) => current.filter((item) => item.id !== row.id))}
                              >
                                Remove
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground md:col-span-12">Goal {index + 1}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <LoadingButton type="submit" isLoading={isSaving} disabled={!effectiveResultMatchId}>
                    Save Result
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "players" ? (
            <Card>
              <CardHeader>
                <CardTitle>Joueur</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b bg-muted/50 text-muted-foreground uppercase">
                    <tr>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Team</th>
                      <th className="px-2 py-2">Position</th>
                      <th className="px-2 py-2">Jersey</th>
                      <th className="px-2 py-2">Badge ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tournament?.players ?? []).map((player) => (
                      <tr key={player.id} className="border-b">
                        <td className="px-2 py-2 font-medium">{player.fullName}</td>
                        <td className="px-2 py-2">{player.teamName}</td>
                        <td className="px-2 py-2">{player.position}</td>
                        <td className="px-2 py-2">{player.jerseyNumber}</td>
                        <td className="px-2 py-2 font-mono">{player.badgeId ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "badges" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>
                    Open the dedicated badges page to generate and download exact badge PDFs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b bg-muted/50 text-muted-foreground uppercase">
                      <tr>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Full name</th>
                        <th className="px-2 py-2">Team</th>
                        <th className="px-2 py-2">Badge ID</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {badgeMembers.map((member) => (
                        <tr key={member.key} className="border-b">
                          <td className="px-2 py-2 font-medium">{member.memberType}</td>
                          <td className="px-2 py-2">{member.fullName}</td>
                          <td className="px-2 py-2">{member.teamName}</td>
                          <td className="px-2 py-2 font-mono">{member.badgeId}</td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setBadgeMemberKey(member.key);
                                router.push(`/badges?member=${encodeURIComponent(member.key)}`);
                              }}
                            >
                              Open Badge Page
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Badge View</CardTitle>
                  <CardDescription>
                    Badges now open on a standalone page for cleaner preview and download.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedBadgeMember ? (
                    <div className="rounded-md border p-3 text-sm">
                      <p className="font-semibold">{selectedBadgeMember.fullName}</p>
                      <p className="text-muted-foreground">
                        {selectedBadgeMember.memberType} - {selectedBadgeMember.teamName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{selectedBadgeMember.badgeId}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a member from the list.</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/badges")}
                    >
                      Open Full Badge Page
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        selectedBadgeMember
                          ? router.push(`/badges?member=${encodeURIComponent(selectedBadgeMember.key)}`)
                          : router.push("/badges")
                      }
                      disabled={!selectedBadgeMember}
                    >
                      Open Selected Badge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === "scorers" ? (
            <Card>
              <CardHeader>
                <CardTitle>Meilleurs Buteurs</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b bg-muted/50 text-muted-foreground uppercase">
                    <tr>
                      <th className="px-2 py-2">Player</th>
                      <th className="px-2 py-2">Team</th>
                      <th className="px-2 py-2">Position</th>
                      <th className="px-2 py-2">Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tournament?.topScorers ?? []).map((scorer) => (
                      <tr key={scorer.playerId} className="border-b">
                        <td className="px-2 py-2 font-medium">{scorer.fullName}</td>
                        <td className="px-2 py-2">{scorer.teamName}</td>
                        <td className="px-2 py-2">{scorer.position}</td>
                        <td className="px-2 py-2 font-semibold">{scorer.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
