const rules = [
  {
    title: "Match Rules",
    items: [
      "Standard 90-minute format with extra time when required.",
      "Penalty shootout applies when knockout ties remain level.",
      "Three substitutions are permitted per match.",
    ],
  },
  {
    title: "Team Eligibility",
    items: [
      "Roster minimum is 13 players, maximum is 20 players.",
      "Each player may represent one registered team only.",
      "Identity verification is required before first fixture.",
    ],
  },
  {
    title: "Discipline",
    items: [
      "Two yellow cards trigger automatic suspension.",
      "Direct red cards result in mandatory review and sanctions.",
      "Unsportsmanlike conduct may lead to fines or disqualification.",
    ],
  },
  {
    title: "Points System",
    items: [
      "Win = 3 points, draw = 1 point, loss = 0 points.",
      "Goal difference is the first tiebreak criterion.",
      "Head-to-head record is used for secondary tie resolution.",
    ],
  },
];

export default function Rules() {
  return (
    <section id="rules" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Competition Rules</p>
          <h2 className="section-title">Clarity Before Kickoff</h2>
          <p className="section-intro">
            The rulebook is built to protect competitive fairness, reduce
            ambiguity, and maintain the professional standard expected from all
            participating clubs.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {rules.map((group, index) => (
            <article
              key={group.title}
              className="glass-panel reveal-scale rounded-2xl p-5 sm:p-6"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <h3 className="text-xl font-semibold text-[var(--ink)]">{group.title}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)] sm:text-base">
                {group.items.map((item) => (
                  <li key={item} className="rounded-lg border border-[var(--stroke)] bg-white/4 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <article className="reveal-up delay-3 mt-8 rounded-2xl border border-[#f1712d]/45 bg-[linear-gradient(145deg,rgba(241,113,45,0.22),rgba(245,187,23,0.15))] p-6 sm:p-7">
          <p className="text-xs uppercase tracking-[0.12em] text-[#ffe1bd]">
            Governance Notice
          </p>
          <p className="mt-2 text-xl font-semibold text-[#fff1e4]">
            Tournament committee decisions are final after formal review.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#ffe9d3]/86 sm:text-base">
            Appeals must be submitted in writing with supporting evidence
            within 24 hours of the disputed incident.
          </p>
        </article>
      </div>
    </section>
  );
}
