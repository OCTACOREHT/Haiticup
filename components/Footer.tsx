import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#050911] pb-10 pt-14">
      <div className="section-shell">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="font-display text-4xl tracking-[0.1em] text-[var(--brand)]">
              GPHC
            </p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--muted)] sm:text-base">
              Gran Panpan Haiti Cup is a professionally managed football
              championship focused on serious competition and regional impact.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Navigate
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="#about" className="text-sm text-[var(--ink)] hover:text-[var(--brand)]">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#registration"
                  className="text-sm text-[var(--ink)] hover:text-[var(--brand)]"
                >
                  Registration
                </Link>
              </li>
              <li>
                <Link
                  href="#schedule"
                  className="text-sm text-[var(--ink)] hover:text-[var(--brand)]"
                >
                  Schedule
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-sm text-[var(--ink)] hover:text-[var(--brand)]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Tournament
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <li>Window: Jul 12 - Sep 6, 2026</li>
              <li>Venue: Ezeile Community Center</li>
              <li>Prize Pool: $13,500+</li>
              <li>Format: Group + Knockout</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Contact
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="tel:+15617044613" className="text-[var(--ink)] hover:text-[var(--brand)]">
                  +1 (561) 704-4613
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@granpanpanhaiticup.com"
                  className="text-[var(--ink)] hover:text-[var(--brand)]"
                >
                  info@granpanpanhaiticup.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-sm text-[var(--muted)]">
          <p>Copyright {year} Gran Panpan Haiti Cup. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
