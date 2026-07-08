"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import AppIcon from "@/components/AppIcon";
import Reveal from "@/components/Reveal";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "/#rules", label: "Rules" },
  { href: "#groups", label: "Groups" },
  { href: "#bracket", label: "Bracket" },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule", active: true },
  { href: "/#rules", icon: "gavel", label: "Rules" },
  { href: "#groups", icon: "groups", label: "Groups" },
  { href: "#bracket", icon: "account_tree", label: "Bracket" },
];

type Team = {
  id: string;
  teamName: string;
  logoUrl: string | null;
};

type Group = {
  id: string;
  code: string;
  name: string;
  order_index: number;
};

type GroupEntry = {
  id: string;
  group_id: string;
  registere_id: string;
  seed: number | null;
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

type TournamentData = {
  teams: Team[];
  groups: Group[];
  groupEntries: GroupEntry[];
  matches: Match[];
  standings: StandingGroup[];
};

const knockoutCards = [
  {
    id: "sf1",
    className: "match-card semi-card",
    style: { left: "22.5%", top: "35%" },
    rows: [
      { seed: "1A", team: "1st Poule A" },
      { seed: "2B", team: "2nd Poule B" },
    ],
  },
  {
    id: "sf2",
    className: "match-card semi-card",
    style: { left: "63.5%", top: "35%" },
    rows: [
      { seed: "1B", team: "1st Poule B" },
      { seed: "2A", team: "2nd Poule A" },
    ],
  },
];

const getTeamLogo = (logoUrl: string | null | undefined, teamName: string) => {
  if (logoUrl && (logoUrl.startsWith("http") || logoUrl.startsWith("/"))) {
    return logoUrl;
  }
  const name = teamName.toLowerCase();
  if (name.includes("klass")) return "/Logo ekip/Klass.png";
  if (name.includes("1804")) return "/Logo ekip/1804 FC.png";
  if (name.includes("vétéran") || name.includes("veteran") || name.includes("vens")) return "/Logo ekip/FC des Vétéran.png";
  if (name.includes("pac")) return "/Logo ekip/FC pac.png";
  if (name.includes("top notch")) return "/Logo ekip/Fc Top Notch.png";
  if (name.includes("galaxy")) return "/Logo ekip/Galaxy Fc.png";
  if (name.includes("elite energy")) return "/Logo ekip/Elite Energy.png";
  if (name.includes("island")) return "/Logo ekip/Island united FC.png";
  return "/G%20logo.png";
};

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const getMatchdayDateFallback = (roundLabel: string | null) => {
  const label = (roundLabel || "").toUpperCase();
  if (label.includes("MD1") || label.includes("MATCHDAY 1")) return "Sun, Jul 12";
  if (label.includes("MD2") || label.includes("MATCHDAY 2")) return "Sun, Jul 19";
  if (label.includes("MD3") || label.includes("MATCHDAY 3")) return "Sun, Jul 26";
  return "Sun, Jul 12";
};

export default function MatchSchedulePage() {
  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTournament = async () => {
      try {
        const res = await fetch("/api/public/tournament");
        if (!res.ok) throw new Error("Could not retrieve match data from server.");
        const json = await res.json();
        if (active) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "An unknown error occurred.");
          setLoading(false);
        }
      }
    };
    fetchTournament();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || error || !data) return;

    const shell = document.querySelector<HTMLElement>(".bracket-shell");
    if (!shell) return;

    const byId = (id: string) => document.getElementById(id);

    const toLocalBox = (el: HTMLElement) => {
      const shellRect = shell.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const left = rect.left - shellRect.left;
      const top = rect.top - shellRect.top;
      return {
        left,
        right: left + rect.width,
        top,
        bottom: top + rect.height,
        centerY: top + rect.height / 2,
      };
    };

    const setPath = (id: string, d: string) => {
      const path = byId(id);
      if (path) {
        path.setAttribute("d", d);
      }
    };

    const VIEWBOX_W = 1480;
    const VIEWBOX_H = 320;

    const drawBracketLines = () => {
      const sf1 = byId("sf1") as HTMLElement | null;
      const finalCard = byId("final") as HTMLElement | null;
      const sf2 = byId("sf2") as HTMLElement | null;

      if (!sf1 || !finalCard || !sf2) return;

      const scaleX = VIEWBOX_W / Math.max(shell.clientWidth, 1);
      const scaleY = VIEWBOX_H / Math.max(shell.clientHeight, 1);
      const tx = (x: number) => x * scaleX;
      const ty = (y: number) => y * scaleY;
      const pathH = (x1: number, y: number, x2: number) => `M${tx(x1)} ${ty(y)} H${tx(x2)}`;

      const bSf1 = toLocalBox(sf1);
      const bSf2 = toLocalBox(sf2);

      const sharedSemiCenterY = (bSf1.centerY + bSf2.centerY) / 2;
      let bFinal = toLocalBox(finalCard);
      const finalHeight = bFinal.bottom - bFinal.top;
      const shellHeight = Math.max(shell.clientHeight, 1);
      const finalAnchorRatio = 0.5;
      const desiredFinalTopPercent =
        ((sharedSemiCenterY - finalHeight * finalAnchorRatio) / shellHeight) * 100;

      finalCard.style.top = `${Math.max(0, Math.min(100, desiredFinalTopPercent))}%`;
      bFinal = toLocalBox(finalCard);

      setPath("line-sf1-final", pathH(bSf1.right, bSf1.centerY, bFinal.left));
      setPath("line-final-sf2", pathH(bFinal.right, bFinal.centerY, bSf2.left));
    };

    const scheduleDraw = () => window.requestAnimationFrame(drawBracketLines);

    window.addEventListener("resize", scheduleDraw);
    window.addEventListener("load", scheduleDraw);

    const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    if (fontsReady) {
      fontsReady.then(scheduleDraw);
    }

    scheduleDraw();

    return () => {
      window.removeEventListener("resize", scheduleDraw);
      window.removeEventListener("load", scheduleDraw);
    };
  }, [loading, error, data]);

  if (!loading && (error || !data)) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-[#0D47B5]">
        <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />
        <main className="flex-1 flex flex-col items-center justify-center pt-16 px-4">
          <div className="rounded-xl border border-red-500/20 bg-red-50 p-6 text-center max-w-md">
            <AppIcon name="error" className="text-4xl text-red-500 mb-3" />
            <h3 className="text-lg font-bold text-[#0D47B5] mb-2 uppercase">Error Loading Matches</h3>
            <p className="text-sm text-[#0D47B5]/75 mb-4">{error || "Data is unavailable"}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-5 py-2.5 bg-[#FF6B53] text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-[#e05a45] transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
        <SiteFooter variant="schedule" />
      </div>
    );
  }

  const { teams = [], groups = [], matches = [], standings = [] } = data || {};
  const teamsMap = new Map((teams || []).map((t) => [t.id, t]));



  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0D47B5]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-16">
        <section className="hero-glow relative overflow-hidden py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <Reveal direction="up">
              <p className="text-sm tracking-[0.16em] text-[#FF6B53] uppercase">Official Match Center</p>
              <h1 className="font-heading mt-4 text-3xl leading-[1.05] text-[#004AD3] uppercase sm:text-4xl lg:text-6xl">
                Match Schedule, Poules And Professional Bracket
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#004AD3]/80 md:text-lg md:leading-8">
                8 teams are divided into 2 groups of 4 (Poule A and Poule B). After the group phase,
                teams enter the knockout bracket with quarterfinals, semifinals and final.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Poules Standings Section ─────────────────────────────────── */}
        <section id="groups" className="py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <Reveal direction="up">
              <div className="mb-8 flex items-center gap-3">
                <AppIcon name="groups" className="text-[#FF6B53]" />
                <h2 className="font-heading text-2xl text-[#004AD3] uppercase sm:text-3xl md:text-4xl">Poules (Group Stage)</h2>
              </div>
            </Reveal>

            <Reveal direction="up" delay={200}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {loading ? (
                  [...Array(2)].map((_, i) => (
                    <article key={i} className="overflow-hidden rounded-xl border border-[#004AD3]/12 bg-white shadow-sm animate-pulse">
                      <div className="border-b border-[#004AD3]/10 px-6 py-4">
                        <div className="h-5 w-24 bg-slate-100 rounded" />
                      </div>
                      <div className="px-6 py-4 space-y-4">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-8 w-8 bg-slate-100 rounded-full" />
                              <div className="h-4 w-32 bg-slate-100 rounded" />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-4 w-6 bg-slate-100 rounded" />
                              <div className="h-4 w-6 bg-slate-100 rounded" />
                              <div className="h-4 w-6 bg-slate-100 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  standings.map((groupStanding) => (
                    <article key={groupStanding.groupId} className="overflow-hidden rounded-xl border border-[#004AD3]/20 bg-white shadow-sm">
                      <div className="border-b border-[#004AD3]/20 bg-white px-6 py-4">
                        <h3 className="font-heading text-xl text-[#FF6B53] uppercase">{groupStanding.groupName}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-[11px] tracking-wider text-[#004AD3]/70 uppercase">
                            <tr>
                              <th className="px-5 py-3 text-left">Equipe</th>
                              <th className="px-3 py-3 text-center">Pts</th>
                              <th className="px-3 py-3 text-center">J</th>
                              <th className="px-3 py-3 text-center">G</th>
                              <th className="px-3 py-3 text-center">N</th>
                              <th className="px-3 py-3 text-center">P</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupStanding.teams.map((row) => (
                              <tr key={row.registereId} className="border-t border-[#004AD3]/15">
                                <td className="px-5 py-3 flex items-center gap-3">
                                  <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
                                    <Image
                                      src={getTeamLogo(teamsMap.get(row.registereId)?.logoUrl, row.teamName)}
                                      alt={row.teamName}
                                      fill
                                      sizes="32px"
                                      className="object-contain"
                                      unoptimized
                                    />
                                  </div>
                                  <span className="font-bold text-[#004AD3]">{row.teamName}</span>
                                </td>
                                <td className="text-center font-extrabold text-[#004AD3] text-base">{row.points}</td>
                                <td className="text-center">{row.played}</td>
                                <td className="text-center text-green-600 font-semibold">{row.wins}</td>
                                <td className="text-center text-gray-500">{row.draws}</td>
                                <td className="text-center text-red-500">{row.losses}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Match Schedule Grid Section ────────────────────────────────── */}
        <section id="schedule" className="bg-[#ffffff] py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <Reveal direction="up">
              <div className="mb-8 flex items-center gap-3">
                <AppIcon name="calendar_month" className="text-[#FF6B53]" />
                <h2 className="font-heading text-2xl text-[#004AD3] uppercase sm:text-3xl md:text-4xl">Group Match Schedule</h2>
              </div>
            </Reveal>

            <div className="flex flex-col gap-12">
              {/* Poule A Fixtures */}
              <article className="w-full">
                <Reveal direction="up" delay={150}>
                  <h3 className="mb-6 text-xl tracking-[0.08em] text-[#FF6B53] uppercase font-bold border-b border-slate-100 pb-2">Poule A Fixtures</h3>
                </Reveal>
                <Reveal direction="up" delay={300}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="relative overflow-hidden border border-[#004AD3]/8 bg-transparent rounded-xl p-5 flex flex-col justify-between min-h-[210px] animate-pulse">
                          <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            <div className="flex items-center justify-between border-b border-[#004AD3]/10 pb-3 mb-4">
                              <div className="h-3.5 w-16 bg-slate-100 rounded" />
                              <div className="h-3.5 w-24 bg-slate-100 rounded" />
                            </div>
                            <div className="grid grid-cols-7 items-center gap-2 flex-1">
                              <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                <div className="h-16 w-16 bg-slate-100 rounded-full" />
                                <div className="h-3 w-16 bg-slate-100 rounded mt-1" />
                              </div>
                              <div className="col-span-1 flex flex-col items-center justify-center">
                                <div className="h-5 w-8 bg-slate-100 rounded" />
                              </div>
                              <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                <div className="h-16 w-16 bg-slate-100 rounded-full" />
                                <div className="h-3 w-16 bg-slate-100 rounded mt-1" />
                              </div>
                            </div>
                            <div className="mt-4 border-t border-[#004AD3]/10 pt-3 flex items-center justify-center gap-1.5">
                              <div className="h-3 w-3 bg-slate-100 rounded-full" />
                              <div className="h-3 w-36 bg-slate-100 rounded" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      matches
                        .filter((m) => {
                          const group = groups.find((g) => g.id === m.group_id);
                          return m.stage === "GROUP" && group?.code === "A";
                        })
                        .map((match) => {
                          const homeTeam = teamsMap.get(match.home_registere_id);
                          const awayTeam = teamsMap.get(match.away_registere_id);
                          const displayDate = formatDateTime(match.kickoff_at) || getMatchdayDateFallback(match.round_label);
                          const isPlayed = match.status === "PLAYED";
                          
                          return (
                            <div key={match.id} className="relative overflow-hidden border border-[#004AD3]/12 bg-transparent hover:border-[#FF6B53]/30 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between min-h-[210px]">
                              <div className="relative z-10 flex flex-col justify-between h-full w-full">
                                {/* Montserrat Header */}
                                <div className="flex items-center justify-between border-b border-[#004AD3]/10 pb-3 mb-4">
                                  <span className="[font-family:var(--font-nav),sans-serif] font-black text-xs uppercase text-[#FF6B53] tracking-[0.14em]">
                                    {match.round_label || "GROUP A"}
                                  </span>
                                  <span className="[font-family:var(--font-nav),sans-serif] font-bold text-xs text-[#0D47B5]/80 tracking-wide uppercase">
                                    {displayDate}
                                  </span>
                                </div>
                                
                                {/* Body (Transparent Logos) */}
                                <div className="grid grid-cols-7 items-center gap-2 flex-1">
                                  {/* Home Team */}
                                  <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                    <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                                      <Image
                                        src={getTeamLogo(homeTeam?.logoUrl, homeTeam?.teamName || "TBD")}
                                        alt={homeTeam?.teamName || "TBD"}
                                        fill
                                        sizes="64px"
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="[font-family:var(--font-nav),sans-serif] text-xs font-bold text-[#0D47B5] uppercase tracking-wide max-w-full truncate mt-1">
                                      {homeTeam?.teamName || "TBD"}
                                    </span>
                                  </div>

                                  {/* Score or VS */}
                                  <div className="col-span-1 flex flex-col items-center justify-center">
                                    {isPlayed ? (
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1">
                                          <span className="[font-family:var(--font-nav),sans-serif] text-2xl font-black text-[#0D47B5] tabular-nums leading-none">{match.home_score}</span>
                                          <span className="[font-family:var(--font-nav),sans-serif] text-sm font-black text-[#FF6B53] leading-none">–</span>
                                          <span className="[font-family:var(--font-nav),sans-serif] text-2xl font-black text-[#0D47B5] tabular-nums leading-none">{match.away_score}</span>
                                        </div>
                                        <span className="[font-family:var(--font-nav),sans-serif] text-[8px] font-black uppercase tracking-widest text-[#FF6B53] mt-1">Final</span>
                                      </div>
                                    ) : (
                                      <span className="[font-family:var(--font-nav),sans-serif] text-[10px] font-black tracking-[0.15em] bg-[#0D47B5]/5 border border-[#0D47B5]/10 px-3.5 py-1 rounded text-[#0D47B5]/80 uppercase">
                                        V
                                      </span>
                                    )}
                                  </div>

                                  {/* Away Team */}
                                  <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                    <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                                      <Image
                                        src={getTeamLogo(awayTeam?.logoUrl, awayTeam?.teamName || "TBD")}
                                        alt={awayTeam?.teamName || "TBD"}
                                        fill
                                        sizes="64px"
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="[font-family:var(--font-nav),sans-serif] text-xs font-bold text-[#0D47B5] uppercase tracking-wide max-w-full truncate mt-1">
                                      {awayTeam?.teamName || "TBD"}
                                    </span>
                                  </div>
                                </div>

                                {/* Montserrat Location Footer */}
                                <div className="mt-4 text-center [font-family:var(--font-nav),sans-serif] text-[9px] font-extrabold text-[#0D47B5]/60 flex items-center justify-center gap-1.5 border-t border-[#004AD3]/10 pt-3 uppercase tracking-[0.12em]">
                                  <AppIcon name="location_on" className="text-xs text-[#FF6B53]" />
                                  <span>Ezell Hester Community Center</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </Reveal>
              </article>

              {/* Poule B Fixtures */}
              <article className="w-full">
                <Reveal direction="up" delay={150}>
                  <h3 className="mb-6 text-xl tracking-[0.08em] text-[#FF6B53] uppercase font-bold border-b border-slate-100 pb-2">Poule B Fixtures</h3>
                </Reveal>
                <Reveal direction="up" delay={300}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="relative overflow-hidden border border-[#004AD3]/8 bg-transparent rounded-xl p-5 flex flex-col justify-between min-h-[210px] animate-pulse">
                          <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            <div className="flex items-center justify-between border-b border-[#004AD3]/10 pb-3 mb-4">
                              <div className="h-3.5 w-16 bg-slate-100 rounded" />
                              <div className="h-3.5 w-24 bg-slate-100 rounded" />
                            </div>
                            <div className="grid grid-cols-7 items-center gap-2 flex-1">
                              <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                <div className="h-16 w-16 bg-slate-100 rounded-full" />
                                <div className="h-3 w-16 bg-slate-100 rounded mt-1" />
                              </div>
                              <div className="col-span-1 flex flex-col items-center justify-center">
                                <div className="h-5 w-8 bg-slate-100 rounded" />
                              </div>
                              <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                <div className="h-16 w-16 bg-slate-100 rounded-full" />
                                <div className="h-3 w-16 bg-slate-100 rounded mt-1" />
                              </div>
                            </div>
                            <div className="mt-4 border-t border-[#004AD3]/10 pt-3 flex items-center justify-center gap-1.5">
                              <div className="h-3 w-3 bg-slate-100 rounded-full" />
                              <div className="h-3 w-36 bg-slate-100 rounded" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      matches
                        .filter((m) => {
                          const group = groups.find((g) => g.id === m.group_id);
                          return m.stage === "GROUP" && group?.code === "B";
                        })
                        .map((match) => {
                          const homeTeam = teamsMap.get(match.home_registere_id);
                          const awayTeam = teamsMap.get(match.away_registere_id);
                          const displayDate = formatDateTime(match.kickoff_at) || getMatchdayDateFallback(match.round_label);
                          const isPlayed = match.status === "PLAYED";
                          
                          return (
                            <div key={match.id} className="relative overflow-hidden border border-[#004AD3]/12 bg-transparent hover:border-[#FF6B53]/30 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between min-h-[210px]">
                              <div className="relative z-10 flex flex-col justify-between h-full w-full">
                                {/* Montserrat Header */}
                                <div className="flex items-center justify-between border-b border-[#004AD3]/10 pb-3 mb-4">
                                  <span className="[font-family:var(--font-nav),sans-serif] font-black text-xs uppercase text-[#FF6B53] tracking-[0.14em]">
                                    {match.round_label || "GROUP B"}
                                  </span>
                                  <span className="[font-family:var(--font-nav),sans-serif] font-bold text-xs text-[#0D47B5]/80 tracking-wide uppercase">
                                    {displayDate}
                                  </span>
                                </div>
                                
                                {/* Body (Transparent Logos) */}
                                <div className="grid grid-cols-7 items-center gap-2 flex-1">
                                  {/* Home Team */}
                                  <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                    <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                                      <Image
                                        src={getTeamLogo(homeTeam?.logoUrl, homeTeam?.teamName || "TBD")}
                                        alt={homeTeam?.teamName || "TBD"}
                                        fill
                                        sizes="64px"
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="[font-family:var(--font-nav),sans-serif] text-xs font-bold text-[#0D47B5] uppercase tracking-wide max-w-full truncate mt-1">
                                      {homeTeam?.teamName || "TBD"}
                                    </span>
                                  </div>

                                  {/* Score or VS */}
                                  <div className="col-span-1 flex flex-col items-center justify-center">
                                    {isPlayed ? (
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1">
                                          <span className="[font-family:var(--font-nav),sans-serif] text-2xl font-black text-[#0D47B5] tabular-nums leading-none">{match.home_score}</span>
                                          <span className="[font-family:var(--font-nav),sans-serif] text-sm font-black text-[#FF6B53] leading-none">–</span>
                                          <span className="[font-family:var(--font-nav),sans-serif] text-2xl font-black text-[#0D47B5] tabular-nums leading-none">{match.away_score}</span>
                                        </div>
                                        <span className="[font-family:var(--font-nav),sans-serif] text-[8px] font-black uppercase tracking-widest text-[#FF6B53] mt-1">Final</span>
                                      </div>
                                    ) : (
                                      <span className="[font-family:var(--font-nav),sans-serif] text-[10px] font-black tracking-[0.15em] bg-[#0D47B5]/5 border border-[#0D47B5]/10 px-3.5 py-1 rounded text-[#0D47B5]/80 uppercase">
                                        V
                                      </span>
                                    )}
                                  </div>

                                  {/* Away Team */}
                                  <div className="col-span-3 flex flex-col items-center text-center gap-2">
                                    <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                                      <Image
                                        src={getTeamLogo(awayTeam?.logoUrl, awayTeam?.teamName || "TBD")}
                                        alt={awayTeam?.teamName || "TBD"}
                                        fill
                                        sizes="64px"
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="[font-family:var(--font-nav),sans-serif] text-xs font-bold text-[#0D47B5] uppercase tracking-wide max-w-full truncate mt-1">
                                      {awayTeam?.teamName || "TBD"}
                                    </span>
                                  </div>
                                </div>

                                {/* Montserrat Location Footer */}
                                <div className="mt-4 text-center [font-family:var(--font-nav),sans-serif] text-[9px] font-extrabold text-[#0D47B5]/60 flex items-center justify-center gap-1.5 border-t border-[#004AD3]/10 pt-3 uppercase tracking-[0.12em]">
                                  <AppIcon name="location_on" className="text-xs text-[#FF6B53]" />
                                  <span>Ezell Hester Community Center</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </Reveal>
              </article>
            </div>
          </div>
        </section>

        {/* ── Knockout Bracket Section ─────────────────────────────────── */}
        <section id="bracket" className="py-14 md:py-[110px]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <Reveal direction="up">
              <div className="mb-8 flex items-center gap-3">
                <AppIcon name="account_tree" className="text-[#FF6B53]" />
                <h2 className="font-heading text-2xl text-[#004AD3] uppercase sm:text-3xl md:text-4xl">Knockout Bracket</h2>
              </div>
            </Reveal>
          </div>

          {/* Bracket - Mobile view */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:hidden">
            <Reveal direction="up" delay={200}>
              <div className="space-y-6">
                {["Semifinals", "Final"].map((stageLabel) => {
                  let cards: typeof knockoutCards = [];
                  if (stageLabel === "Semifinals") {
                    cards = knockoutCards.filter((c) => c.id.startsWith("sf"));
                  }

                  return (
                    <article key={stageLabel} className="rounded-lg border border-[#004AD3]/20 bg-white p-4 shadow-sm">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#FF6B53] uppercase">{stageLabel}</p>
                      <div className="mt-3 space-y-3">
                        {stageLabel === "Final" ? (
                          <div className={`rounded-md border border-[#FF6B53]/30 bg-[#FF6B53]/5 p-3 shadow-[0_2px_12px_rgba(255,107,83,0.05)] ${loading ? 'animate-pulse opacity-60' : ''}`}>
                            <p className="text-[9px] font-extrabold tracking-[0.12em] text-[#FF6B53] uppercase">Final</p>
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center justify-between text-sm text-[#004AD3]">
                                <span className="min-w-[28px] text-[9px] font-bold tracking-[0.08em] text-[#FF6B53] uppercase">F</span>
                                {loading ? (
                                  <span className="h-3.5 w-24 bg-slate-100 rounded inline-block animate-pulse" />
                                ) : (
                                  <span className="flex-1 font-semibold truncate">Winner SF1</span>
                                )}
                                <span className="font-extrabold text-[#FF6B53] min-w-4 text-right" />
                              </div>
                              <div className="flex items-center justify-between text-sm text-[#004AD3] border-t border-[#004AD3]/10 pt-1.5">
                                <span className="min-w-[28px] text-[9px] font-bold tracking-[0.08em] text-[#FF6B53] uppercase">F</span>
                                {loading ? (
                                  <span className="h-3.5 w-24 bg-slate-100 rounded inline-block animate-pulse" />
                                ) : (
                                  <span className="flex-1 font-semibold truncate">Winner SF2</span>
                                )}
                                <span className="font-extrabold text-[#FF6B53] min-w-4 text-right" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          cards.map((card) => (
                            <div
                              key={card.id}
                              className={`rounded-md border p-3 ${
                                card.className.includes("semi-card")
                                  ? "border-[#004AD3]/30 bg-[#004AD3]/5"
                                  : "border-[#004AD3]/15 bg-white shadow-sm"
                              } ${loading ? 'animate-pulse opacity-60' : ''}`}
                            >
                              <p className="text-[9px] font-extrabold tracking-[0.12em] text-[#0D47B5] uppercase">{card.id.toUpperCase()}</p>
                              <div className="mt-2 space-y-1.5">
                                {card.rows.map((row, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-between gap-2 text-sm text-[#004AD3] ${
                                      index > 0 ? "border-t border-[#004AD3]/10 pt-1.5" : ""
                                    }`}
                                  >
                                    <span className="min-w-[28px] text-[9px] font-bold tracking-[0.08em] text-[#FF6B53] uppercase">
                                      {row.seed}
                                    </span>
                                    {loading ? (
                                      <span className="h-3.5 w-24 bg-slate-100 rounded inline-block animate-pulse" />
                                    ) : (
                                      <span className="flex-1 font-semibold truncate">{row.team}</span>
                                    )}
                                    <span className="font-extrabold text-[#FF6B53] min-w-4 text-right" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </Reveal>
          </div>

          {/* Bracket - Desktop view */}
          <div className="hidden px-4 md:px-8 xl:px-10 lg:block">
            <Reveal direction="up" delay={200}>
              <div className="pb-2">
                <div className="bracket-shell" style={{ aspectRatio: "1480 / 320" }}>
                  <svg className="bracket-lines" viewBox="0 0 1480 320" preserveAspectRatio="none" aria-hidden="true">
                    <path id="line-sf1-final" />
                    <path id="line-final-sf2" />
                  </svg>

                  <span className="stage-label font-bold" style={{ left: "22.5%", top: "25%" }}>Semifinal 1</span>
                  <span className="stage-label font-bold" style={{ left: "63.5%", top: "25%" }}>Semifinal 2</span>

                  {knockoutCards.map((card) => (
                    <article key={card.id} id={card.id} className={`${card.className} ${loading ? 'animate-pulse opacity-60' : ''}`} style={card.style}>
                      {card.rows.map((row) => (
                        <div key={`${card.id}-${row.seed}-${row.team}`} className="row">
                          <span className="seed">{row.seed}</span>
                          {loading ? (
                            <span className="h-3.5 w-24 bg-slate-100 rounded inline-block animate-pulse" />
                          ) : (
                            <span>{row.team}</span>
                          )}
                          <span className="score" />
                        </div>
                      ))}
                    </article>
                  ))}

                  {/* Final Card */}
                  <article id="final" className={`match-card final-card ${loading ? 'animate-pulse opacity-60' : ''}`} style={{ left: "43%", top: "31.77%" }}>
                    <p className="final-title font-heading text-[10px] text-[#FF6B53] tracking-widest uppercase mb-1">Final</p>
                    <div className="row">
                      <span className="seed">F</span>
                      {loading ? (
                        <span className="h-3.5 w-24 bg-slate-100 rounded inline-block animate-pulse" />
                      ) : (
                        <span>Winner SF1</span>
                      )}
                      <span className="score" />
                    </div>
                    <div className="row">
                      <span className="seed">F</span>
                      {loading ? (
                        <span className="h-3.5 w-24 bg-slate-100 rounded inline-block animate-pulse" />
                      ) : (
                        <span>Winner SF2</span>
                      )}
                      <span className="score" />
                    </div>
                  </article>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter variant="schedule" />
    </div>
  );
}
