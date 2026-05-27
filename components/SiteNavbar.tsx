"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";

type NavbarLink = {
  href: string;
  label: string;
};

type MobileNavbarLink = NavbarLink & {
  icon: string;
  active?: boolean;
};

type SiteNavbarProps = {
  desktopLinks: NavbarLink[];
  mobileLinks: MobileNavbarLink[];
  registerHref: string;
  registerLabel?: string;
};

export default function SiteNavbar({
  desktopLinks,
  mobileLinks,
  registerHref,
  registerLabel = "REGISTER NOW",
}: SiteNavbarProps) {
  const contactHref = "/contact";
  const contactLabel = "CONTACT";
  const logoSrc = "/Granpanpan%20Nation%20cupfull.png";
  const logoWidth = 398;
  const logoHeight = 100;
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/15 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.09)] backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 md:px-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={logoSrc}
              alt="Granpanpan Nations Cup logo"
              width={logoWidth}
              height={logoHeight}
              quality={100}
              priority
              className="mt-2 h-11 w-auto bg-transparent object-contain"
            />
          </Link>

          <div className="hidden items-center gap-4 lg:flex">
            <nav className="flex items-center gap-5">
              {desktopLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-1 py-2 text-[15px] font-bold tracking-normal [font-family:var(--font-nav),sans-serif] !text-black transition-colors hover:!text-black"
                  style={{ color: "#000000" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href={contactHref}
              className="rounded-none border border-[#004AD3] px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase transition-colors hover:bg-[#F8FBFF]"
            >
              {contactLabel}
            </Link>

            <Link
              href={registerHref}
              className="rounded-none border-0 bg-[#1AD1D7] px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] [font-family:var(--font-nav),sans-serif] !text-white uppercase transition-colors hover:bg-[#0B6A9B]"
              style={{ color: "#ffffff" }}
            >
              {registerLabel}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/20 bg-white text-black shadow-[0_3px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#ffffff] lg:hidden"
          >
            <AppIcon name={drawerOpen ? "close" : "menu"} className="text-[22px]" />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] overflow-hidden bg-[#030B2E]/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDrawer();
          }
        }}
      >
        <div
          className={`ml-auto h-full w-full max-w-[360px] border-l border-black/14 bg-white shadow-[0_26px_50px_rgba(0,0,0,0.35)] transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-black/12 px-5 py-4">
            <div className="flex items-center gap-3">
              <Image
                src={logoSrc}
                alt="Granpanpan Nations Cup logo"
                width={logoWidth}
                height={logoHeight}
                quality={100}
                className="h-8 w-auto rounded-sm object-contain"
              />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeDrawer}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/16 bg-[#ffffff] text-black transition-colors hover:bg-white"
            >
              <AppIcon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="px-4 py-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] [font-family:var(--font-nav),sans-serif] text-black/60 uppercase">
              Navigation
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {mobileLinks.map((item) => {
                const isActive = item.active || (!item.href.includes("#") && pathname === item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeDrawer}
                    className={`group flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3.5 text-[15px] font-bold [font-family:var(--font-nav),sans-serif] transition-all duration-200 ${
                      isActive
                        ? "border-[#0D47B5]/20 bg-[linear-gradient(135deg,#FFFFFF_0%,#F4F8FF_100%)] text-[#0D47B5] shadow-[0_8px_18px_rgba(13,71,181,0.12)]"
                        : "border-[#0D47B5]/12 bg-white text-[#0D47B5]/90 hover:border-[#0D47B5]/24 hover:bg-[#F8FBFF] hover:shadow-[0_6px_14px_rgba(13,71,181,0.09)]"
                    }`}
                  >
                    <AppIcon
                      name={item.icon}
                      className={`rounded-lg p-2 text-[18px] shadow-[inset_0_0_0_1px_rgba(13,71,181,0.16)] ${
                        isActive ? "bg-[#0D47B5] text-white" : "bg-[#F2F7FF] text-[#0D47B5]"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <AppIcon
                      name="chevron_right"
                      className={`ml-auto text-[20px] transition-transform group-hover:translate-x-0.5 ${
                        isActive ? "text-[#0D47B5]/70" : "text-[#0D47B5]/40"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            <Link
              href={contactHref}
              onClick={closeDrawer}
              className="mt-5 flex items-center justify-center rounded-md border border-[#004AD3] bg-white px-5 py-3.5 text-xs font-extrabold tracking-[0.08em] [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase transition-colors hover:bg-[#F8FBFF]"
            >
              {contactLabel}
            </Link>

            <Link
              href={registerHref}
              onClick={closeDrawer}
              className="mt-3 flex items-center justify-center rounded-md border-0 bg-[#1AD1D7] px-5 py-3.5 text-xs font-extrabold tracking-[0.08em] [font-family:var(--font-nav),sans-serif] !text-white uppercase shadow-[0_10px_18px_rgba(26,209,215,0.28)] transition-colors hover:bg-[#0B6A9B]"
              style={{ color: "#ffffff" }}
            >
              {registerLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
