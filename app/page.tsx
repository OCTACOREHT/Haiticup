"use client";

import { useEffect, useState } from "react";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "#prizes", label: "Prizes" },
  { href: "#rules", label: "Rules" },
  { href: "/match-schedule#groups", label: "Groups" },
  { href: "/match-schedule#bracket", label: "Bracket" },
];

const logistics = [
  { icon: "calendar_month", label: "Dates", value: "July 12, 2026 - Sept 6, 2026" },
  { icon: "location_on", label: "Venue", value: "Ezeile Community Center" },
  { icon: "call", label: "Contact Support", value: "+1 (561) 704-4613" },
];

const rulesCards = [
  {
    id: "1",
    title: "Team Composition",
    text: "Max 18 players per squad. All players must be registered with valid ID by July 1st, 2026.",
    card: "border-black/20 bg-[#F2C230] text-black",
    badge: "bg-black text-[#F2C230]",
  },
  {
    id: "2",
    title: "Match Format",
    text: "Standard 90-minute matches (45 min halves). Group stage followed by direct elimination rounds.",
    card: "border-[#C81010]/35 bg-[#C81010] text-white",
    badge: "bg-white text-[#C81010]",
  },
  {
    id: "3",
    title: "Code of Conduct",
    text: "Zero tolerance for unsportsmanlike behavior. Fair play is the cornerstone of the Haiti Cup.",
    card: "border-[#0D47B5]/35 bg-[#0D47B5] text-white",
    badge: "bg-white text-[#0D47B5]",
  },
];

const frameworkCards = [
  {
    id: "01",
    icon: "groups",
    title: "Competition Format",
    text: "2 groups of 4 teams. Each group plays a single round-robin (6 matches per group). Top teams advance to knockout rounds.",
  },
  {
    id: "02",
    icon: "sports",
    title: "Match Standard",
    text: "Official 90-minute matches (2 x 45). Knockout ties follow official tiebreak procedures, including extra time and penalties when required.",
  },
  {
    id: "03",
    icon: "calendar_month",
    title: "Tournament Window",
    text: "Group stage, knockout rounds, and final are scheduled between July and September 2026 at the Ezeile Community Center.",
  },
  {
    id: "04",
    icon: "verified",
    title: "Professional Oversight",
    text: "Central match operations include scheduling control, result tracking, and officiating standards aligned with competitive tournament play.",
  },
];

const individualPrizeCards = [
  {
    title: "Tournament MVP",
    amount: "$500",
    icon: "star",
    cardClass: "border-[#0D47B5]/18 bg-[#F8FAFF]",
    labelClass: "text-[#0D47B5]",
    iconClass: "text-[#0D47B5]",
  },
  {
    title: "Best Scorer",
    amount: "$300",
    icon: "sports_soccer",
    cardClass: "border-[#C81010]/22 bg-[#FFF9F9]",
    labelClass: "text-[#C81010]",
    iconClass: "text-[#C81010]",
  },
  {
    title: "Top Assists",
    amount: "$200",
    icon: "assistant",
    cardClass: "border-[#F2C230]/40 bg-[#FFFEF5]",
    labelClass: "text-[#C89C00]",
    iconClass: "text-[#C89C00]",
  },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule" },
  { href: "#prizes", icon: "confirmation_number", label: "Prizes" },
  { href: "#rules", icon: "gavel", label: "Rules" },
  { href: "/match-schedule#groups", icon: "groups", label: "Groups" },
  { href: "/match-schedule#bracket", icon: "account_tree", label: "Bracket" },
];

const CHAMPIONSHIP_START = "2026-07-12T18:00:00-05:00";

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

export default function Home() {
  const [countdown, setCountdown] = useState(() => getCountdown(CHAMPIONSHIP_START));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(CHAMPIONSHIP_START));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="#registration" />

      <main className="flex-1">
        <section className="relative flex min-h-screen items-center overflow-hidden bg-black pt-16">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-30 grayscale"
              alt="Night football stadium"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZreNeO4EsA3JT_UE_pFQ4SiYtcjgv2TEgf4p74YCk_M5bqoto4i9ftSDFZpS2XJICKNL8K6DxHXupA5UgJgOpl0OCtxvswNNl3UyhtDRaoFRT5ogZwG5aSJJNb0NAU3K4iaKFuDACuacdchHdu9AZ0IRP1a_oGEejMJdnY9y1rIQQXZTER2eYLfSmgUTm53rOXjVkYeROb8utaCT3g3BwfFiRcwCVgKgTIr8flOQO4JbGqeYEoejpcpkwbKlXqtiFPOiFKI_c"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/70" />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 md:px-16 lg:grid-cols-12">
            <div className="mx-auto flex w-full max-w-[920px] flex-col items-center justify-center gap-2 text-center lg:col-span-12">
              <span className="text-xs font-semibold tracking-[0.16em] text-[#F2C230] uppercase">
                EZEILE COMMUNITY CENTER | JULY 2026
              </span>
              <h1 className="font-heading text-3xl leading-[1.02] text-white uppercase md:text-6xl">
                Get your team ready and{" "}
                <span className="text-[#C81010]">
                  be part of the competition
                </span>
              </h1>

              <div className="mt-8 flex flex-col items-center justify-center gap-6 text-white md:flex-row">
                <div className="flex flex-col">
                  <span className="text-xs font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.1em] text-white/60 uppercase">
                    Champion Prize
                  </span>
                  <span className="text-4xl font-bold [font-family:var(--font-nav),sans-serif] text-[#C81010] md:text-5xl">
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
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <p className="text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-white/70 uppercase">
                      Championship Kickoff Countdown
                    </p>
                    <p className="text-sm [font-family:var(--font-nav),sans-serif] text-white/80">July 12, 2026</p>
                  </div>

                  {countdown.isStarted ? (
                    <p className="text-2xl font-bold [font-family:var(--font-nav),sans-serif] text-[#F2C230] uppercase">
                      The Championship Has Started
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-end justify-center gap-4">
                      <div className="flex w-[124px] items-end justify-center gap-2">
                        <div className="w-[2ch] text-center text-4xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-white md:text-5xl">{String(countdown.days).padStart(2, "0")}</div>
                        <div className="pb-1 text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase">Days</div>
                      </div>
                      <span className="pb-1 text-2xl text-white/35">:</span>
                      <div className="flex w-[124px] items-end justify-center gap-2">
                        <div className="w-[2ch] text-center text-4xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-white md:text-5xl">{String(countdown.hours).padStart(2, "0")}</div>
                        <div className="pb-1 text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase">Hours</div>
                      </div>
                      <span className="pb-1 text-2xl text-white/35">:</span>
                      <div className="flex w-[132px] items-end justify-center gap-2">
                        <div className="w-[2ch] text-center text-4xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-white md:text-5xl">{String(countdown.minutes).padStart(2, "0")}</div>
                        <div className="pb-1 text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase">Minutes</div>
                      </div>
                      <span className="pb-1 text-2xl text-white/35">:</span>
                      <div className="flex w-[134px] items-end justify-center gap-2">
                        <div className="w-[2ch] text-center text-4xl font-bold [font-family:var(--font-nav),sans-serif] tabular-nums text-[#F2C230] md:text-5xl">{String(countdown.seconds).padStart(2, "0")}</div>
                        <div className="pb-1 text-xs font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/70 uppercase">Seconds</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F4F6FB] py-24 md:py-28">
          <div className="mx-auto max-w-[1100px] px-4 md:px-16">
            <div className="max-w-[760px] space-y-4">
              <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.16em] text-[#0D47B5]/70 uppercase">
                About The Tournament
              </p>
              <h2 className="text-4xl font-extrabold [font-family:var(--font-nav),sans-serif] leading-[1.06] text-[#C81010] uppercase md:text-5xl">
                Gran Panpan Haiti Cup 2026
              </h2>
              <p className="text-[15px] leading-8 text-[#0D47B5]/88 md:text-base">
                Gran Panpan Haiti Cup is a structured summer competition designed for elite amateur and
                semi-professional football teams. This edition runs with 8 teams in 2 groups, followed by
                a knockout bracket through quarterfinals, semifinals, and the championship final.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-y border-[#0D47B5]/20 py-6 md:grid-cols-3">
              <div>
                <p className="text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#C81010]">8</p>
                <p className="mt-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#0D47B5]/68 uppercase">
                  Teams
                </p>
              </div>
              <div>
                <p className="text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#C81010]">2</p>
                <p className="mt-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#0D47B5]/68 uppercase">
                  Groups
                </p>
              </div>
              <div>
                <p className="text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#C81010]">19</p>
                <p className="mt-1 text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#0D47B5]/68 uppercase">
                  Matches
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-[#0D47B5]/72 uppercase">
                Tournament Framework
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {frameworkCards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-md border border-[#0D47B5]/14 bg-white p-5 shadow-[0_8px_20px_rgba(13,71,181,0.06)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined rounded-sm border border-[#0D47B5]/15 bg-[#F4F8FF] p-1.5 text-[18px] text-[#C81010]">
                        {card.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-[#0D47B5]/58 uppercase">
                          {card.id}
                        </p>
                        <h3 className="mt-1 text-[13px] font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.08em] text-[#C81010] uppercase">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-[13px] leading-6 text-[#0D47B5]/86">{card.text}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] text-[#0D47B5]/85">
              <div className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#C81010]">calendar_month</span>
                <span>July - September 2026</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#C81010]">location_on</span>
                <span>Ezeile Community Center</span>
              </div>
            </div>
          </div>
        </section>

        <section id="prizes" className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-[1100px] px-4 md:px-16">
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <article className="flex h-full flex-col rounded-lg bg-[#0D47B5] p-7 text-white shadow-[0_14px_34px_rgba(13,71,181,0.28)] lg:col-span-7 md:p-8">
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
                  <span className="material-symbols-outlined rounded-md bg-white/10 p-2.5 text-[22px] text-[#F2C230]">emoji_events</span>
                </div>
                <p className="mt-auto pt-8 text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#F2C230] tabular-nums md:text-6xl">$10,000</p>
              </article>

              <article className="flex h-full flex-col rounded-lg border border-[#0D47B5]/20 bg-[#F8FAFF] p-7 shadow-[0_8px_24px_rgba(13,71,181,0.1)] lg:col-span-5 md:p-8">
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
                  <span className="material-symbols-outlined rounded-md border border-[#0D47B5]/16 bg-white p-2.5 text-[22px] text-[#0D47B5]/72">
                    military_tech
                  </span>
                </div>
                <p className="mt-auto pt-8 text-5xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] tabular-nums md:text-6xl">$3,000</p>
              </article>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {individualPrizeCards.map((card) => (
                <article key={card.title} className={`rounded-md border p-5 ${card.cardClass}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-bold [font-family:var(--font-nav),sans-serif] tracking-[0.1em] uppercase ${card.labelClass}`}>
                      {card.title}
                    </p>
                    <span className={`material-symbols-outlined text-[15px] ${card.iconClass}`}>{card.icon}</span>
                  </div>
                  <p className="mt-2 text-4xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] tabular-nums">
                    {card.amount}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="registration" className="py-[120px]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 md:px-16 lg:grid-cols-12">
            <div className="flex min-h-[400px] flex-col justify-between rounded-xl bg-[#C81010] p-12 text-white lg:col-span-7">
              <div>
                <h2 className="font-heading mb-4 text-4xl uppercase md:text-6xl">REGISTER NOW</h2>
                <p className="mb-8 max-w-md text-lg">
                  Secure your team&apos;s spot in the most anticipated tournament of the year. Limited slots available.
                </p>
              </div>
              <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
                <div className="flex flex-col">
                  <span className="text-sm opacity-70 uppercase">Registration Fee</span>
                  <span className="font-heading text-5xl">
                    $1,000 <span className="text-3xl">/ TEAM</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded-sm bg-white px-12 py-5 text-sm font-bold text-[#C81010] uppercase transition-transform hover:scale-105"
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="space-y-8 rounded-xl border border-[#0D47B5]/15 bg-white p-12 lg:col-span-5">
              <h3 className="font-heading border-b border-[#0D47B5]/20 pb-4 text-3xl text-[#0D47B5] uppercase">LOGISTICS</h3>
              <div className="space-y-6">
                {logistics.map((item) => (
                  <div key={item.label} className="flex gap-6">
                    <span className="material-symbols-outlined text-[#C81010]">{item.icon}</span>
                    <div>
                      <p className="text-sm text-[#0D47B5]/60 uppercase">{item.label}</p>
                      <p className="text-lg text-[#0D47B5]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="schedule" className="bg-[#F8FAFF] py-[120px]">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="mb-12 flex items-end justify-between">
              <h2 className="font-heading text-4xl text-[#0D47B5] uppercase md:text-6xl">MATCH SCHEDULE</h2>
              <div className="flex items-center gap-2 text-[#C81010]">
                <span className="h-3 w-3 animate-pulse rounded-full bg-[#C81010]" />
                <span className="text-sm uppercase">Live Scoreboard Coming Soon</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#0D47B5]/15 bg-white">
              <div className="grid grid-cols-1 divide-y divide-[#0D47B5]/15">
                <div className="flex flex-col items-center justify-between gap-6 p-8 transition-colors hover:bg-[#0D47B5]/10 md:flex-row">
                  <div className="order-2 flex items-center gap-8 md:order-1">
                    <div className="text-right">
                      <span className="font-heading block text-sm text-[#0D47B5] uppercase">Team Alpha</span>
                      <span className="text-[#0D47B5]/70">Port-au-Prince</span>
                    </div>
                    <div className="rounded bg-[#F3F6FF] px-4 font-heading text-2xl text-[#0D47B5]">VS</div>
                    <div className="text-left">
                      <span className="font-heading block text-sm text-[#0D47B5] uppercase">Team Beta</span>
                      <span className="text-[#0D47B5]/70">Cap-Haitien</span>
                    </div>
                  </div>
                  <div className="order-1 text-center md:order-2 md:text-right">
                    <p className="text-sm text-[#C81010] uppercase">Opening Match</p>
                    <p className="text-base text-[#0D47B5]">July 12, 18:00 EST</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-20 text-[#0D47B5]/40">
                  <span className="material-symbols-outlined mb-4 text-6xl">pending_actions</span>
                  <p className="text-sm tracking-[0.1em] uppercase">Full Match Schedule to be announced June 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rules" className="py-[120px]">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <h2 className="font-heading mb-10 text-center text-4xl text-[#0D47B5] uppercase md:text-5xl">TOURNAMENT RULES</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {rulesCards.map((card) => (
                <div key={card.id} className={`space-y-4 rounded-xl border p-6 ${card.card}`}>
                  <div className={`font-heading flex h-12 w-12 items-center justify-center rounded text-3xl ${card.badge}`}>
                    {card.id}
                  </div>
                  <h4 className="font-heading text-xl uppercase">{card.title}</h4>
                  <p className="text-[15px] leading-7">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter variant="home" />
    </div>
  );
}
