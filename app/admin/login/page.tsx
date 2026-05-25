"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";
import { getSupabaseClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "/#prizes", label: "Prizes" },
  { href: "/#rules", label: "Rules" },
  { href: "/match-schedule#groups", label: "Groups" },
  { href: "/match-schedule#bracket", label: "Bracket" },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule" },
  { href: "/#prizes", icon: "confirmation_number", label: "Prizes" },
  { href: "/#rules", icon: "gavel", label: "Rules" },
  { href: "/match-schedule#groups", icon: "groups", label: "Groups" },
  { href: "/match-schedule#bracket", icon: "account_tree", label: "Bracket" },
];

const inputClassName =
  "w-full rounded-md border border-[#004AD3]/20 bg-white px-3 py-2 text-sm text-[#004AD3] outline-none transition focus:border-[#004AD3] focus:ring-2 focus:ring-[#004AD3]/15";

type AccessResponse =
  | {
      user: {
        id: string;
        email: string;
        full_name: string;
      };
      error?: undefined;
    }
  | {
      user?: undefined;
      error: string;
    };

const validateAdminAccess = async (accessToken: string) => {
  const response = await fetch("/api/admin/access", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as AccessResponse | null;
  return {
    ok: response.ok,
    error: payload?.error ?? "Admin access check failed.",
  };
};

const AdminLoginFallback = () => (
  <div className="flex min-h-screen flex-col bg-[#ffffff]">
    <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

    <main className="flex-1 pt-24 pb-16">
      <section className="mx-auto w-full max-w-[560px] px-4 md:px-10">
        <div className="rounded-xl border border-[#004AD3]/15 bg-white p-8 shadow-[0_12px_28px_rgba(0,74,211,0.08)]">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Admin Access</p>
          <h1 className="mt-2 text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase">
            Admin Login
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#004AD3]/78">Loading secure login...</p>
        </div>
      </section>
    </main>

    <SiteFooter variant="register" />
  </div>
);

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkExistingSession = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const accessCheck = await validateAdminAccess(session.access_token);
        if (!active) return;

        if (accessCheck.ok) {
          router.replace(nextPath);
        } else {
          await supabase.auth.signOut();
        }
      } catch {
        // Ignore silent check errors.
      }
    };

    void checkExistingSession();
    return () => {
      active = false;
    };
  }, [nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setStatusMessage("Signing in...");

    try {
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No active session after login.");
      }

      const accessCheck = await validateAdminAccess(session.access_token);
      if (!accessCheck.ok) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for admin access.");
      }

      router.replace(nextPath);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to sign in.";

      setStatusMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[560px] px-4 md:px-10">
          <div className="rounded-xl border border-[#004AD3]/15 bg-white p-8 shadow-[0_12px_28px_rgba(0,74,211,0.08)]">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Admin Access</p>
            <h1 className="mt-2 text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase">
              Admin Login
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#004AD3]/78">
              Connect with your admin email and password. Non-authorized accounts cannot open the admin area.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Email</span>
                <input
                  type="email"
                  className={inputClassName}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@email.com"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Password</span>
                <input
                  type="password"
                  className={inputClassName}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className={`rounded-none border border-[#0B6A9B] px-7 py-3 text-sm font-extrabold tracking-[0.08em] text-white uppercase ${
                  isLoading ? "cursor-not-allowed bg-[#0B6A9B]/70" : "bg-[#1AD1D7] hover:bg-[#0B6A9B]"
                }`}
              >
                {isLoading ? "Checking..." : "Login"}
              </button>
            </form>

            {statusMessage ? <p className="mt-4 text-sm text-[#004AD3]/80">{statusMessage}</p> : null}
          </div>
        </section>
      </main>

      <SiteFooter variant="register" />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent />
    </Suspense>
  );
}
