"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#d7e0f5] bg-white/95 shadow-[0_8px_22px_rgba(13,71,181,0.09)] backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 md:px-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/granpanpan.png"
              alt="Gran Panpan logo"
              width={80}
              height={80}
              priority
              className="mt-6 h-20 w-20 rounded-md bg-transparent object-contain"
            />
            <span className="font-heading mt-3 text-[13px] leading-[1.05] tracking-tight text-[#0D47B5] uppercase md:text-[16px]">
              <span className="block">GRAN PANPAN</span>
              <span className="block text-[#C81010]">HAITI CUP</span>
            </span>
          </Link>

          <div className="hidden items-center gap-4 lg:flex">
            <nav className="flex items-center gap-5">
              {desktopLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-1 py-2 text-xs font-semibold tracking-[0.08em] [font-family:var(--font-nav),sans-serif] text-black uppercase transition-colors hover:text-black/75"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href={registerHref}
              className="rounded-full bg-black px-5 py-2.5 text-xs font-semibold tracking-[0.08em] [font-family:var(--font-heading),sans-serif] text-white uppercase transition-all hover:-translate-y-0.5 hover:bg-[#111827]"
            >
              {registerLabel}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="rounded-full border border-[#0D47B5]/20 bg-[#f4f7ff] p-2 text-[#0D47B5] transition-colors hover:bg-white lg:hidden"
          >
            <span className="material-symbols-outlined">{drawerOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-[#0D47B5]/55 transition-opacity duration-300 ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDrawer();
          }
        }}
      >
        <div
          className={`h-full w-80 bg-white py-2 shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-6 py-8">
            <span className="font-heading text-2xl text-[#C81010] uppercase">TOURNAMENT MENU</span>
          </div>

          <div className="flex flex-col gap-2 px-2">
            {mobileLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeDrawer}
                className={`flex items-center gap-4 rounded-full px-4 py-3 text-sm font-semibold [font-family:var(--font-nav),sans-serif] uppercase transition-colors ${
                  item.active
                    ? "bg-[#e5e7eb] text-black"
                    : "text-black hover:bg-[#f4f7ff] hover:text-black/75"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <Link
              href={registerHref}
              onClick={closeDrawer}
              className="mt-2 flex items-center justify-center rounded-full bg-black px-5 py-3 text-xs font-semibold tracking-[0.08em] [font-family:var(--font-heading),sans-serif] text-white uppercase"
            >
              {registerLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
