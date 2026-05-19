const teams = [
  { name: "Caribbean Strikers", status: "Confirmed", founded: "2018" },
  { name: "Port-au-Prince FC", status: "Confirmed", founded: "2015" },
  { name: "Island United", status: "Confirmed", founded: "2019" },
  { name: "Haitian Legends", status: "Confirmed", founded: "2010" },
  { name: "Capital Kings", status: "Confirmed", founded: "2020" },
  { name: "Elite Warriors", status: "Candidate", founded: "2022" },
  { name: "North Shore Athletic", status: "Candidate", founded: "2017" },
  { name: "Bel Air Sporting", status: "Candidate", founded: "2021" },
];

export default function Teams() {
  return (
    <section id="teams" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Club Field</p>
          <h2 className="section-title">Participating Team Pipeline</h2>
          <p className="section-intro">
            Confirmed entries are published as operational checks close.
            Additional candidates remain in review until final roster lock.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teams.map((team, index) => {
            const isConfirmed = team.status === "Confirmed";

            return (
              <article
                key={team.name}
                className="glass-panel reveal-scale rounded-2xl p-5"
                style={{ animationDelay: `${120 + index * 65}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  Founded {team.founded}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">
                  {team.name}
                </h3>
                <p
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${
                    isConfirmed
                      ? "border border-[#49cb93]/45 bg-[#49cb93]/12 text-[#7de7b4]"
                      : "border border-[#f5bb17]/45 bg-[#f5bb17]/12 text-[#ffe08f]"
                  }`}
                >
                  {team.status}
                </p>
              </article>
            );
          })}
        </div>

        <article className="reveal-up delay-3 mt-8 rounded-2xl border border-[var(--accent)]/42 bg-[linear-gradient(145deg,rgba(44,117,246,0.22),rgba(20,185,161,0.14))] p-6">
          <p className="text-xs uppercase tracking-[0.12em] text-[#d6e6ff]">
            Capacity Notice
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--ink)]">
            Limited slots remain for the 2026 bracket.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#dce8ff]/84 sm:text-base">
            Candidate teams are processed in submission order. Early completion
            of eligibility and payment steps increases selection priority.
          </p>
        </article>
      </div>
    </section>
  );
}
