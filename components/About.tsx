const valuePillars = [
  {
    title: "Competitive Integrity",
    description:
      "Clear rules, structured scheduling, and transparent officiating keep every match serious and fair.",
  },
  {
    title: "Professional Production",
    description:
      "Unified match-day operations, media-ready presentation, and premium team experience across the tournament.",
  },
  {
    title: "Regional Impact",
    description:
      "The cup strengthens Caribbean football ties while creating visibility for clubs, players, and partners.",
  },
];

const metrics = [
  { label: "Tournament Length", value: "8 Weeks" },
  { label: "Match Phases", value: "4 Stages" },
  { label: "Final Ceremony", value: "Sep 6, 2026" },
];

export default function About() {
  return (
    <section id="about" className="py-20 sm:py-24">
      <div className="section-shell">
        <p className="section-kicker reveal-up">Tournament Profile</p>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div className="reveal-up delay-1">
            <h2 className="section-title">Built To Feel Like A Major Event</h2>
            <p className="section-intro">
              Gran Panpan Haiti Cup is designed as a high-standard football
              platform where organization quality matters as much as the games.
              Every detail is built to give teams a serious competitive
              environment and a tournament brand they are proud to represent.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="glass-panel rounded-2xl p-4 sm:p-5"
                >
                  <p className="text-xs uppercase tracking-[0.11em] text-[var(--muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{metric.value}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4 reveal-scale delay-2">
            {valuePillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className="glass-panel rounded-2xl p-5 sm:p-6"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--brand)]">
                  Pillar {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)] sm:text-base">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
