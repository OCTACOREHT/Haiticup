"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { clearAdminServerSession, establishAdminServerSession } from "@/lib/supabase/admin-session-client";
import { getSupabaseClient } from "@/lib/supabase/client";

const inputClassName =
  "h-12 w-full rounded-xl border border-[#004AD3]/18 bg-[#f9fbff] px-4 text-[17px] text-[#0037a3] outline-none transition focus:border-[#004AD3] focus:bg-white focus:ring-3 focus:ring-[#004AD3]/15";
const loginLogoSrc = "/GRANPAPAN%20NATIONS%20CUP.png";
const panelClassName =
  "w-full max-w-[560px] rounded-2xl border border-[#004AD3]/14 bg-white px-6 py-8 shadow-[0_18px_44px_rgba(0,74,211,0.12)] md:px-10 md:py-10";

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
  <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f4f7ff_0%,#eef3ff_100%)] px-4">
    <div className={panelClassName}>
      <Image
        src={loginLogoSrc}
        alt="Granpapan Nations Cup"
        width={460}
        height={576}
        priority
        className="mx-auto mb-8 h-32 w-auto object-contain"
      />
      <div className="h-12 w-full animate-pulse rounded-xl bg-[#004AD3]/10" />
      <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-[#004AD3]/10" />
      <div className="mt-5 h-12 w-full animate-pulse rounded-xl bg-[#1AD1D7]/35" />
    </div>
  </div>
);

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNextPath = searchParams.get("next");
  const nextPath = requestedNextPath && requestedNextPath.startsWith("/") ? requestedNextPath : "/admin";
  const reason = searchParams.get("reason");
  const timeoutStatusMessage =
    reason === "timeout" ? "Session expired after 7 minutes of inactivity. Please login again." : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(timeoutStatusMessage);

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
          await establishAdminServerSession(session.access_token);
          router.replace(nextPath);
        } else {
          await supabase.auth.signOut();
          await clearAdminServerSession();
        }
      } catch {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        await clearAdminServerSession();
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
        await clearAdminServerSession();
        throw new Error("This account is not authorized for admin access.");
      }

      await establishAdminServerSession(session.access_token);
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
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f4f7ff_0%,#eef3ff_100%)] px-4">
      <section className={panelClassName}>
        <Image
          src={loginLogoSrc}
          alt="Granpapan Nations Cup"
          width={460}
          height={576}
          priority
          className="mx-auto mb-8 h-32 w-auto object-contain"
        />
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-xs font-bold tracking-[0.16em] text-[#004AD3]/72 uppercase">Email</span>
            <input
              type="email"
              className={inputClassName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@email.com"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold tracking-[0.16em] text-[#004AD3]/72 uppercase">Password</span>
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
            className={`inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#0d47b5]/40 text-sm font-extrabold tracking-[0.14em] text-white uppercase shadow-[0_10px_22px_rgba(13,71,181,0.25)] transition ${
              isLoading
                ? "cursor-not-allowed bg-[#0D47B5]/70"
                : "bg-[linear-gradient(90deg,#1AD1D7_0%,#0D47B5_100%)] hover:brightness-105 active:brightness-95"
            }`}
          >
            {isLoading ? (
              <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
            ) : null}
            {isLoading ? "Checking..." : "Login"}
          </button>
        </form>

        {statusMessage ? <p className="mt-4 text-sm text-[#004AD3]/80">{statusMessage}</p> : null}
      </section>
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
