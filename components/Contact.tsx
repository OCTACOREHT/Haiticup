const contactCards = [
  {
    label: "Phone",
    value: "+1 (561) 704-4613",
    href: "tel:+15617044613",
    note: "Monday to Friday, 9:00 AM - 6:00 PM",
  },
  {
    label: "Email",
    value: "info@granpanpanhaiticup.com",
    href: "mailto:info@granpanpanhaiticup.com",
    note: "Average response time under 24 hours",
  },
  {
    label: "Venue",
    value: "Ezeile Community Center",
    href: "#tournament-info",
    note: "Tournament HQ and championship location",
  },
];

const faqs = [
  {
    question: "Can teams update rosters after registration?",
    answer: "Yes. Roster edits are accepted until July 5, 2026.",
  },
  {
    question: "Is the registration fee refundable?",
    answer:
      "No. Entry fees are non-refundable once a team is officially registered.",
  },
  {
    question: "When should teams arrive on match days?",
    answer: "Teams should check in at least 60 minutes before kickoff.",
  },
];

export default function Contact() {
  return (
    <section id="contact" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="reveal-up">
          <p className="section-kicker">Support Desk</p>
          <h2 className="section-title">Direct Communication</h2>
          <p className="section-intro">
            The operations team is available for registration support,
            tournament questions, and partnership conversations.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            {contactCards.map((card, index) => (
              <article
                key={card.label}
                className="glass-panel reveal-up rounded-2xl p-5 sm:p-6"
                style={{ animationDelay: `${120 + index * 85}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.11em] text-[var(--muted)]">
                  {card.label}
                </p>
                <a
                  href={card.href}
                  className="mt-2 block text-xl font-semibold text-[var(--ink)] hover:text-[var(--brand)]"
                >
                  {card.value}
                </a>
                <p className="mt-2 text-sm text-[var(--muted)]">{card.note}</p>
              </article>
            ))}

            <article className="reveal-up delay-3 rounded-2xl border border-[var(--brand)]/45 bg-[linear-gradient(145deg,rgba(245,187,23,0.2),rgba(241,113,45,0.13))] p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-[#fde7b2]">
                Registration Deadline
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#fff3d7]">
                June 28, 2026
              </p>
              <p className="mt-3 text-sm leading-7 text-[#ffefd2]/90 sm:text-base">
                Teams should complete submission early to avoid final-week
                bottlenecks during roster validation.
              </p>
            </article>
          </div>

          <article className="glass-panel reveal-scale delay-2 rounded-2xl p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
            <div className="mt-5 space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-[var(--stroke)] bg-white/4 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--ink)] sm:text-base">
                    {faq.question}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)] sm:text-base">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            <a
              href="mailto:info@granpanpanhaiticup.com"
              className="cta-button mt-6 w-full border border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--ink)] hover:bg-[var(--accent)]/24"
            >
              Send Tournament Inquiry
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
