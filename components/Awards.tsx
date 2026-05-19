const awards = [
  {
    title: "Tournament MVP",
    award: "$500",
    note: "Highest-impact all-around performer",
  },
  {
    title: "Golden Boot",
    award: "$300",
    note: "Top goal scorer across all phases",
  },
  {
    title: "Top Assist Provider",
    award: "$200",
    note: "Most decisive final passes",
  },
  {
    title: "Best Goalkeeper",
    award: "Official Trophy",
    note: "Most influential defensive performances",
  },
  {
    title: "Fair Play Team",
    award: "Official Trophy",
    note: "Strongest discipline and sportsmanship record",
  },
  {
    title: "Best Young Player",
    award: "Official Trophy",
    note: "Standout under-21 tournament talent",
  },
];

export default function Awards() {
  return (
    <section id="awards" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Recognition Program</p>
          <h2 className="section-title">Performance Gets Rewarded</h2>
          <p className="section-intro">
            Beyond team results, the tournament highlights individual excellence
            and professional conduct with structured awards and ceremony.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {awards.map((award, index) => (
            <article
              key={award.title}
              className="glass-panel reveal-scale rounded-2xl p-5"
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--brand)]">
                Award
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">
                {award.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{award.note}</p>
              <p className="mt-5 text-lg font-semibold text-[var(--ink)]">
                {award.award}
              </p>
            </article>
          ))}
        </div>

        <article className="reveal-up delay-2 mt-8 rounded-2xl border border-[var(--brand)]/40 bg-[linear-gradient(145deg,rgba(245,187,23,0.2),rgba(241,113,45,0.15))] p-6 sm:p-7">
          <p className="text-xs uppercase tracking-[0.12em] text-[#ffe8ac]">
            Awards Ceremony
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#fff7de]">
            September 6, 2026 | 4:00 PM - 6:00 PM
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#fff5d6]/90 sm:text-base">
            All official awards are presented immediately after the
            championship match at Ezeile Community Center, during the closing
            event protocol.
          </p>
        </article>
      </div>
    </section>
  );
}
