import Link from "next/link";

const registrationSteps = [
  {
    title: "Submit Team Profile",
    details: "Provide club name, manager contact, and initial roster list.",
  },
  {
    title: "Validate Eligibility",
    details:
      "Tournament operations review documents and roster requirements.",
  },
  {
    title: "Complete Entry Payment",
    details: "Secure the $1,000 registration fee and receive confirmation.",
  },
  {
    title: "Receive Kickoff Pack",
    details:
      "Get your schedule, operations handbook, and pre-tournament checklist.",
  },
];

export default function Registration() {
  return (
    <section id="registration" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Team Registration</p>
          <h2 className="section-title">Join The Competition</h2>
          <p className="section-intro">
            Registration is straightforward and managed for speed. Once approved,
            your team enters the official 2026 tournament bracket and operations
            workflow.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="glass-panel reveal-scale rounded-2xl p-5 sm:p-7">
            <h3 className="text-xl font-semibold">Registration Flow</h3>
            <ol className="mt-6 space-y-4">
              {registrationSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--brand)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)] sm:text-base">
                    {step.details}
                  </p>
                </li>
              ))}
            </ol>
          </article>

          <div className="space-y-4 reveal-up delay-2">
            <article className="rounded-2xl border border-[var(--brand)]/40 bg-[linear-gradient(145deg,rgba(245,187,23,0.2),rgba(241,113,45,0.14))] p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-[#ffe4a2]">
                Entry Fee
              </p>
              <p className="mt-2 font-display text-6xl leading-none tracking-[0.06em] text-white">
                $1,000
              </p>
              <p className="mt-3 text-sm leading-7 text-[#fff1d2]/88 sm:text-base">
                One fee per team. Covers operations, venue execution, and core
                tournament services.
              </p>
              <Link
                href="#contact"
                className="cta-button mt-5 w-full bg-[#10131d] text-[#f9d179] hover:bg-[#171d2a]"
              >
                Request Registration Support
              </Link>
            </article>

            <article className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Important Dates
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-3">
                  <p className="text-sm text-[var(--muted)]">Registration Deadline</p>
                  <p className="mt-1 text-lg font-semibold">June 28, 2026</p>
                </div>
                <div className="rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-3">
                  <p className="text-sm text-[var(--muted)]">Roster Lock Date</p>
                  <p className="mt-1 text-lg font-semibold">July 5, 2026</p>
                </div>
                <div className="rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-3">
                  <p className="text-sm text-[var(--muted)]">Tournament Kickoff</p>
                  <p className="mt-1 text-lg font-semibold">July 12, 2026</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
