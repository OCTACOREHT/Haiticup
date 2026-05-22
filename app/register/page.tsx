"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";

type PlayerRow = {
  id: number;
  fullName: string;
  position: string;
  jerseyNumber: string;
  age: string;
};

type PlayerField = "fullName" | "position" | "jerseyNumber" | "age";

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

const createPlayer = (id: number): PlayerRow => ({
  id,
  fullName: "",
  position: "",
  jerseyNumber: "",
  age: "",
});

const positionOptions = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];

const inputClassName =
  "w-full rounded-md border border-[#0D47B5]/20 bg-white px-3 py-2 text-sm text-[#0D47B5] outline-none transition focus:border-[#0D47B5] focus:ring-2 focus:ring-[#0D47B5]/15";

export default function RegisterPage() {
  const [teamName, setTeamName] = useState("");
  const [clubAddress, setClubAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [managerName, setManagerName] = useState("");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState("");

  const [players, setPlayers] = useState<PlayerRow[]>([createPlayer(1)]);
  const [nextPlayerId, setNextPlayerId] = useState(2);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const newPreview = URL.createObjectURL(selectedFile);
    setLogoPreview((currentPreview) => {
      if (currentPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return newPreview;
    });
    setLogoFileName(selectedFile.name);
  };

  const addPlayer = () => {
    setPlayers((current) => [...current, createPlayer(nextPlayerId)]);
    setNextPlayerId((current) => current + 1);
  };

  const removePlayer = (id: number) => {
    setPlayers((current) => (current.length === 1 ? current : current.filter((player) => player.id !== id)));
  };

  const updatePlayer = (id: number, field: PlayerField, value: string) => {
    setPlayers((current) =>
      current.map((player) => (player.id === id ? { ...player, [field]: value } : player)),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(
      `Registration draft ready for ${teamName || "your team"} with ${players.length} player entries.`,
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFF]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[1100px] px-4 md:px-10">
          <div className="rounded-xl border border-[#0D47B5]/15 bg-white p-8 shadow-[0_12px_28px_rgba(13,71,181,0.08)] md:p-10">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0D47B5]/65 uppercase">
              Team Registration
            </p>
            <h1 className="mt-2 text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] uppercase md:text-5xl">
              Register Now
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#0D47B5]/78 md:text-base">
              Fill the team profile and add your players roster for tournament verification.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-8">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                        Team Name
                      </span>
                      <input
                        className={inputClassName}
                        value={teamName}
                        onChange={(event) => setTeamName(event.target.value)}
                        placeholder="Enter team name"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                        Team Manager
                      </span>
                      <input
                        className={inputClassName}
                        value={managerName}
                        onChange={(event) => setManagerName(event.target.value)}
                        placeholder="Manager full name"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                        Phone Number
                      </span>
                      <input
                        className={inputClassName}
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="+509 ..."
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                        Contact Email
                      </span>
                      <input
                        type="email"
                        className={inputClassName}
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        placeholder="team@email.com"
                        required
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                        Club Address
                      </span>
                      <textarea
                        className={`${inputClassName} min-h-[96px] resize-y`}
                        value={clubAddress}
                        onChange={(event) => setClubAddress(event.target.value)}
                        placeholder="Street, city, country"
                        required
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                        Website
                      </span>
                      <input
                        type="url"
                        className={inputClassName}
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        placeholder="https://yourclub.com"
                      />
                    </label>
                  </div>
                </div>

                <aside className="rounded-lg border border-[#0D47B5]/18 bg-[#F7FAFF] p-5 lg:col-span-4">
                  <p className="text-xs font-semibold tracking-[0.08em] text-[#0D47B5]/70 uppercase">Club Logo</p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#0D47B5]/35 bg-white px-4 py-5 text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <span className="text-sm font-semibold text-[#0D47B5]">Upload Logo</span>
                  </label>

                  {logoPreview ? (
                    <div className="mt-4 flex flex-col items-center rounded-md border border-[#0D47B5]/18 bg-white p-3 text-center">
                      <Image
                        src={logoPreview}
                        alt="Club logo preview"
                        width={120}
                        height={120}
                        unoptimized
                        className="h-[120px] w-[120px] rounded-md border border-[#0D47B5]/18 object-contain"
                      />
                      <p className="mt-2 text-xs text-[#0D47B5]/72">{logoFileName}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[#0D47B5]/60">No logo selected yet.</p>
                  )}
                </aside>
              </div>

              <section className="rounded-lg border border-[#0D47B5]/15 bg-[#F9FBFF] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] uppercase">
                    Players Roster
                  </h2>
                  <button
                    type="button"
                    onClick={addPlayer}
                    className="inline-flex items-center gap-2 rounded-md border border-[#0D47B5] bg-white px-4 py-2 text-xs font-bold tracking-[0.08em] text-[#0D47B5] uppercase hover:bg-[#EEF4FF]"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    Add Player
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {players.map((player, index) => (
                    <article key={player.id} className="rounded-md border border-[#0D47B5]/15 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                          Player {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          className="inline-flex items-center gap-1 rounded border border-[#C81010]/35 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#C81010] uppercase hover:bg-[#FFF6F6]"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <label className="space-y-1 md:col-span-5">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#0D47B5]/65 uppercase">
                            Full Name
                          </span>
                          <input
                            className={inputClassName}
                            value={player.fullName}
                            onChange={(event) => updatePlayer(player.id, "fullName", event.target.value)}
                            required
                          />
                        </label>

                        <label className="space-y-1 md:col-span-3">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#0D47B5]/65 uppercase">
                            Position
                          </span>
                          <select
                            className={inputClassName}
                            value={player.position}
                            onChange={(event) => updatePlayer(player.id, "position", event.target.value)}
                            required
                          >
                            <option value="">Select position</option>
                            {positionOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#0D47B5]/65 uppercase">
                            Jersey No.
                          </span>
                          <input
                            className={inputClassName}
                            value={player.jerseyNumber}
                            onChange={(event) => updatePlayer(player.id, "jerseyNumber", event.target.value)}
                            required
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#0D47B5]/65 uppercase">
                            Age
                          </span>
                          <input
                            type="number"
                            min={10}
                            max={60}
                            className={inputClassName}
                            value={player.age}
                            onChange={(event) => updatePlayer(player.id, "age", event.target.value)}
                            required
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                <button
                  type="submit"
                  className="rounded-none border border-[#D2B200] bg-[#E0C200] px-7 py-3 text-sm font-extrabold tracking-[0.08em] text-white uppercase hover:bg-[#E8CC2A]"
                >
                  Submit Registration
                </button>
                {statusMessage ? <p className="text-sm text-[#0D47B5]/78">{statusMessage}</p> : null}
              </div>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter variant="register" />
    </div>
  );
}
