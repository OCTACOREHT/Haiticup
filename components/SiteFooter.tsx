import Link from "next/link";
import AppIcon from "@/components/AppIcon";

type FooterVariant = "home" | "schedule" | "register" | "contact";

type FooterLink = {
  href: string;
  label: string;
};

type FooterContact = {
  icon: string;
  label: string;
  value: string;
  href?: string;
};

type SiteFooterProps = {
  variant: FooterVariant;
};

const footerNavigation: Record<FooterVariant, FooterLink[]> = {
  home: [
    { href: "/", label: "Home" },
    { href: "/match-schedule", label: "Match Schedule" },
    { href: "#prizes", label: "Prizes" },
    { href: "#rules", label: "Rules" },
    { href: "/match-schedule#groups", label: "Groups" },
    { href: "/match-schedule#bracket", label: "Bracket" },
  ],
  schedule: [
    { href: "/", label: "Home" },
    { href: "#schedule", label: "Match Schedule" },
    { href: "/#prizes", label: "Prizes" },
    { href: "/#rules", label: "Rules" },
    { href: "#groups", label: "Groups" },
    { href: "#bracket", label: "Bracket" },
  ],
  register: [
    { href: "/", label: "Home" },
    { href: "/match-schedule", label: "Match Schedule" },
    { href: "/#prizes", label: "Prizes" },
    { href: "/#rules", label: "Rules" },
    { href: "/match-schedule#groups", label: "Groups" },
    { href: "/match-schedule#bracket", label: "Bracket" },
  ],
  contact: [
    { href: "/", label: "Home" },
    { href: "/match-schedule", label: "Match Schedule" },
    { href: "/register", label: "Register" },
    { href: "/#rules", label: "Rules" },
    { href: "/match-schedule#groups", label: "Groups" },
    { href: "/match-schedule#bracket", label: "Bracket" },
  ],
};

const footerResources: FooterLink[] = [
  { href: "/register", label: "Team Registration" },
  { href: "/contact", label: "Contact Center" },
  { href: "/match-schedule#groups", label: "Group Stage" },
  { href: "/match-schedule#bracket", label: "Knockout Bracket" },
];

const footerContacts: FooterContact[] = [
  {
    icon: "mail",
    label: "Official Email",
    value: "info@granpanpannationscup.com",
    href: "mailto:info@granpanpannationscup.com",
  },
  { icon: "calendar_month", label: "Tournament Window", value: "July - September 2026" },
  { icon: "location_on", label: "Venue", value: "Ezell Hester Community Center" },
  { icon: "call", label: "Operations Desk", value: "+1 (561) 704-4613" },
];

export default function SiteFooter({ variant }: SiteFooterProps) {
  const links = footerNavigation[variant];

  return (
    <footer className="w-full border-t border-[#004AD3]/15 bg-[#030B2E] text-white">
      <div className="mx-auto max-w-[1280px] px-4 pt-14 pb-6 md:px-16 md:pt-16 md:pb-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <p className="text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.14em] text-white/65 uppercase">
              Official Tournament Platform
            </p>
            <h2 className="text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] leading-tight uppercase md:text-4xl">
              Granpanpan Nations Cup
            </h2>
            <p className="max-w-md text-sm leading-7 text-white/78 md:text-base">
              Structured football competition for elite amateur and semi-professional teams,
              managed with official match operations and knockout-stage standards.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="mb-4 text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/55 uppercase">
                Navigation
              </p>
              <div className="flex flex-col gap-3">
                {links.map((item) => (
                  <Link
                    key={`${variant}-${item.href}-${item.label}`}
                    href={item.href}
                    className="text-sm [font-family:var(--font-nav),sans-serif] text-white/88 transition-colors hover:text-[#1AD1D7]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/55 uppercase">
                Tournament
              </p>
              <div className="flex flex-col gap-3">
                {footerResources.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm [font-family:var(--font-nav),sans-serif] text-white/88 transition-colors hover:text-[#1AD1D7]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.12em] text-white/55 uppercase">
                Operations
              </p>
              <div className="flex flex-col gap-3.5">
                {footerContacts.map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <AppIcon name={item.icon} className="mt-0.5 text-[18px] text-[#1AD1D7]" />
                    <div>
                      <p className="text-[10px] font-semibold [font-family:var(--font-nav),sans-serif] tracking-[0.1em] text-white/55 uppercase">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm [font-family:var(--font-nav),sans-serif] text-white/90 transition-colors hover:text-[#1AD1D7]"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm [font-family:var(--font-nav),sans-serif] text-white/90">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9 border-t border-white/20 pt-6">
          <p className="text-center text-xs [font-family:var(--font-nav),sans-serif] tracking-[0.06em] text-white/60 uppercase">
            &copy; 2026 Granpanpan Nations Cup. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
