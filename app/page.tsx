"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import AppIcon from "@/components/AppIcon";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import granpanSponsorLogo from "@/public/Granpan.png";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "#rules", label: "Rules" },
  { href: "/match-schedule#groups", label: "Groups" },
  { href: "/match-schedule#bracket", label: "Bracket" },
];

const logistics = [
  { icon: "calendar_month", label: "Dates", value: "July 26, 2026 - Sept 6, 2026" },
  { icon: "location_on", label: "Venue", value: "Ezell Hester Community Center" },
  { icon: "call", label: "Contact Support", value: "+1 (561) 704-4613" },
];

const rulesCards = [
  {
    id: "1",
    title: "Team Composition",
    text: "Each club can register up to 20 players and 5 staff members. All members must be registered with valid ID by July 1, 2026.",
    card: "border-black/20 bg-[#1AD1D7] text-black",
    badge: "bg-black text-[#1AD1D7]",
  },
  {
    id: "2",
    title: "Match Format",
    text: "Standard 90-minute matches (45 min halves). Group stage followed by direct elimination rounds.",
    card: "border-[#FF6B53]/35 bg-[#FF6B53] text-white",
    badge: "bg-white text-[#FF6B53]",
  },
  {
    id: "3",
    title: "Code of Conduct",
    text: "Zero tolerance for unsportsmanlike behavior. Fair play is the cornerstone of the Granpanpan Nations Cup.",
    card: "border-[#0D47B5]/35 bg-[#0D47B5] text-white",
    badge: "bg-white text-[#0D47B5]",
  },
];

const registeredTeams = [
  { name: "Klass", logo: "/Logo ekip/Klass.png" },
  { name: "1804 FC", logo: "/Logo ekip/1804 FC.png" },
  { name: "FC des Vétéran", logo: "/Logo ekip/FC des Vétéran.png" },
  { name: "FC pac", logo: "/Logo ekip/FC pac.png" },
  { name: "Fc Top Notch", logo: "/Logo ekip/Fc Top Notch.png" },
  { name: "Galaxy Fc", logo: "/Logo ekip/Galaxy Fc.png" },
  { name: "Elite Energy", logo: "/Logo ekip/Elite Energy.png" },
  { name: "Island united FC", logo: "/Logo ekip/Island united FC.png" },
];

const frameworkCards = [
  {
    id: "01",
    icon: "groups",
    title: "Competition Format",
    text: "2 groups of 4 teams. Each group plays a single round-robin (6 matches per group). Top teams advance to knockout rounds.",
    cardClass: "border-[#0D47B5]/16",
    iconClass: "bg-[#0D47B5]/8 text-[#0D47B5]",
    titleClass: "text-[#0D47B5]",
  },
  {
    id: "02",
    icon: "sports",
    title: "Match Standard",
    text: "Official 90-minute matches (2 x 45). Knockout ties follow official tiebreak procedures, including extra time and penalties when required.",
    cardClass: "border-[#FF6B53]/20",
    iconClass: "bg-[#FF6B53]/10 text-[#FF6B53]",
    titleClass: "text-[#FF6B53]",
  },
  {
    id: "03",
    icon: "calendar_month",
    title: "Tournament Window",
    text: "Group stage, knockout rounds, and final are scheduled between July and September 2026 at the Ezell Hester Community Center.",
    cardClass: "border-[#1AD1D7]/30",
    iconClass: "bg-[#1AD1D7]/12 text-[#1AD1D7]",
    titleClass: "text-[#1AD1D7]",
  },
  {
    id: "04",
    icon: "verified",
    title: "Professional Oversight",
    text: "Central match operations include scheduling control, result tracking, and officiating standards aligned with competitive tournament play.",
    cardClass: "border-[#0D47B5]/16",
    iconClass: "bg-[#1AD1D7]/10 text-[#1AD1D7]",
    titleClass: "text-[#1AD1D7]",
  },
];

const tournamentStats = [
  { value: "8", label: "Teams" },
  { value: "2", label: "Groups" },
  { value: "19", label: "Matches" },
];

const tournamentSnapshot = [
  { label: "Format", value: "2 groups of 4 teams + knockout stage" },
  { label: "Match Length", value: "90 minutes" },
  { label: "Tournament Window", value: "July - September 2026" },
  { label: "Venue", value: "Ezell Hester Community Center" },
];

const PRIZE_TARGETS = {
  champion: 10000,
  runnerUp: 3000,
  mvp: 500,
  bestScorer: 300,
  topAssists: 200,
};

type PrizeKey = keyof typeof PRIZE_TARGETS;

const individualPrizeCards = [
  {
    prizeKey: "mvp" as const,
    title: "Tournament MVP",
    icon: "star",
    cardClass: "border-[#0D47B5]/18 bg-[#ffffff]",
    labelClass: "text-[#0D47B5]",
    iconClass: "text-[#0D47B5]",
  },
  {
    prizeKey: "bestScorer" as const,
    title: "Best Scorer",
    icon: "sports_soccer",
    cardClass: "border-[#FF6B53]/22 bg-[#ffffff]",
    labelClass: "text-[#FF6B53]",
    iconClass: "text-[#FF6B53]",
  },
  {
    prizeKey: "topAssists" as const,
    title: "Top Assists",
    icon: "assistant",
    cardClass: "border-[#1AD1D7]/40 bg-[#ffffff]",
    labelClass: "text-[#1AD1D7]",
    iconClass: "text-[#1AD1D7]",
  },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule" },
  { href: "#rules", icon: "gavel", label: "Rules" },
  { href: "/match-schedule#groups", icon: "groups", label: "Groups" },
  { href: "/match-schedule#bracket", icon: "account_tree", label: "Bracket" },
];

const CHAMPIONSHIP_START = "2026-07-26T18:00:00-05:00";

const INITIAL_COUNTDOWN = {
  isStarted: false,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const getCountdown = (targetDate: string) => {
  const diffMs = new Date(targetDate).getTime() - Date.now();
  if (diffMs <= 0) {
    return { isStarted: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { isStarted: false, days, hours, minutes, seconds };
};

const formatCountdownPart = (value: number) => String(value).padStart(2, "0");
const formatPrizeAmount = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

interface Team {
  id: string;
  teamName: string;
  logoUrl: string | null;
  createdAt: string;
}

interface Group {
  id: string;
  code: string;
  name: string;
}

interface Match {
  id: string;
  round_label: string | null;
  stage: "GROUP" | "KNOCKOUT";
  status: "SCHEDULED" | "PLAYED";
  home_registere_id: string;
  away_registere_id: string;
  home_score: number;
  away_score: number;
  kickoff_at: string | null;
  venue: string | null;
  group_id: string;
}

interface StandingRow {
  registereId: string;
  teamName: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

interface GroupStanding {
  groupId: string;
  groupName: string;
  teams: StandingRow[];
}

interface TournamentData {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  standings: GroupStanding[];
}

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
  
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  return `${dateStr} - ${timeStr}`;
};

const getMatchdayDateFallback = (roundLabel: string | null) => {
  const label = (roundLabel || "").toUpperCase();
  if (label.includes("MD1") || label.includes("MATCHDAY 1")) return "Sun, Jul 26";
  if (label.includes("MD2") || label.includes("MATCHDAY 2")) return "Sun, Jul 19";
  if (label.includes("MD3") || label.includes("MATCHDAY 3")) return "Sun, Jul 26";
  if (label.includes("MD4") || label.includes("MATCHDAY 4")) return "Sun, Aug 2";
  if (label.includes("MD5") || label.includes("MATCHDAY 5")) return "Sun, Aug 9";
  return "Sun, Jul 26";
};

export default function Home() {
  const prizesRef = useRef<HTMLElement>(null);
  const [hasSeenPrizes, setHasSeenPrizes] = useState(false);
  const [countdown, setCountdown] = useState<ReturnType<typeof getCountdown>>(INITIAL_COUNTDOWN);
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [animatedPrizeAmounts, setAnimatedPrizeAmounts] = useState<Record<PrizeKey, number>>({
    champion: 0,
    runnerUp: 0,
    mvp: 0,
    bestScorer: 0,
    topAssists: 0,
  });

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/public/tournament");
        if (!res.ok) throw new Error("Failed to fetch tournament data");
        const json = await res.json();
        setTournamentData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setScheduleLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  useEffect(() => {
    const syncCountdown = () => {
      setCountdown(getCountdown(CHAMPIONSHIP_START));
    };

    syncCountdown();
    const timer = window.setInterval(syncCountdown, 1000);
    window.addEventListener("focus", syncCountdown);
    document.addEventListener("visibilitychange", syncCountdown);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncCountdown);
      document.removeEventListener("visibilitychange", syncCountdown);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasSeenPrizes(true);
        }
      },
      { threshold: 0.2 }
    );

    if (prizesRef.current) {
      observer.observe(prizesRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasSeenPrizes) return;

    const durationMs = 5200;
    const startAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startAt) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;

      setAnimatedPrizeAmounts({
        champion: PRIZE_TARGETS.champion * eased,
        runnerUp: PRIZE_TARGETS.runnerUp * eased,
        mvp: PRIZE_TARGETS.mvp * eased,
        bestScorer: PRIZE_TARGETS.bestScorer * eased,
        topAssists: PRIZE_TARGETS.topAssists * eased,
      });

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [hasSeenPrizes]);

  const countdownDisplay = countdown;

  const scheduleMatches = tournamentData?.matches || [];
  const teamsMap = new Map(tournamentData?.teams.map((t) => [t.id, t]) || []);
  const groupsMap = new Map(tournamentData?.groups.map((g) => [g.id, g]) || []);
  
  // Filter 2 Poule A group stage matches
  const pouleAMatches = scheduleMatches
    .filter((m) => {
      const g = groupsMap.get(m.group_id);
      return m.stage === "GROUP" && g?.code === "A";
    })
    .slice(0, 2);

  // Filter 2 Poule B group stage matches
  const pouleBMatches = scheduleMatches
    .filter((m) => {
      const g = groupsMap.get(m.group_id);
      return m.stage === "GROUP" && g?.code === "B";
    })
    .slice(0, 2);

  const featuredMatches = [...pouleAMatches, ...pouleBMatches];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1">
        <section className="relative flex min-h-screen items-center overflow-hidden bg-[#000000] pt-16">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Full%20bg%20design.png"
              alt="Full background design"
              fill
              priority
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/30 to-black/38" />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 md:px-16 lg:grid-cols-12">
            <div className="mx-auto flex w-full max-w-[920px] flex-col items-center justify-center gap-2 text-center lg:col-span-12">
              <h1 className="font-heading text-3xl leading-[1.02] text-white uppercase md:text-5xl">
                Next <span className="text-[#FF6B53]">Match</span>
              </h1>
              
              <div className="mt-6 flex items-center justify-center gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-16 w-16 md:h-24 md:w-24 flex items-center justify-center">
                    <Image src="/Logo ekip/FC des Vétéran.png" alt="FC des Vétéran" fill className="object-contain" unoptimized />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">VENS</span>
                </div>
                <span className="text-2xl md:text-4xl font-black text-[#FF6B53]">VS</span>
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-16 w-16 md:h-24 md:w-24 flex items-center justify-center">
                    <Image src="/Logo ekip/Fc Top Notch.png" alt="Fc Top Notch" fill className="object-contain" unoptimized />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">Top Notch</span>
                </div>
              </div>

              <p className="mt-6 text-sm md:text-base font-bold text-[#1AD1D7] uppercase tracking-[0.15em] text-center">
                This match was postponed due to rain
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-6 text-white md:flex-row">
                <div className="flex flex-col">
                  <span className="text-xs font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.1em] text-white/60 uppercase">
                    Champion Prize
                  </span>
                  <span className="text-4xl font-bold [font-family:var(--font-nav),sans-serif] text-[#FF6B53] md:text-5xl">
                    $10,000
                  </span>
                </div>
                <div className="hidden h-12 w-px bg-[#0D47B5]/20 md:block" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.1em] text-white/60 uppercase">
                    Runner-up
                  </span>
                  <span className="text-4xl font-bold [font-family:var(--font-nav),sans-serif] md:text-5xl">$3,000</span>
                </div>
              </div>

              <div className="mt-12 w-full max-w-[760px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <p className="text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-white/70 uppercase">
                      Championship Kickoff Countdown
                    </p>
                    <p className="text-sm [font-family:var(--font-nav),sans-serif] text-white/80">July 26, 2026</p>
                  </div>

                  {countdownDisplay.isStarted ? (
                    <p className="text-2xl font-bold [font-family:var(--font-nav),sans-serif] text-[#1AD1D7] uppercase">
                      The Championship Has Started
                    </p>
                  ) : (
                    <div className="flex flex-nowrap items-end justify-center gap-1.5 md:gap-4">
                      <div className="flex w-auto items-end justify-center gap-1 md:w-[124px] md:gap-2">
                        <div className="w-[2ch] text-center text-3xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-white md:text-5xl">{formatCountdownPart(countdownDisplay.days)}</div>
                        <div className="pb-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase md:text-xs">Days</div>
                      </div>
                      <span className="pb-1 text-xl text-white/35 md:text-2xl">:</span>
                      <div className="flex w-auto items-end justify-center gap-1 md:w-[124px] md:gap-2">
                        <div className="w-[2ch] text-center text-3xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-white md:text-5xl">{formatCountdownPart(countdownDisplay.hours)}</div>
                        <div className="pb-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase md:text-xs">Hours</div>
                      </div>
                      <span className="pb-1 text-xl text-white/35 md:text-2xl">:</span>
                      <div className="flex w-auto items-end justify-center gap-1 md:w-[132px] md:gap-2">
                        <div className="w-[2ch] text-center text-3xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-white md:text-5xl">{formatCountdownPart(countdownDisplay.minutes)}</div>
                        <div className="pb-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase md:text-xs">Mins</div>
                      </div>
                      <span className="pb-1 text-xl text-white/35 md:text-2xl">:</span>
                      <div className="flex w-auto items-end justify-center gap-1 md:w-[134px] md:gap-2">
                        <div className="w-[2ch] text-center text-3xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-[#1AD1D7] md:text-5xl">{formatCountdownPart(countdownDisplay.seconds)}</div>
                        <div className="pb-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase md:text-xs">Secs</div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── Participating Teams Section ────────────────────────── */}
        <section id="participating-teams" className="py-20 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-[1180px] px-4 md:px-16">
            
            <div className="w-full">
              <Reveal direction="up" className="text-center mb-12">
                <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.16em] text-[#FF6B53] uppercase">
                  Official Contenders
                </p>
                <h2 className="font-heading mt-2 text-3xl md:text-5xl text-[#0D47B5] uppercase">
                  Championship Teams
                </h2>
                <div className="mx-auto mt-4 h-1 w-16 bg-[#FF6B53] rounded" />
              </Reveal>

              <Reveal direction="up" delay={200}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                  {registeredTeams.map((team, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="relative h-24 w-24 flex items-center justify-center mb-3">
                        <Image 
                          src={team.logo} 
                          alt={team.name} 
                          fill
                          className="object-contain" 
                          unoptimized 
                        />
                      </div>
                      <span className="text-sm font-bold text-[#0D47B5]">
                        {team.name}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Print Substitution Cards Button */}
              <Reveal direction="up" delay={300} className="mt-16 flex justify-center">
                <button
                  onClick={() => {
                    let iframe = document.getElementById("print-iframe") as HTMLIFrameElement;
                    if (!iframe) {
                      iframe = document.createElement("iframe");
                      iframe.id = "print-iframe";
                      iframe.style.display = "none";
                      document.body.appendChild(iframe);
                    }
                    iframe.src = "/substitution-cards";
                    iframe.onload = () => {
                      setTimeout(() => {
                        iframe.contentWindow?.print();
                      }, 500);
                    };
                  }}
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#FF6B53] !text-white text-xs font-black tracking-widest [font-family:var(--font-nav),sans-serif] hover:bg-[#e55a43] transition-all duration-300 uppercase rounded-sm shadow-[0_8px_20px_rgba(255,107,83,0.3)] hover:-translate-y-0.5"
                >
                  <AppIcon name="print" className="text-sm !text-white" />
                  <span className="!text-white">Document Substitution-Cards</span>
                </button>
              </Reveal>
            </div>

          </div>
        </section>

        <section id="schedule" className="bg-[#ffffff] py-[120px] border-b border-slate-100">
          <div className="mx-auto max-w-[1180px] px-4 md:px-16">
            <Reveal direction="up">
              <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.16em] text-[#FF6B53] uppercase text-center sm:text-left">
                    Match Center
                  </p>
                  <h2 className="font-heading mt-1 text-3xl md:text-5xl text-[#0D47B5] uppercase text-center sm:text-left">MATCH SCHEDULE</h2>
                </div>
                <div className="flex items-center gap-2 text-[#FF6B53]">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#FF6B53]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Scores Enabled</span>
                </div>
              </div>
            </Reveal>

            {scheduleLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="relative overflow-hidden border border-[#004AD3]/8 bg-transparent rounded-xl p-6 flex flex-col justify-between min-h-[220px] animate-pulse">
                    <div className="relative z-10 flex flex-col justify-between h-full w-full">
                      <div className="flex items-center justify-between border-b border-[#004AD3]/10 pb-3.5 mb-4">
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
                ))}
              </div>
            ) : featuredMatches.length === 0 ? (
              <Reveal direction="up" delay={200}>
                <div className="overflow-hidden rounded-xl border border-[#0D47B5]/15 bg-white">
                  <div className="flex h-[220px] flex-col items-center justify-center gap-3 bg-white text-[#0D47B5]/45 md:h-[280px]">
                    <AppIcon name="pending_actions" className="text-5xl text-[#0D47B5]/35" />
                    <p className="text-center text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-[#0D47B5]/45 uppercase md:text-sm">
                      No Matches Scheduled Yet.
                    </p>
                  </div>
                </div>
              </Reveal>
            ) : (
              <div className="flex flex-col gap-10">
                <Reveal direction="up" delay={200}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {featuredMatches.map((match) => {
                      const homeTeam = teamsMap.get(match.home_registere_id);
                      const awayTeam = teamsMap.get(match.away_registere_id);
                      const displayDate = formatDateTime(match.kickoff_at) || getMatchdayDateFallback(match.round_label);
                      const isPlayed = match.status === "PLAYED";
                      const groupCode = groupsMap.get(match.group_id)?.code || "A";

                      return (
                        <div key={match.id} className="relative overflow-hidden border border-[#004AD3]/12 bg-transparent hover:border-[#FF6B53]/35 transition-all duration-300 rounded-xl p-6 flex flex-col justify-between min-h-[220px]">
                          <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            {/* Montserrat Header */}
                            <div className="flex items-center justify-between border-b border-[#004AD3]/10 pb-3.5 mb-4">
                              <span className="[font-family:var(--font-nav),sans-serif] font-black text-xs uppercase text-[#FF6B53] tracking-[0.14em]">
                                {match.round_label || `GROUP ${groupCode}`}
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
                    })}
                  </div>
                </Reveal>

                {/* View All Matches Button */}
                <Reveal direction="up" delay={300} className="flex justify-center mt-4">
                  <Link
                    href="/match-schedule"
                    className="group inline-flex items-center gap-2.5 px-8 py-3.5 border-2 border-[#0D47B5] text-xs font-black tracking-widest [font-family:var(--font-nav),sans-serif] text-[#0D47B5] hover:bg-[#FF6B53] hover:border-[#FF6B53] hover:text-white transition-all duration-300 uppercase rounded-sm"
                  >
                    <span>View All Matches</span>
                    <AppIcon name="arrow_forward" className="text-sm text-[#0D47B5] group-hover:text-white transition-colors duration-300" />
                  </Link>
                </Reveal>
              </div>
            )}
          </div>
        </section>

        {/* ── About The Tournament ──────────────────────────────────────── */}
        <section className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-[1180px] px-4 md:px-16">
            {/* ── Header row ── */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <Reveal className="lg:col-span-8">
                <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.16em] text-[#0D47B5]/72 uppercase">
                  About The Tournament
                </p>
                <h2 className="mt-3 text-4xl font-extrabold [font-family:var(--font-nav),sans-serif] leading-[1.02] text-[#FF6B53] uppercase md:text-6xl">
                  Granpanpan Nations Cup 2026
                </h2>
                <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[#0D47B5]/80 md:text-base">
                  Granpanpan Nations Cup is a structured summer competition designed for elite amateur and
                  semi-professional football teams. This edition runs with 8 teams in 2 groups, followed by
                  a knockout bracket through quarterfinals, semifinals, and the championship final.
                </p>

                {/* ── Stats ── */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  {tournamentStats.map((item, index) => (
                    <Reveal
                      key={item.label}
                      delay={index * 150}
                      className="rounded-md border border-[#0D47B5]/16 bg-white px-5 py-4 shadow-[0_8px_18px_rgba(0,74,211,0.08)]"
                    >
                      <p className="text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] leading-none text-[#FF6B53]">
                        {item.value}
                      </p>
                      <p className="mt-2 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#0D47B5]/68 uppercase">
                        {item.label}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </Reveal>

              {/* ── Snapshot card ── */}
              <Reveal direction="left" delay={300} className="lg:col-span-4">
                <aside className="h-full rounded-xl border border-[#0D47B5]/14 bg-white shadow-[0_12px_36px_rgba(0,74,211,0.1)]">
                  <div className="p-6">
                    <p className="text-[11px] font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.15em] text-[#0D47B5]/60 uppercase">
                      Competition Snapshot
                    </p>
                    <div className="mt-4 space-y-0">
                      {tournamentSnapshot.map((item, index) => (
                        <div
                          key={item.label}
                          className={`py-3.5 ${index !== tournamentSnapshot.length - 1 ? "border-b border-[#0D47B5]/10" : ""}`}
                        >
                          <p className="text-[10px] font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#FF6B53] uppercase">
                            {item.label}
                          </p>
                          <p className="mt-1 text-[14px] font-semibold leading-snug text-[#0D47B5]/90">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </Reveal>
            </div>

            {/* ── Tournament Framework ── */}
            <Reveal className="mt-10 border-t border-[#0D47B5]/12 pt-8">
              <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.16em] text-[#0D47B5]/60 uppercase">
                Tournament Framework
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {frameworkCards.map((card, index) => (
                  <Reveal
                    key={card.id}
                    delay={index * 100}
                    className={`group relative overflow-hidden rounded-xl border bg-white p-6 shadow-[0_6px_20px_rgba(0,74,211,0.07)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,74,211,0.12)] hover:-translate-y-0.5 ${card.cardClass}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                        <AppIcon name={card.icon} className="text-[20px] leading-none" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`text-[10px] font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-[#0D47B5]/45 uppercase`}>
                            {card.id}
                          </span>
                          <span className="h-px flex-1 bg-[#0D47B5]/10" />
                        </div>
                        <h3 className={`text-[13px] font-extrabold [font-family:var(--font-nav),sans-serif] tracking-[0.08em] uppercase ${card.titleClass}`}>
                          {card.title}
                        </h3>
                        <p className="mt-2.5 text-[13px] leading-6 text-[#0D47B5]/72">{card.text}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="prizes" ref={prizesRef} className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-[1100px] px-4 md:px-16">
            <Reveal direction="up">
              <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-12 md:items-end">
                <div className="md:col-span-7">
                  <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-[#0D47B5]/62 uppercase">
                    Prize Structure
                  </p>
                  <h2 className="mt-2 text-4xl font-extrabold [font-family:var(--font-nav),sans-serif] leading-[0.95] text-[#0D47B5] uppercase md:text-6xl">
                    Tournament
                    <br />
                    Prizes
                  </h2>
                </div>
                <p className="text-sm leading-7 text-[#0D47B5]/78 md:col-span-5 md:max-w-md">
                  Total announced prize pool includes team awards and individual performance awards.
                  Financial prizes are combined with official tournament honors.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <Reveal direction="left" delay={100} className="lg:col-span-7">
                <article className="flex h-full flex-col rounded-lg bg-[#0D47B5] p-7 text-white shadow-[0_14px_34px_rgba(0,74,211,0.28)] md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/74 uppercase">
                        1st Place
                      </p>
                      <h3 className="mt-2 text-[34px] leading-[1] font-extrabold [font-family:var(--font-nav),sans-serif] uppercase md:text-[40px]">
                        Tournament Champion
                      </h3>
                      <p className="mt-2 text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.08em] text-white/80 uppercase">
                        Plus Official Trophy & Gold Medals
                      </p>
                    </div>
                    <AppIcon name="emoji_events" className="rounded-md bg-white/10 p-2.5 text-[22px] text-[#1AD1D7]" />
                  </div>
                  <p className="mt-auto pt-8 text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#1AD1D7] tabular-nums md:text-6xl">
                    {formatPrizeAmount(animatedPrizeAmounts.champion)}
                  </p>
                </article>
              </Reveal>

              <Reveal direction="right" delay={200} className="lg:col-span-5">
                <article className="flex h-full flex-col rounded-lg border border-[#0D47B5]/20 bg-[#ffffff] p-7 shadow-[0_8px_24px_rgba(0,74,211,0.1)] md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#0D47B5]/62 uppercase">
                        2nd Place
                      </p>
                      <h3 className="mt-2 text-[34px] leading-[1] font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] uppercase md:text-[40px]">
                        Runner-up
                      </h3>
                      <p className="mt-2 text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.08em] text-[#0D47B5]/76 uppercase">
                        Plus Silver Medals
                      </p>
                    </div>
                    <AppIcon
                      name="military_tech"
                      className="rounded-md border border-[#0D47B5]/16 bg-white p-2.5 text-[22px] text-[#0D47B5]/72"
                    />
                  </div>
                  <p className="mt-auto pt-8 text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] tabular-nums md:text-6xl">
                    {formatPrizeAmount(animatedPrizeAmounts.runnerUp)}
                  </p>
                </article>
              </Reveal>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {individualPrizeCards.map((card, index) => (
                <Reveal key={card.title} direction="up" delay={300 + index * 100}>
                  <article className={`h-full rounded-md border p-5 ${card.cardClass}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-[10px] font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.1em] uppercase ${card.labelClass}`}>
                        {card.title}
                      </p>
                      <AppIcon name={card.icon} className={`text-[15px] ${card.iconClass}`} />
                    </div>
                    <p className="mt-2 text-4xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] tabular-nums">
                      {formatPrizeAmount(animatedPrizeAmounts[card.prizeKey])}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="flex flex-col items-center gap-5 text-center">
              <Reveal direction="up">
                <Image
                  src="/BoyntonBeach.png"
                  alt="Boynton Beach City logo"
                  width={160}
                  height={160}
                  className="h-36 w-auto object-contain"
                  unoptimized
                />
              </Reveal>
              <Reveal direction="up" delay={200}>
                <p className="max-w-2xl text-base leading-8 text-[#030B2E]/75">
                  A special thank you to{" "}
                  <a
                    href="https://www.boynton-beach.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-extrabold text-[#1AD1D7] uppercase transition-opacity hover:opacity-75"
                  >
                    Boynton Beach City
                  </a>{" "}
                  for generously providing the field facilities and for their continued support in making this competition
                  possible. Their commitment to the community and to the growth of the sport has been instrumental in
                  bringing the Granpanpan Nations Cup to life.
                </p>
              </Reveal>
            </div>
          </div>
        </section>


        <section id="rules" className="py-[120px]">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <Reveal direction="up">
              <h2 className="font-heading mb-10 text-center text-4xl text-[#0D47B5] uppercase md:text-5xl">TOURNAMENT RULES</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {rulesCards.map((card, index) => (
                <Reveal key={card.id} direction="up" delay={index * 150} className={`space-y-4 rounded-xl border p-6 ${card.card}`}>
                  <div className={`font-heading flex h-12 w-12 items-center justify-center rounded text-3xl ${card.badge}`}>
                    {card.id}
                  </div>
                  <h4 className="font-heading text-xl uppercase">{card.title}</h4>
                  <p className="text-[15px] leading-7">{card.text}</p>
                </Reveal>
              ))}
            </div>
            <Reveal direction="up" delay={250}>
              <h2 className="font-heading mt-14 text-center text-4xl text-[#0D47B5] uppercase md:text-5xl">OFFICIAL SPONSOR</h2>
            </Reveal>
            <Reveal direction="up" delay={300}>
              <div className="mt-8 flex justify-center">
                <Image
                  src={granpanSponsorLogo}
                  alt="Granpan official sponsor"
                  className="h-auto w-full max-w-[160px] md:max-w-[210px]"
                />
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      <SiteFooter variant="home" />
    </div>
  );
}
