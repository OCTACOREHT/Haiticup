const schedule = [
  {
    phase: "Group Stage",
    dates: "Jul 12 - Jul 26, 2026",
    details: "Round-robin matches determine qualification ranking.",
    matches: "12",
  },
  {
    phase: "Quarterfinals",
    dates: "Jul 30 - Aug 2, 2026",
    details: "Top clubs move into direct elimination fixtures.",
    matches: "4",
  },
  {
    phase: "Semifinals",
    dates: "Aug 6 - Aug 9, 2026",
    details: "Finalists are decided through high-stakes knockout games.",
    matches: "2",
  },
  {
    phase: "Championship",
    dates: "Sep 6, 2026",
    details: "Grand final and closing ceremony at the main venue.",
    matches: "1",
  },
];

export default function Schedule() {
  return (
    <section id="schedule" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Timeline</p>
          <h2 className="section-title">Tournament Calendar</h2>
          <p className="section-intro">
            A fixed schedule keeps teams, staff, and audiences aligned from
            registration close through championship night.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {schedule.map((item, index) => (
            <article
              key={item.phase}
              className="glass-panel reveal-up rounded-2xl p-5 sm:p-6"
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--brand)]">
                    Phase {index + 1}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{item.phase}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
                    {item.details}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-[var(--ink)]">{item.dates}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.11em] text-[var(--muted)]">
                    {item.matches} Official Matches
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="glass-panel reveal-scale delay-1 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-[0.11em] text-[var(--muted)]">
              Registration Closes
            </p>
            <p className="mt-2 text-2xl font-semibold">June 28</p>
          </article>
          <article className="glass-panel reveal-scale delay-2 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-[0.11em] text-[var(--muted)]">
              Kickoff Match
            </p>
            <p className="mt-2 text-2xl font-semibold">July 12</p>
          </article>
          <article className="glass-panel reveal-scale delay-3 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-[0.11em] text-[var(--muted)]">
              Championship Final
            </p>
            <p className="mt-2 text-2xl font-semibold">September 6</p>
          </article>
        </div>
      </div>
    </section>
  );
}
