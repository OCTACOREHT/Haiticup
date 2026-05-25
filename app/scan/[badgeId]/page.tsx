import { notFound } from "next/navigation";
import { getPublicMemberProfileByBadgeId } from "@/lib/badges/member-profile";

export const dynamic = "force-dynamic";

const formatDateLabel = (value: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const stageLabel = (stage: string) => stage.replaceAll("_", " ");

export default async function ScanBadgePage({
  params,
}: {
  params: Promise<{ badgeId: string }>;
}) {
  const { badgeId } = await params;
  const profile = await getPublicMemberProfileByBadgeId(badgeId);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f6ff] px-4 py-8 text-[#03124a]">
      <section className="mx-auto w-full max-w-[980px] rounded-2xl border border-[#004AD3]/20 bg-white p-6 shadow-[0_16px_45px_rgba(0,74,211,0.12)] md:p-8">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#004AD3]/70">Granpanpan Nations Cup</p>
        <h1 className="mt-2 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] uppercase text-[#004AD3] md:text-4xl">
          Player Verification
        </h1>
        <p className="mt-2 text-sm text-[#0B1E66]/72">Scanned badge details</p>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-[190px] w-[190px] overflow-hidden rounded-full border-4 border-[#004AD3]/20 bg-[#e8eeff]">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt={profile.fullName} className="h-full w-full object-cover object-center" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#004AD3]/70">No Photo</div>
              )}
            </div>
            <span
              className={`inline-flex rounded-full px-4 py-1 text-xs font-bold tracking-[0.08em] uppercase ${
                profile.isUnderSanction ? "bg-[#d7263d]/12 text-[#a80f25]" : "bg-[#0a8754]/12 text-[#0a8754]"
              }`}
            >
              {profile.isUnderSanction ? "ON SANCTION" : "CLEAR"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#004AD3]/15 bg-[#f9fbff] p-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#004AD3]/70">{profile.memberType}</p>
              <h2 className="mt-1 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#03124a]">
                {profile.fullName}
              </h2>
              <p className="mt-1 text-lg font-semibold text-[#0B1E66]">{profile.roleOrPosition}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#004AD3]/12 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-[#004AD3]/70">Badge ID</p>
                <p className="mt-1 font-semibold text-[#03124a]">{profile.badgeId}</p>
              </div>
              <div className="rounded-lg border border-[#004AD3]/12 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-[#004AD3]/70">Club</p>
                <p className="mt-1 font-semibold text-[#03124a]">{profile.teamName}</p>
              </div>
              <div className="rounded-lg border border-[#004AD3]/12 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-[#004AD3]/70">Goals Scored</p>
                <p className="mt-1 font-semibold text-[#03124a]">{profile.goalsCount}</p>
              </div>
              <div className="rounded-lg border border-[#004AD3]/12 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-[#004AD3]/70">Jersey</p>
                <p className="mt-1 font-semibold text-[#03124a]">{profile.jerseyNumber ?? "N/A"}</p>
              </div>
              <div className="rounded-lg border border-[#004AD3]/12 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-[#004AD3]/70">Age</p>
                <p className="mt-1 font-semibold text-[#03124a]">{profile.age ?? "N/A"}</p>
              </div>
              <div className="rounded-lg border border-[#004AD3]/12 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-[#004AD3]/70">Contact</p>
                <p className="mt-1 text-sm font-semibold text-[#03124a]">{profile.phoneNumber ?? profile.email ?? "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-[#004AD3]/15 bg-white p-4">
            <h3 className="text-sm font-extrabold tracking-[0.08em] uppercase text-[#004AD3]">Goals Details</h3>
            {profile.goals.length === 0 ? (
              <p className="mt-3 text-sm text-[#0B1E66]/75">No goals recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {profile.goals.map((goal) => (
                  <article key={`${goal.matchId}-${goal.minute ?? "n"}`} className="rounded-lg border border-[#004AD3]/12 bg-[#f9fbff] p-3">
                    <p className="text-xs font-semibold uppercase text-[#004AD3]/70">{stageLabel(goal.stage)}</p>
                    <p className="mt-1 text-sm font-semibold text-[#03124a]">
                      {goal.teamName} vs {goal.opponentName}
                    </p>
                    <p className="text-sm text-[#0B1E66]">Score: {goal.scoreLine}</p>
                    <p className="text-sm text-[#0B1E66]">Minute: {goal.minute ?? "N/A"}</p>
                    <p className="text-xs text-[#0B1E66]/75">{formatDateLabel(goal.kickoffAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#004AD3]/15 bg-white p-4">
            <h3 className="text-sm font-extrabold tracking-[0.08em] uppercase text-[#004AD3]">Sanctions</h3>
            {profile.sanctions.length === 0 ? (
              <p className="mt-3 text-sm text-[#0B1E66]/75">No sanctions recorded.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {profile.sanctions.map((sanction) => (
                  <article key={sanction.id} className="rounded-lg border border-[#004AD3]/12 bg-[#f9fbff] p-3">
                    <p className="text-sm font-bold text-[#03124a]">{sanction.sanctionType}</p>
                    <p className="text-sm text-[#0B1E66]">{sanction.reason}</p>
                    <p className="text-xs text-[#0B1E66]/80">
                      Active: {sanction.isActive ? "YES" : "NO"} | Start: {formatDateLabel(sanction.startsAt)} | End:{" "}
                      {formatDateLabel(sanction.endsAt)}
                    </p>
                    {sanction.notes ? <p className="text-xs text-[#0B1E66]/80">Notes: {sanction.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
