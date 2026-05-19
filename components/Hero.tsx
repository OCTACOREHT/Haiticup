import Image from "next/image";
import Link from "next/link";

const highlights = [
  { label: "Prize Pool", value: "$13,500+" },
  { label: "Registration Fee", value: "$1,000" },
  { label: "Tournament Window", value: "Jul 12 - Sep 6, 2026" },
];

export default function Hero() {
  return (
    <section className="relative pb-20 pt-7 sm:pb-24 sm:pt-10">
      <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-[var(--accent)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-32 h-52 w-52 rounded-full bg-[var(--brand-2)]/20 blur-3xl" />

      <div className="section-shell">
        <header className="reveal-up glass-panel mb-8 rounded-2xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <p className="flyer-display text-lg font-semibold tracking-[0.08em] text-[var(--brand)] sm:text-xl">
              GRAN PANPAN HAITI CUP
            </p>
            <nav className="flex flex-wrap items-center gap-2">
              <Link className="chip" href="#about">
                About
              </Link>
              <Link className="chip" href="#registration">
                Register
              </Link>
              <Link className="chip" href="#contact">
                Contact
              </Link>
            </nav>
          </div>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="section-kicker reveal-up delay-1">2026 Edition</p>
            <h1 className="section-title reveal-up delay-2 text-[var(--ink)]">
              Elite Football.
              <br />
              Haitian Pride.
              <br />
              Global Stage.
            </h1>
            <p className="section-intro reveal-up delay-3">
              A fully organized international championship built for ambitious
              clubs. Compete in a professionally managed format with strong
              branding, serious visibility, and meaningful prize money.
            </p>

            <div className="reveal-up delay-4 mt-8 flex flex-wrap gap-3">
              <Link
                className="cta-button bg-[var(--brand)] text-[#10131e] hover:bg-[#f7ca54]"
                href="#registration"
              >
                Start Team Registration
              </Link>
              <Link
                className="cta-button border border-[var(--stroke)] bg-white/5 text-[var(--ink)] hover:bg-white/10"
                href="#tournament-info"
              >
                View Tournament Details
              </Link>
              <a
                className="cta-button border border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--ink)] hover:bg-[var(--accent)]/24"
                href="tel:+15617044613"
              >
                Call +1 (561) 704-4613
              </a>
            </div>
          </div>

          <div className="reveal-scale delay-2">
            <article className="glass-panel rounded-3xl p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-4">
                <Image
                  src="/image.png"
                  alt="Gran Panpan Haiti Cup logo"
                  width={100}
                  height={100}
                  className="h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-xl"
                  priority
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    Host Venue
                  </p>
                  <p className="text-xl font-semibold">Ezeile Community Center</p>
                  <p className="text-sm text-[var(--muted)]">Port-au-Prince</p>
                </div>
              </div>

              <div className="space-y-3">
                {highlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[var(--stroke)] bg-white/3 px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
