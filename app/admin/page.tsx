"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";
import { getSupabaseClient } from "@/lib/supabase/client";

type AdminBadgeMember = {
  key: string;
  memberType: "STAFF" | "PLAYER";
  registereId: string;
  teamName: string;
  fullName: string;
  title: string;
  subtitle: string;
  badgeId: string;
  photoUrl: string | null;
  qrCodeDataUrl: string | null;
};

type MembersApiResponse = {
  members: AdminBadgeMember[];
  staffCount: number;
  playerCount: number;
  admin?: {
    userId: string;
    email: string;
    fullName: string;
  };
  error?: string;
};

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

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<AdminBadgeMember[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      setIsLoading(true);
      setStatusMessage("Loading admin badge list...");

      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          if (isMounted) {
            setStatusMessage("Please login to access admin area.");
            setIsLoading(false);
          }
          router.replace("/admin/login?next=/admin");
          return;
        }

        const response = await fetch("/api/members", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const result = (await response.json().catch(() => null)) as MembersApiResponse | null;

        if (response.status === 401) {
          await supabase.auth.signOut();
          if (isMounted) {
            setStatusMessage("Session expired. Please login again.");
            setIsLoading(false);
          }
          router.replace("/admin/login?next=/admin");
          return;
        }

        if (response.status === 403) {
          await supabase.auth.signOut();
          if (isMounted) {
            setStatusMessage("Access denied: this account is not authorized for admin.");
            setIsLoading(false);
          }
          router.replace("/admin/login?next=/admin");
          return;
        }

        if (!response.ok) {
          throw new Error(result?.error || "Unable to fetch admin members.");
        }

        const allMembers = result?.members ?? [];
        const totalStaff = result?.staffCount ?? allMembers.filter((member) => member.memberType === "STAFF").length;
        const totalPlayers =
          result?.playerCount ?? allMembers.filter((member) => member.memberType === "PLAYER").length;

        if (!isMounted) return;
        setMembers(allMembers);
        setStaffCount(totalStaff);
        setPlayerCount(totalPlayers);
        setAdminName(result?.admin?.fullName ?? result?.admin?.email ?? "");
        setStatusMessage(allMembers.length > 0 ? null : "No badge records found.");
      } catch (error: unknown) {
        if (!isMounted) return;
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unable to load admin badge list.";
        setStatusMessage(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadMembers();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) =>
      `${member.fullName} ${member.teamName} ${member.badgeId} ${member.memberType} ${member.title}`
        .toLowerCase()
        .includes(query),
    );
  }, [members, search]);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[1200px] px-4 md:px-10">
          <div className="rounded-xl border border-[#004AD3]/15 bg-white p-6 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-8">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Admin Panel</p>
            <h1 className="mt-2 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-4xl">
              Badge Management
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#004AD3]/78 md:text-base">
              View staff and player badge records, open the exact template preview, and download each PDF badge.
            </p>
            {adminName ? (
              <p className="mt-2 text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                Connected as: {adminName}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, team, badge ID..."
                className="w-full rounded-md border border-[#004AD3]/20 bg-white px-3 py-2 text-sm text-[#004AD3] outline-none focus:border-[#004AD3] focus:ring-2 focus:ring-[#004AD3]/15 md:max-w-[420px]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                  Staff: {staffCount}
                </p>
                <p className="text-xs font-bold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                  Players: {playerCount}
                </p>
                <p className="text-xs font-bold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                  {filteredMembers.length} Records
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg border border-[#004AD3]/15">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#FAFCFF]">
                  <tr>
                    <th className="px-3 py-3 text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Type</th>
                    <th className="px-3 py-3 text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Full Name</th>
                    <th className="px-3 py-3 text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Title</th>
                    <th className="px-3 py-3 text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Team</th>
                    <th className="px-3 py-3 text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Badge ID</th>
                    <th className="px-3 py-3 text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.key} className="border-t border-[#004AD3]/10">
                      <td className="px-3 py-3 font-semibold text-[#0D47B5]">{member.memberType}</td>
                      <td className="px-3 py-3 text-[#004AD3]">{member.fullName}</td>
                      <td className="px-3 py-3 text-[#004AD3]/80">{member.subtitle}</td>
                      <td className="px-3 py-3 text-[#004AD3]/80">{member.teamName}</td>
                      <td className="px-3 py-3 font-mono text-xs text-[#004AD3]/88">{member.badgeId}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/badges?member=${encodeURIComponent(member.key)}`}
                          className="inline-flex items-center rounded border border-[#0B6A9B] bg-[#1AD1D7] px-3 py-1.5 text-xs font-extrabold tracking-[0.08em] text-white uppercase hover:bg-[#0B6A9B]"
                        >
                          View / Download
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {statusMessage ? <p className="mt-4 text-sm text-[#004AD3]/80">{statusMessage}</p> : null}
            {isLoading ? <p className="mt-2 text-sm text-[#004AD3]/70">Loading...</p> : null}
          </div>
        </section>
      </main>

      <SiteFooter variant="register" />
    </div>
  );
}
