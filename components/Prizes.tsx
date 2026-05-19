const teamPrizes = [
  { rank: "Champion", amount: "$10,000", note: "Main trophy + title" },
  { rank: "Runner-up", amount: "$3,000", note: "Silver placement" },
  { rank: "Third Place", amount: "Official Certificate", note: "Bronze finish" },
];

const individualAwards = [
  { title: "Tournament MVP", amount: "$500" },
  { title: "Golden Boot", amount: "$300" },
  { title: "Top Assist Provider", amount: "$200" },
];

export default function Prizes() {
  return (
    <section id="prizes" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Prize Structure</p>
          <h2 className="section-title">Clear Rewards For Performance</h2>
          <p className="section-intro">
            The payout model balances team achievement and individual
            excellence, keeping every stage competitive from kickoff to final
            whistle.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {teamPrizes.map((prize, index) => (
            <article
              key={prize.rank}
              className="glass-panel reveal-scale rounded-2xl p-6"
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                {prize.rank}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">
                {prize.amount}
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">{prize.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="glass-panel reveal-up delay-2 rounded-2xl p-6 sm:p-7">
            <h3 className="text-xl font-semibold text-[var(--ink)]">
              Individual Awards
            </h3>
            <div className="mt-5 space-y-3">
              {individualAwards.map((award) => (
                <div
                  key={award.title}
                  className="flex items-center justify-between rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-3"
                >
                  <p className="text-sm text-[var(--muted)] sm:text-base">{award.title}</p>
                  <p className="font-semibold text-[var(--brand)]">{award.amount}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="reveal-up delay-3 rounded-2xl border border-[var(--brand)]/45 bg-[linear-gradient(140deg,rgba(245,187,23,0.2),rgba(241,113,45,0.16))] p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.14em] text-[#f9df9f]">
              Total Pool
            </p>
            <p className="mt-3 font-display text-6xl leading-none tracking-[0.08em] text-[#fff6d6]">
              $13,500+
            </p>
            <p className="mt-4 text-sm leading-7 text-[#fff2d2]/85 sm:text-base">
              Designed to reward clubs that perform and players who define the
              tournament with decisive moments.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
