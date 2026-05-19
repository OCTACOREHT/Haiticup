const phases = [
  { name: "Group Stage", window: "Jul 12 - Jul 26", format: "Round-robin" },
  {
    name: "Quarterfinals",
    window: "Jul 30 - Aug 2",
    format: "Single elimination",
  },
  { name: "Semifinals", window: "Aug 6 - Aug 9", format: "Two fixtures" },
  { name: "Championship", window: "Sep 6", format: "Grand final" },
];

const standards = [
  "FIFA-aligned match operations",
  "Professional officiating and discipline process",
  "Uniform compliance and roster control",
  "Structured scheduling with official reporting",
];

export default function TournamentInfo() {
  return (
    <section id="tournament-info" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Competition Framework</p>
          <h2 className="section-title">Organized For Serious Clubs</h2>
          <p className="section-intro">
            The tournament format gives each team a clear path from early phase
            performance to knockout qualification and championship contention.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="glass-panel reveal-scale rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Official Window
            </p>
            <p className="mt-2 text-3xl font-semibold">July 12 - September 6</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
              Eight-week competition cycle with coordinated progression and a
              fixed final event date.
            </p>
          </article>

          <article className="glass-panel reveal-scale delay-1 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Main Venue
            </p>
            <p className="mt-2 text-3xl font-semibold">Ezeile Community Center</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
              Centralized operations, match-day control, and tournament
              presentation aligned to a single competition hub.
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="glass-panel reveal-up delay-2 rounded-2xl p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Phase Timeline</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {phases.map((phase) => (
                <div
                  key={phase.name}
                  className="rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-[var(--ink)]">{phase.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{phase.window}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.1em] text-[var(--brand)]">
                    {phase.format}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="reveal-up delay-3 rounded-2xl border border-[var(--accent)]/45 bg-[linear-gradient(145deg,rgba(44,117,246,0.22),rgba(20,185,161,0.16))] p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Operational Standards</h3>
            <ul className="mt-5 space-y-3">
              {standards.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/16 bg-black/14 px-4 py-3 text-sm text-[#dfe9ff] sm:text-base"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
