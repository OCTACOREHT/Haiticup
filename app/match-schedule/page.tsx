"use client";

import { useEffect } from "react";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "/#prizes", label: "Prizes" },
  { href: "/#rules", label: "Rules" },
  { href: "#groups", label: "Groups" },
  { href: "#bracket", label: "Bracket" },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule", active: true },
  { href: "/#prizes", icon: "confirmation_number", label: "Prizes" },
  { href: "/#rules", icon: "gavel", label: "Rules" },
  { href: "#groups", icon: "groups", label: "Groups" },
  { href: "#bracket", icon: "account_tree", label: "Bracket" },
];

const groupRowsA = ["1st Team A", "2nd Team A", "3rd Team A", "4th Team A"];
const groupRowsB = ["1st Team B", "2nd Team B", "3rd Team B", "4th Team B"];

const fixturesA = [
  ["1st Team A 0 - 0 2nd Team A", "3rd Team A 0 - 0 4th Team A"],
  ["1st Team A 0 - 0 3rd Team A", "2nd Team A 0 - 0 4th Team A"],
  ["1st Team A 0 - 0 4th Team A", "2nd Team A 0 - 0 3rd Team A"],
];

const fixturesB = [
  ["1st Team B 0 - 0 2nd Team B", "3rd Team B 0 - 0 4th Team B"],
  ["1st Team B 0 - 0 3rd Team B", "2nd Team B 0 - 0 4th Team B"],
  ["1st Team B 0 - 0 4th Team B", "2nd Team B 0 - 0 3rd Team B"],
];

const knockoutCards = [
  {
    id: "qf1",
    className: "match-card",
    style: { left: "2%", top: "11.29%" },
    rows: [
      { seed: "1A", team: "1st Group A" },
      { seed: "4B", team: "4th Group B" },
    ],
  },
  {
    id: "qf2",
    className: "match-card",
    style: { left: "2%", top: "40.32%" },
    rows: [
      { seed: "1B", team: "1st Group B" },
      { seed: "4A", team: "4th Group A" },
    ],
  },
  {
    id: "sf1",
    className: "match-card semi-card",
    style: { left: "22.5%", top: "25%" },
    rows: [
      { seed: "SF1", team: "Winner QF1" },
      { seed: "SF1", team: "Winner QF2" },
    ],
  },
  {
    id: "qf3",
    className: "match-card",
    style: { left: "84%", top: "11.29%" },
    rows: [
      { seed: "2A", team: "2nd Group A" },
      { seed: "3B", team: "3rd Group B" },
    ],
  },
  {
    id: "qf4",
    className: "match-card",
    style: { left: "84%", top: "40.32%" },
    rows: [
      { seed: "2B", team: "2nd Group B" },
      { seed: "3A", team: "3rd Group A" },
    ],
  },
  {
    id: "sf2",
    className: "match-card semi-card",
    style: { left: "63.5%", top: "25%" },
    rows: [
      { seed: "SF2", team: "Winner QF3" },
      { seed: "SF2", team: "Winner QF4" },
    ],
  },
];

const mobileBracketRounds = [
  {
    stage: "Quarterfinals",
    matches: [
      {
        id: "QF1",
        rows: [
          { seed: "1A", team: "1st Group A" },
          { seed: "4B", team: "4th Group B" },
        ],
      },
      {
        id: "QF2",
        rows: [
          { seed: "1B", team: "1st Group B" },
          { seed: "4A", team: "4th Group A" },
        ],
      },
      {
        id: "QF3",
        rows: [
          { seed: "2A", team: "2nd Group A" },
          { seed: "3B", team: "3rd Group B" },
        ],
      },
      {
        id: "QF4",
        rows: [
          { seed: "2B", team: "2nd Group B" },
          { seed: "3A", team: "3rd Group A" },
        ],
      },
    ],
  },
  {
    stage: "Semifinals",
    matches: [
      {
        id: "SF1",
        rows: [
          { seed: "SF1", team: "Winner QF1" },
          { seed: "SF1", team: "Winner QF2" },
        ],
      },
      {
        id: "SF2",
        rows: [
          { seed: "SF2", team: "Winner QF3" },
          { seed: "SF2", team: "Winner QF4" },
        ],
      },
    ],
  },
  {
    stage: "Final",
    matches: [
      {
        id: "F",
        rows: [
          { seed: "F", team: "Winner SF1" },
          { seed: "F", team: "Winner SF2" },
        ],
      },
    ],
  },
];

export default function MatchSchedulePage() {
  useEffect(() => {
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
    const VIEWBOX_H = 620;

    const drawBracketLines = () => {
      const qf1 = byId("qf1") as HTMLElement | null;
      const qf2 = byId("qf2") as HTMLElement | null;
      const sf1 = byId("sf1") as HTMLElement | null;
      const finalCard = byId("final") as HTMLElement | null;
      const sf2 = byId("sf2") as HTMLElement | null;
      const qf3 = byId("qf3") as HTMLElement | null;
      const qf4 = byId("qf4") as HTMLElement | null;

      if (!qf1 || !qf2 || !sf1 || !finalCard || !sf2 || !qf3 || !qf4) return;

      const scaleX = VIEWBOX_W / Math.max(shell.clientWidth, 1);
      const scaleY = VIEWBOX_H / Math.max(shell.clientHeight, 1);
      const tx = (x: number) => x * scaleX;
      const ty = (y: number) => y * scaleY;
      const pathH = (x1: number, y: number, x2: number) => `M${tx(x1)} ${ty(y)} H${tx(x2)}`;
      const pathV = (x: number, y1: number, y2: number) => `M${tx(x)} ${ty(y1)} V${ty(y2)}`;

      const bQf1 = toLocalBox(qf1);
      const bQf2 = toLocalBox(qf2);
      const bSf1 = toLocalBox(sf1);
      const bSf2 = toLocalBox(sf2);
      const bQf3 = toLocalBox(qf3);
      const bQf4 = toLocalBox(qf4);

      const sharedSemiCenterY = (bSf1.centerY + bSf2.centerY) / 2;
      let bFinal = toLocalBox(finalCard);
      const finalHeight = bFinal.bottom - bFinal.top;
      const shellHeight = Math.max(shell.clientHeight, 1);
      const finalAnchorRatio = 0.44;
      const desiredFinalTopPercent =
        ((sharedSemiCenterY - finalHeight * finalAnchorRatio) / shellHeight) * 100;

      finalCard.style.top = `${Math.max(0, Math.min(100, desiredFinalTopPercent))}%`;
      bFinal = toLocalBox(finalCard);

      const finalAnchorY = bFinal.top + finalHeight * finalAnchorRatio;
      const connectInset = 0;
      const leftJoinRatio = 0.68;
      const rightJoinRatio = 0.72;

      const leftJoinX = bQf1.right + (bSf1.left - bQf1.right) * leftJoinRatio;
      const rightJoinX = bSf2.right + (bQf3.left - bSf2.right) * rightJoinRatio;

      setPath("line-left-top", pathH(bQf1.right - connectInset, bQf1.centerY, leftJoinX));
      setPath("line-left-bottom", pathH(bQf2.right - connectInset, bQf2.centerY, leftJoinX));
      setPath("line-left-trunk", pathV(leftJoinX, bQf1.centerY, bQf2.centerY));
      setPath("line-left-semi", pathH(leftJoinX, bSf1.centerY, bSf1.left + connectInset));

      setPath("line-right-top", pathH(bQf3.left + connectInset, bQf3.centerY, rightJoinX));
      setPath("line-right-bottom", pathH(bQf4.left + connectInset, bQf4.centerY, rightJoinX));
      setPath("line-right-trunk", pathV(rightJoinX, bQf3.centerY, bQf4.centerY));
      setPath("line-right-semi", pathH(rightJoinX, bSf2.centerY, bSf2.right - connectInset));

      const leftFinalJoinX = bSf1.right + (bFinal.left - bSf1.right) * 0.5;
      const sf1ToFinalDelta = Math.abs(bSf1.centerY - finalAnchorY);

      if (sf1ToFinalDelta <= 2) {
        setPath("line-sf1-final-a", pathH(bSf1.right - connectInset, bSf1.centerY, bFinal.left + connectInset));
        setPath("line-sf1-final-b", "");
        setPath("line-sf1-final-c", "");
      } else {
        setPath("line-sf1-final-a", pathH(bSf1.right - connectInset, bSf1.centerY, leftFinalJoinX));
        setPath("line-sf1-final-b", pathV(leftFinalJoinX, bSf1.centerY, finalAnchorY));
        setPath("line-sf1-final-c", pathH(leftFinalJoinX, finalAnchorY, bFinal.left + connectInset));
      }

      const rightFinalJoinX = bFinal.right + (bSf2.left - bFinal.right) * 0.5;
      const finalToSf2Delta = Math.abs(finalAnchorY - bSf2.centerY);

      if (finalToSf2Delta <= 2) {
        setPath("line-final-sf2-a", pathH(bFinal.right - connectInset, finalAnchorY, bSf2.left + connectInset));
        setPath("line-final-sf2-b", "");
        setPath("line-final-sf2-c", "");
      } else {
        setPath("line-final-sf2-a", pathH(bFinal.right - connectInset, finalAnchorY, rightFinalJoinX));
        setPath("line-final-sf2-b", pathV(rightFinalJoinX, finalAnchorY, bSf2.centerY));
        setPath("line-final-sf2-c", pathH(rightFinalJoinX, bSf2.centerY, bSf2.left + connectInset));
      }
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
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-16">
        <section className="hero-glow relative overflow-hidden py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <p className="text-sm tracking-[0.16em] text-[#FF6B53] uppercase">Official Match Center</p>
            <h1 className="font-heading mt-4 text-3xl leading-[1.05] text-[#004AD3] uppercase sm:text-4xl lg:text-6xl">
              Match Schedule, Poules And Professional Bracket
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#004AD3]/80 md:text-lg md:leading-8">
              8 teams are divided into 2 groups of 4 (Poule A and Poule B). After the group phase,
              teams enter the knockout bracket with quarterfinals, semifinals and final.
            </p>
          </div>
        </section>

        <section id="groups" className="py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <div className="mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FF6B53]">groups</span>
              <h2 className="font-heading text-2xl text-[#004AD3] uppercase sm:text-3xl md:text-4xl">Poules (Group Stage)</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <article className="overflow-hidden rounded-xl border border-[#004AD3]/20 bg-white">
                <div className="border-b border-[#004AD3]/20 bg-white px-6 py-4">
                  <h3 className="font-heading text-xl text-[#FF6B53] uppercase">Poule A</h3>
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
                      {groupRowsA.map((team) => (
                        <tr key={team} className="border-t border-[#004AD3]/15">
                          <td className="px-5 py-3">{team}</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="overflow-hidden rounded-xl border border-[#004AD3]/20 bg-white">
                <div className="border-b border-[#004AD3]/20 bg-white px-6 py-4">
                  <h3 className="font-heading text-xl text-[#FF6B53] uppercase">Poule B</h3>
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
                      {groupRowsB.map((team) => (
                        <tr key={team} className="border-t border-[#004AD3]/15">
                          <td className="px-5 py-3">{team}</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="schedule" className="bg-[#ffffff] py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <div className="mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FF6B53]">calendar_month</span>
              <h2 className="font-heading text-2xl text-[#004AD3] uppercase sm:text-3xl md:text-4xl">Group Match Schedule</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="rounded-xl border border-[#004AD3]/20 bg-white p-6">
                <h3 className="mb-4 text-sm tracking-[0.08em] text-[#FF6B53] uppercase">Poule A Fixtures</h3>
                <div className="space-y-3 text-sm">
                  {fixturesA.map((pair, index) => (
                    <div key={pair.join("-")} className="rounded-lg border border-[#004AD3]/20 p-4">
                      <p className="text-[11px] text-[#004AD3]/65 uppercase">Matchday {index + 1}</p>
                      <p className="mt-1">{pair[0]}</p>
                      <p>{pair[1]}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-[#004AD3]/20 bg-white p-6">
                <h3 className="mb-4 text-sm tracking-[0.08em] text-[#FF6B53] uppercase">Poule B Fixtures</h3>
                <div className="space-y-3 text-sm">
                  {fixturesB.map((pair, index) => (
                    <div key={pair.join("-")} className="rounded-lg border border-[#004AD3]/20 p-4">
                      <p className="text-[11px] text-[#004AD3]/65 uppercase">Matchday {index + 1}</p>
                      <p className="mt-1">{pair[0]}</p>
                      <p>{pair[1]}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="bracket" className="py-14 md:py-[110px]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16">
            <div className="mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FF6B53]">account_tree</span>
              <h2 className="font-heading text-2xl text-[#004AD3] uppercase sm:text-3xl md:text-4xl">Knockout Bracket (8 Teams)</h2>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:hidden">
            <div className="space-y-6">
              {mobileBracketRounds.map((round) => (
                <article key={round.stage} className="rounded-lg border border-[#004AD3]/18 bg-[#ffffff] p-4 shadow-[0_8px_20px_rgba(0,74,211,0.08)]">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#FF6B53] uppercase">{round.stage}</p>
                  <div className="mt-3 space-y-3">
                    {round.matches.map((match) => (
                      <div
                        key={`${round.stage}-${match.id}`}
                        className={`rounded-md border p-3 ${
                          round.stage === "Final"
                            ? "border-[#FF6B53]/28 bg-[#ffffff]"
                            : "border-[#004AD3]/18 bg-white"
                        }`}
                      >
                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[#004AD3]/65 uppercase">{match.id}</p>
                        <div className="mt-2 space-y-1.5">
                          {match.rows.map((row, index) => (
                            <div
                              key={`${round.stage}-${match.id}-${row.team}`}
                              className={`flex items-center justify-between gap-2 text-sm text-[#004AD3] ${
                                index > 0 ? "border-t border-[#004AD3]/14 pt-1.5" : ""
                              }`}
                            >
                              <span className="min-w-[34px] text-[10px] font-semibold tracking-[0.08em] text-[#FF6B53] uppercase">
                                {row.seed}
                              </span>
                              <span className="flex-1 truncate">{row.team}</span>
                              <span className="h-4 min-w-3 rounded-sm bg-[#004AD3]/10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden px-4 md:px-8 xl:px-10 lg:block">
            <div className="pb-2">
              <div className="bracket-shell">
                <svg className="bracket-lines" viewBox="0 0 1480 620" preserveAspectRatio="none" aria-hidden="true">
                  <path id="line-left-top" />
                  <path id="line-left-bottom" />
                  <path id="line-left-trunk" />
                  <path id="line-left-semi" />
                  <path id="line-right-top" />
                  <path id="line-right-bottom" />
                  <path id="line-right-trunk" />
                  <path id="line-right-semi" />
                  <path id="line-sf1-final-a" />
                  <path id="line-sf1-final-b" />
                  <path id="line-sf1-final-c" />
                  <path id="line-final-sf2-a" />
                  <path id="line-final-sf2-b" />
                  <path id="line-final-sf2-c" />
                </svg>

                <span className="stage-label" style={{ left: "2%", top: "3.23%" }}>Quarterfinal 1</span>
                <span className="stage-label" style={{ left: "2%", top: "32.26%" }}>Quarterfinal 2</span>
                <span className="stage-label" style={{ left: "22.5%", top: "18.06%" }}>Semifinal 1</span>
                <span className="stage-label" style={{ left: "63.5%", top: "18.06%" }}>Semifinal 2</span>
                <span className="stage-label" style={{ left: "84%", top: "3.23%" }}>Quarterfinal 3</span>
                <span className="stage-label" style={{ left: "84%", top: "32.26%" }}>Quarterfinal 4</span>

                {knockoutCards.map((card) => (
                  <article key={card.id} id={card.id} className={card.className} style={card.style}>
                    {card.rows.map((row) => (
                      <div key={`${card.id}-${row.seed}-${row.team}`} className="row">
                        <span className="seed">{row.seed}</span>
                        <span>{row.team}</span>
                        <span className="score" />
                      </div>
                    ))}
                  </article>
                ))}

                <article id="final" className="match-card final-card" style={{ left: "43%", top: "21.77%" }}>
                  <p className="final-title">Final</p>
                  <div className="row">
                    <span className="seed">F</span>
                    <span>Winner SF1</span>
                    <span className="score" />
                  </div>
                  <div className="row">
                    <span className="seed">F</span>
                    <span>Winner SF2</span>
                    <span className="score" />
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter variant="schedule" />
    </div>
  );
}
