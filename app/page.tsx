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
  { icon: "calendar_month", label: "Dates", value: "July 12, 2026 - Sept 6, 2026" },
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
  { name: "Elite Energy FC", logo: "/Logo ekip/1804 FC.png" },
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

const CHAMPIONSHIP_START = "2026-07-12T18:00:00-05:00";

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

export default function Home() {
  const prizesRef = useRef<HTMLElement>(null);
  const [hasSeenPrizes, setHasSeenPrizes] = useState(false);
  const [countdown, setCountdown] = useState<ReturnType<typeof getCountdown>>(INITIAL_COUNTDOWN);
  const [animatedPrizeAmounts, setAnimatedPrizeAmounts] = useState<Record<PrizeKey, number>>({
    champion: 0,
    runnerUp: 0,
    mvp: 0,
    bestScorer: 0,
    topAssists: 0,
  });

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
              <Image
                src="/G%20logo.png"
                alt="G logo"
                width={180}
                height={220}
                unoptimized
                priority
                className="mb-4 h-24 w-auto object-contain md:h-32"
              />
              <span className="text-xs font-semibold tracking-[0.16em] text-[#1AD1D7] uppercase">
                EZELL HESTER COMMUNITY CENTER JULY 2026
              </span>
              <h1 className="font-heading text-3xl leading-[1.02] text-white uppercase md:text-6xl">
                Get your team ready and{" "}
                <span className="text-[#FF6B53]">
                  be part of the competition
                </span>
              </h1>

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
                    <p className="text-sm [font-family:var(--font-nav),sans-serif] text-white/80">July 12, 2026</p>
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

        {/* ── Registered Teams Marquee ──────────────────────────────────────── */}
        <section className="bg-[#f8f9fa] py-16 border-b border-[#0D47B5]/10 overflow-hidden">
          <Reveal direction="up" className="mx-auto max-w-[1180px] px-4 md:px-16 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.16em] text-[#0D47B5]/72 uppercase">
                The Competition
              </p>
              <h3 className="mt-2 text-2xl md:text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] uppercase">
                Teams Already Registered
              </h3>
            </div>
            <Link
              href="/register"
              className="rounded bg-[#FF6B53] px-8 py-3 text-[13px] font-bold text-white uppercase tracking-wider hover:bg-[#e05a45] transition-colors whitespace-nowrap"
            >
              Join The Roster
            </Link>
          </Reveal>
          
          <Reveal direction="up" delay={200} className="w-full py-8">
            <div className="w-full [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <InfiniteSlider gap={32} duration={40} durationOnHover={80}>
                {registeredTeams.map((team, idx) => (
                  <div key={idx} className="flex h-[90px] w-[130px] items-center justify-center">
                    <Image src={team.logo} alt={team.name} width={130} height={130} className="max-h-full max-w-full object-contain" unoptimized />
                  </div>
                ))}
              </InfiniteSlider>
            </div>
          </Reveal>
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

        <section id="registration" className="py-[120px]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 md:px-16 lg:grid-cols-12">
            <Reveal direction="left" className="lg:col-span-7">
              <div className="flex min-h-[400px] h-full flex-col justify-between rounded-xl bg-[#FF6B53] p-12 text-white">
                <div>
                  <h2 className="font-heading mb-4 text-4xl uppercase md:text-6xl">REGISTER NOW</h2>
                  <p className="mb-8 max-w-md text-lg">
                    Secure your team&apos;s spot in the most anticipated tournament of the year. Limited slots available.
                  </p>
                </div>
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold [font-family:var(--font-nav),sans-serif] opacity-70 uppercase">
                      Registration Fee
                    </span>
                    <span className="text-5xl font-extrabold [font-family:var(--font-nav),sans-serif]">
                      $1,000 <span className="text-3xl font-bold [font-family:var(--font-nav),sans-serif]">/ TEAM</span>
                    </span>
                  </div>
                  <Link
                    href="/register"
                    className="rounded-sm bg-white px-12 py-5 text-sm font-bold !text-[#1AD1D7] uppercase transition-transform hover:scale-105 hover:bg-white active:!text-[#1AD1D7] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={200} className="lg:col-span-5">
              <div className="h-full space-y-8 rounded-xl border border-[#0D47B5]/15 bg-white p-12">
                <h3 className="font-heading border-b border-[#0D47B5]/20 pb-4 text-3xl text-[#0D47B5] uppercase">LOGISTICS</h3>
                <div className="space-y-6">
                  {logistics.map((item) => (
                    <div key={item.label} className="flex gap-6">
                      <AppIcon name={item.icon} className="text-[#FF6B53]" />
                      <div>
                        <p className="text-sm text-[#0D47B5]/60 uppercase">{item.label}</p>
                        <p className="text-lg text-[#0D47B5]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="schedule" className="bg-[#ffffff] py-[120px]">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <Reveal direction="up">
              <div className="mb-12 flex items-end justify-between">
                <h2 className="font-heading text-4xl text-[#0D47B5] uppercase md:text-6xl">MATCH SCHEDULE</h2>
                <div className="flex items-center gap-2 text-[#FF6B53]">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#FF6B53]" />
                  <span className="text-sm uppercase">Live Scoreboard Coming Soon</span>
                </div>
              </div>
            </Reveal>

            <Reveal direction="up" delay={200}>
              <div className="overflow-hidden rounded-xl border border-[#0D47B5]/15 bg-white">
                <div className="flex h-[220px] flex-col items-center justify-center gap-3 bg-white text-[#0D47B5]/45 md:h-[280px]">
                  <AppIcon name="pending_actions" className="text-5xl text-[#0D47B5]/35" />
                  <p className="text-center text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-[#0D47B5]/45 uppercase md:text-sm">
                    Full Match Schedule To Be Announced June 2026
                  </p>
                </div>
              </div>
            </Reveal>
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
