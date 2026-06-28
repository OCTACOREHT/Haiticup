"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import AppIcon from "@/components/AppIcon";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";
import { buildBadgeScanUrl } from "@/lib/badges/scan-url";
import {
  findDuplicateNormalizedValue,
  normalizeEmail,
  normalizeTrimmedValue,
} from "@/lib/registration-validation";

type PlayerRow = {
  id: number;
  fullName: string;
  position: string;
  jerseyNumber: string;
  age: string;
  photoPreview: string | null;
  photoFileName: string;
  photoFile: File | null;
};

type PlayerField = "fullName" | "position" | "jerseyNumber" | "age";

type StaffRow = {
  id: number;
  fullName: string;
  role: string;
  phoneNumber: string;
  email: string;
  photoPreview: string | null;
  photoFileName: string;
  photoFile: File | null;
};

type StaffField = "fullName" | "role" | "phoneNumber" | "email";
type BadgeMemberType = "STAFF" | "PLAYER";
type StatusTone = "info" | "success" | "error";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "/#rules", label: "Rules" },
  { href: "/match-schedule#groups", label: "Groups" },
  { href: "/match-schedule#bracket", label: "Bracket" },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule" },
  { href: "/#rules", icon: "gavel", label: "Rules" },
  { href: "/match-schedule#groups", icon: "groups", label: "Groups" },
  { href: "/match-schedule#bracket", icon: "account_tree", label: "Bracket" },
];

const CONTACT_PAGE_HREF = "/contact";

const createPlayer = (id: number): PlayerRow => ({
  id,
  fullName: "",
  position: "",
  jerseyNumber: "",
  age: "",
  photoPreview: null,
  photoFileName: "",
  photoFile: null,
});

const createStaff = (id: number): StaffRow => ({
  id,
  fullName: "",
  role: "",
  phoneNumber: "",
  email: "",
  photoPreview: null,
  photoFileName: "",
  photoFile: null,
});

const positionOptions = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];

const staffRoleOptions = [
  "Head Coach",
  "Assistant Coach",
  "Team Manager",
  "Physiotherapist",
  "Logistics Officer",
  "Media Officer",
  "Other",
];

const STAFF_MIN_COUNT = 1;
const STAFF_MAX_COUNT = 5;
const PLAYER_MIN_COUNT = 0;
const PLAYER_MAX_COUNT = 20;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "5 MB";
const TOURNAMENT_YEAR = "2026";
const QR_IMAGE_SIZE_PX = 1400;
const UPLOAD_TARGET_BYTES = 3.5 * 1024 * 1024;

const inputClassName =
  "w-full rounded-md border border-[#004AD3]/20 bg-white px-3 py-2 text-sm text-[#004AD3] outline-none transition focus:border-[#004AD3] focus:ring-2 focus:ring-[#004AD3]/15";

const readImageAsDataUrl = (
  file: File,
  onSuccess: (dataUrl: string) => void,
  onError: () => void,
) => {
  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result === "string") {
      onSuccess(reader.result);
      return;
    }
    onError();
  };

  reader.onerror = () => onError();
  reader.readAsDataURL(file);
};

const validateImageUpload = (file: File, label: string) => {
  if (!file.type.startsWith("image/")) {
    return `${label}: please upload a valid image file.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${label}: image must be ${MAX_IMAGE_SIZE_LABEL} or less.`;
  }

  return null;
};

const toUpperAlphaNumeric = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const buildTeamCode = (rawTeamName: string, registrationId: string) => {
  const normalizedTeam = toUpperAlphaNumeric(rawTeamName).slice(0, 6).padEnd(6, "X");
  const registrationChunk = toUpperAlphaNumeric(registrationId).slice(-4).padStart(4, "0");
  return `${normalizedTeam}${registrationChunk}`;
};

const buildBadgeId = (memberType: BadgeMemberType, teamCode: string, serial: number) => {
  const prefix = memberType === "STAFF" ? "STF" : "PLY";
  return `${prefix}-${TOURNAMENT_YEAR}-${teamCode}-${String(serial).padStart(2, "0")}`;
};

const buildQrCodeDataUrl = (badgeId: string) => {
  const scanUrl = buildBadgeScanUrl({
    badgeId,
    originFallback: typeof window !== "undefined" ? window.location.origin : undefined,
  });

  return QRCode.toDataURL(scanUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: QR_IMAGE_SIZE_PX,
    color: {
      dark: "#000000FF",
      light: "#FFFFFFFF",
    },
  });
};

const compressImageFile = (file: File, maxBytes: number = UPLOAD_TARGET_BYTES): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1600;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable."));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas compression failed."));
              return;
            }
            if (blob.size <= maxBytes || quality <= 0.3) {
              resolve(blob);
            } else {
              tryQuality(Math.max(quality - 0.1, 0.3));
            }
          },
          "image/jpeg",
          quality,
        );
      };

      tryQuality(0.92);
    };

    img.onerror = () => reject(new Error("Failed to load image for compression."));
    img.src = objectUrl;
  });


const uploadToStorage = async (blob: Blob | File, path: string): Promise<string> => {
  const form = new FormData();
  form.append("file", blob, path);
  form.append("path", path);
  const res = await fetch("/api/upload-photo", { method: "POST", body: form });
  const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok) throw new Error(json?.error || "Photo upload failed.");
  if (!json?.url) throw new Error("No URL returned from photo upload.");
  return json.url;
};

export default function RegisterPage() {
  const [teamName, setTeamName] = useState("");
  const [clubAddress, setClubAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [managerName, setManagerName] = useState("");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [players, setPlayers] = useState<PlayerRow[]>([createPlayer(1)]);
  const [staffMembers, setStaffMembers] = useState<StaffRow[]>([createStaff(1)]);
  const [photoAuthorization, setPhotoAuthorization] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const clearStatus = () => {
    setStatusMessage(null);
  };

  const showStatus = (message: string, tone: StatusTone = "info") => {
    setStatusMessage(message);
    setStatusTone(tone);
  };
  const closeStatus = () => {
    setStatusMessage(null);
  };

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(null), 5000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [statusMessage]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateImageUpload(selectedFile, "Club logo");
    if (validationError) {
      showStatus(validationError, "error");
      event.target.value = "";
      return;
    }

    readImageAsDataUrl(
      selectedFile,
      (dataUrl) => {
        setLogoPreview(dataUrl);
        setLogoFileName(selectedFile.name);
        setLogoFile(selectedFile);
        clearStatus();
      },
      () => showStatus("Unable to read the club logo file. Please try another image.", "error"),
    );
  };

  const addPlayer = () => {
    setPlayers((current) => {
      if (current.length >= PLAYER_MAX_COUNT) return current;
      const nextId = current.reduce((maxId, player) => Math.max(maxId, player.id), 0) + 1;
      return [...current, createPlayer(nextId)];
    });
  };

  const removePlayer = (id: number) => {
    setPlayers((current) =>
      current.length <= PLAYER_MIN_COUNT ? current : current.filter((player) => player.id !== id),
    );
  };

  const updatePlayer = (id: number, field: PlayerField, value: string) => {
    setPlayers((current) =>
      current.map((player) => (player.id === id ? { ...player, [field]: value } : player)),
    );
  };

  const updatePlayerPhoto = (id: number, event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateImageUpload(selectedFile, "Player photo");
    if (validationError) {
      showStatus(validationError, "error");
      event.target.value = "";
      return;
    }

    readImageAsDataUrl(
      selectedFile,
      (dataUrl) => {
        setPlayers((current) =>
          current.map((player) =>
            player.id === id
              ? { ...player, photoPreview: dataUrl, photoFileName: selectedFile.name, photoFile: selectedFile }
              : player,
          ),
        );
        clearStatus();
      },
      () => showStatus("Unable to read the player photo. Please try another image.", "error"),
    );
  };

  const updateStaff = (id: number, field: StaffField, value: string) => {
    setStaffMembers((current) =>
      current.map((staff) => (staff.id === id ? { ...staff, [field]: value } : staff)),
    );
  };

  const addStaff = () => {
    setStaffMembers((current) => {
      if (current.length >= STAFF_MAX_COUNT) return current;
      const nextId = current.reduce((maxId, staff) => Math.max(maxId, staff.id), 0) + 1;
      return [...current, createStaff(nextId)];
    });
  };

  const removeStaff = (id: number) => {
    setStaffMembers((current) => {
      if (current.length <= STAFF_MIN_COUNT) return current;
      return current.filter((staff) => staff.id !== id);
    });
  };

  const updateStaffPhoto = (id: number, event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateImageUpload(selectedFile, "Staff photo");
    if (validationError) {
      showStatus(validationError, "error");
      event.target.value = "";
      return;
    }

    readImageAsDataUrl(
      selectedFile,
      (dataUrl) => {
        setStaffMembers((current) =>
          current.map((staff) =>
            staff.id === id
              ? { ...staff, photoPreview: dataUrl, photoFileName: selectedFile.name, photoFile: selectedFile }
              : staff,
          ),
        );
        clearStatus();
      },
      () => showStatus("Unable to read the staff photo. Please try another image.", "error"),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (staffMembers.length < STAFF_MIN_COUNT) {
      showStatus(`At least ${STAFF_MIN_COUNT} staff member is required.`, "error");
      return;
    }

    if (staffMembers.length > STAFF_MAX_COUNT) {
      showStatus(`Maximum allowed staff members is ${STAFF_MAX_COUNT}.`, "error");
      return;
    }

    if (players.length > PLAYER_MAX_COUNT) {
      showStatus(`Maximum allowed players is ${PLAYER_MAX_COUNT}.`, "error");
      return;
    }

    if (!logoFile || !logoPreview) {
      showStatus("Please upload the club logo before submitting.", "error");
      return;
    }

    const hasInvalidStaff = staffMembers.some(
      (staff) =>
        !staff.fullName.trim() ||
        !staff.role.trim() ||
        !staff.phoneNumber.trim() ||
        !staff.email.trim() ||
        !staff.photoPreview ||
        !staff.photoFile,
    );

    if (hasInvalidStaff) {
      showStatus("Please complete all staff fields and upload all staff photos.", "error");
      return;
    }

    const duplicateStaffEmail = findDuplicateNormalizedValue(staffMembers.map((staff) => staff.email));
    if (duplicateStaffEmail) {
      showStatus(
        `Each staff member must use a unique email address. Duplicate email: ${duplicateStaffEmail.value}.`,
        "error",
      );
      return;
    }

    const hasInvalidPlayers = players.some(
      (player) =>
        !player.fullName.trim() ||
        !player.position.trim() ||
        !player.jerseyNumber.trim() ||
        !player.age.trim() ||
        Number.isNaN(Number(player.age)) ||
        !player.photoPreview ||
        !player.photoFile,
    );

    if (hasInvalidPlayers) {
      showStatus("Please complete all player fields and upload each player photo.", "error");
      return;
    }

    const duplicateJerseyNumber = findDuplicateNormalizedValue(
      players.map((player) => player.jerseyNumber),
      normalizeTrimmedValue,
    );
    if (duplicateJerseyNumber) {
      showStatus(
        `Each player must use a unique jersey number. Duplicate jersey number: ${duplicateJerseyNumber.value}.`,
        "error",
      );
      return;
    }

    if (!photoAuthorization) {
      showStatus("Please authorize photo usage for badges and official tournament passes.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationToken = crypto.randomUUID();
      const teamCode = buildTeamCode(teamName, registrationToken);
      const folder = `reg-${registrationToken}`;

      // Upload club logo
      showStatus("Uploading club logo…", "info");
      const compressedLogo = await compressImageFile(logoFile!);
      const logoUrl = await uploadToStorage(compressedLogo, `${folder}/logo.jpg`);

      // Upload staff photos
      showStatus("Uploading staff photos…", "info");
      const staffPhotoUrls = await Promise.all(
        staffMembers.map(async (staff, index) => {
          if (!staff.photoFile) throw new Error(`Missing staff photo for member ${index + 1}.`);
          const compressed = await compressImageFile(staff.photoFile);
          return uploadToStorage(compressed, `${folder}/staff-${String(index + 1).padStart(2, "0")}.jpg`);
        }),
      );

      // Upload player photos
      showStatus("Uploading player photos…", "info");
      const playerPhotoUrls = await Promise.all(
        players.map(async (player, index) => {
          if (!player.photoFile) throw new Error(`Missing player photo for member ${index + 1}.`);
          const compressed = await compressImageFile(player.photoFile);
          return uploadToStorage(compressed, `${folder}/player-${String(index + 1).padStart(2, "0")}.jpg`);
        }),
      );

      // Generate QR codes and build payloads (QR codes kept as data URLs — small enough for JSON body)
      showStatus("Generating QR codes…", "info");
      const staffPayload = await Promise.all(
        staffMembers.map(async (staff, index) => {
          const badgeId = buildBadgeId("STAFF", teamCode, index + 1);
          const email = normalizeEmail(staff.email);
          const qrPayload = {
            badge_id: badgeId,
            member_type: "STAFF",
            registration_id: registrationToken,
            team_name: teamName.trim(),
            team_code: teamCode,
            full_name: staff.fullName.trim(),
            role: staff.role.trim(),
            phone_number: staff.phoneNumber.trim(),
            email,
            scan_url: buildBadgeScanUrl({
              badgeId,
              originFallback: typeof window !== "undefined" ? window.location.origin : undefined,
            }),
          };
          const qrCodeDataUrl = await buildQrCodeDataUrl(badgeId);
          return {
            badge_id: badgeId,
            full_name: staff.fullName.trim(),
            role: staff.role.trim(),
            phone_number: staff.phoneNumber.trim(),
            email,
            photo_url: staffPhotoUrls[index],
            photo_size_bytes: staff.photoFile!.size,
            qr_payload: qrPayload,
            qr_code_data_url: qrCodeDataUrl,
          };
        }),
      );

      const playersPayload = await Promise.all(
        players.map(async (player, index) => {
          const badgeId = buildBadgeId("PLAYER", teamCode, index + 1);
          const qrPayload = {
            badge_id: badgeId,
            member_type: "PLAYER",
            registration_id: registrationToken,
            team_name: teamName.trim(),
            team_code: teamCode,
            full_name: player.fullName.trim(),
            position: player.position.trim(),
            jersey_number: player.jerseyNumber.trim(),
            age: Number(player.age),
            scan_url: buildBadgeScanUrl({
              badgeId,
              originFallback: typeof window !== "undefined" ? window.location.origin : undefined,
            }),
          };
          const qrCodeDataUrl = await buildQrCodeDataUrl(badgeId);
          return {
            badge_id: badgeId,
            full_name: player.fullName.trim(),
            position: player.position.trim(),
            jersey_number: player.jerseyNumber.trim(),
            age: Number(player.age),
            photo_url: playerPhotoUrls[index],
            photo_size_bytes: player.photoFile!.size,
            qr_payload: qrPayload,
            qr_code_data_url: qrCodeDataUrl,
          };
        }),
      );

      showStatus("Submitting registration…", "info");
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_name: teamName.trim(),
          manager_name: managerName.trim(),
          phone_number: phoneNumber.trim(),
          contact_email: normalizeEmail(contactEmail),
          club_address: clubAddress.trim(),
          website: website.trim() || null,
          club_logo_url: logoUrl,
          photo_authorization: photoAuthorization,
          staff_members: staffPayload,
          players: playersPayload,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; registration_id?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Server failed to save registration.");
      }

      const registeredTeamName = teamName.trim() || "your team";
      showStatus(
        `${registeredTeamName} has been successfully registered for the Granpanpan Nations Cup!`,
        "success",
      );

      setTeamName("");
      setManagerName("");
      setPhoneNumber("");
      setContactEmail("");
      setClubAddress("");
      setWebsite("");
      setLogoPreview(null);
      setLogoFileName("");
      setLogoFile(null);
      setPhotoAuthorization(false);
      setStaffMembers([createStaff(1)]);
      setPlayers([createPlayer(1)]);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Failed to submit registration to Supabase.";

      showStatus(`Submission failed: ${message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[1100px] px-4 md:px-10">
          <div className="rounded-xl border border-[#004AD3]/15 bg-white p-8 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-10">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">
              Team Registration
            </p>
            <h1 className="mt-2 text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-5xl">
              Register Now
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#004AD3]/78 md:text-base">
              Fill the team profile and add your players roster for tournament verification.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-8">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
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
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
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
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
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
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
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
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
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
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                        Website
                      </span>
                      <input
                        type="text"
                        className={inputClassName}
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        placeholder="https://yourclub.com"
                      />
                    </label>
                  </div>
                </div>

                <aside className="rounded-lg border border-[#004AD3]/18 bg-[#ffffff] p-5 lg:col-span-4">
                  <p className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Club Logo</p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#004AD3]/35 bg-white px-4 py-5 text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <span className="text-sm font-semibold text-[#004AD3]">Upload Logo</span>
                  </label>
                  <p className="mt-2 text-[11px] text-[#004AD3]/60">Maximum file size: {MAX_IMAGE_SIZE_LABEL}</p>

                  {logoPreview ? (
                    <div className="mt-4 flex flex-col items-center rounded-md border border-[#004AD3]/18 bg-white p-3 text-center">
                      <Image
                        src={logoPreview}
                        alt="Club logo preview"
                        width={120}
                        height={120}
                        unoptimized
                        className="h-[120px] w-[120px] rounded-md border border-[#004AD3]/18 object-contain"
                      />
                      <p className="mt-2 text-xs text-[#004AD3]/72">{logoFileName}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[#004AD3]/60">No logo selected yet.</p>
                  )}
                </aside>
              </div>

              <section className="rounded-lg border border-[#FF6B53]/20 bg-[#FFF8F4] p-5 md:p-6">
                <h2 className="text-lg font-extrabold [font-family:var(--font-nav),sans-serif] text-[#0D47B5] uppercase md:text-xl">
                  Photo Memo & Authorization
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#0D47B5]/82">
                  Memo: All staff and player photos must be identity photos (passport/ID style), with a clear face and
                  neutral background. These photos will be used for official badges, passes, and tournament
                  identification.
                </p>
                <label className="mt-4 flex items-start gap-3 rounded-md border border-[#0D47B5]/20 bg-white p-4">
                  <input
                    type="checkbox"
                    checked={photoAuthorization}
                    onChange={(event) => setPhotoAuthorization(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0D47B5]"
                    required
                  />
                  <span className="text-sm font-semibold leading-6 text-[#0D47B5]/88">
                    I authorize the tournament organizers to use submitted staff and player photos for badges, passes,
                    and official identity materials.
                  </span>
                </label>
              </section>

              <section className="rounded-lg border border-[#004AD3]/15 bg-[#ffffff] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase">
                    Staff List
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold tracking-[0.08em] text-[#FF6B53] uppercase">
                      {staffMembers.length}/{STAFF_MAX_COUNT} Staff
                    </p>
                    <button
                      type="button"
                      onClick={addStaff}
                      disabled={staffMembers.length >= STAFF_MAX_COUNT}
                      className={`inline-flex items-center gap-2 rounded-md border border-[#004AD3] bg-white px-4 py-2 text-xs font-bold tracking-[0.08em] text-[#004AD3] uppercase ${
                        staffMembers.length >= STAFF_MAX_COUNT
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-[#ffffff]"
                      }`}
                    >
                      <AppIcon name="person_add" className="text-base" />
                      Add Staff
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#004AD3]/68">
                  Minimum {STAFF_MIN_COUNT}, maximum {STAFF_MAX_COUNT} staff members. Each staff member must use a
                  unique email address.
                </p>

                <div className="mt-4 space-y-3">
                  {staffMembers.map((staff, index) => (
                    <article key={staff.id} className="rounded-md border border-[#004AD3]/15 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                          Staff {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeStaff(staff.id)}
                          disabled={staffMembers.length <= STAFF_MIN_COUNT}
                          className={`inline-flex items-center gap-1 rounded border border-[#FF6B53]/35 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#FF6B53] uppercase ${
                            staffMembers.length <= STAFF_MIN_COUNT
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-[#ffffff]"
                          }`}
                        >
                          <AppIcon name="delete" className="text-sm" />
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <label className="space-y-1 md:col-span-4">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
                            Full Name
                          </span>
                          <input
                            className={inputClassName}
                            value={staff.fullName}
                            onChange={(event) => updateStaff(staff.id, "fullName", event.target.value)}
                            required
                          />
                        </label>

                        <label className="space-y-1 md:col-span-3">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
                            Role
                          </span>
                          <select
                            className={inputClassName}
                            value={staff.role}
                            onChange={(event) => updateStaff(staff.id, "role", event.target.value)}
                            required
                          >
                            <option value="">Select role</option>
                            {staffRoleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 md:col-span-3">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
                            Phone
                          </span>
                          <input
                            className={inputClassName}
                            value={staff.phoneNumber}
                            onChange={(event) => updateStaff(staff.id, "phoneNumber", event.target.value)}
                            required
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
                            Email
                          </span>
                          <input
                            type="email"
                            className={inputClassName}
                            value={staff.email}
                            onChange={(event) => updateStaff(staff.id, "email", event.target.value)}
                            required
                          />
                        </label>

                        <label className="space-y-1 md:col-span-8">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
                            Identity Photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className={inputClassName}
                            onChange={(event) => updateStaffPhoto(staff.id, event)}
                            required
                          />
                          <p className="text-[11px] text-[#004AD3]/60">
                            Accepted: clear ID-style photo (headshot only). Max {MAX_IMAGE_SIZE_LABEL}.
                          </p>
                        </label>

                        <div className="md:col-span-4">
                          {staff.photoPreview ? (
                            <div className="flex h-full flex-col items-center justify-center rounded-md border border-[#004AD3]/18 bg-white p-3 text-center">
                              <Image
                                src={staff.photoPreview}
                                alt={`${staff.fullName || `Staff ${index + 1}`} photo preview`}
                                width={92}
                                height={92}
                                unoptimized
                                className="h-[92px] w-[92px] rounded-md border border-[#004AD3]/18 object-cover"
                              />
                              <p className="mt-2 max-w-full truncate text-[11px] text-[#004AD3]/72">
                                {staff.photoFileName}
                              </p>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#004AD3]/20 bg-[#FAFCFF] p-3 text-center text-xs text-[#004AD3]/58">
                              No staff photo uploaded yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#004AD3]/15 bg-[#ffffff] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase">
                    Players Roster
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold tracking-[0.08em] text-[#0D47B5]/70 uppercase">
                      {players.length}/{PLAYER_MAX_COUNT}
                    </p>
                    <button
                      type="button"
                      onClick={addPlayer}
                      disabled={players.length >= PLAYER_MAX_COUNT}
                      className={`inline-flex items-center gap-2 rounded-md border border-[#004AD3] bg-white px-4 py-2 text-xs font-bold tracking-[0.08em] text-[#004AD3] uppercase ${
                        players.length >= PLAYER_MAX_COUNT ? "cursor-not-allowed opacity-50" : "hover:bg-[#ffffff]"
                      }`}
                    >
                      <AppIcon name="person_add" className="text-base" />
                      Add Player
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#004AD3]/68">
                  Maximum {PLAYER_MAX_COUNT} players allowed per team.
                </p>

                <div className="mt-4 space-y-3">
                  {players.map((player, index) => (
                    <article key={player.id} className="rounded-md border border-[#004AD3]/15 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                          Player {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          className="inline-flex items-center gap-1 rounded border border-[#FF6B53]/35 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#FF6B53] uppercase hover:bg-[#ffffff]"
                        >
                          <AppIcon name="delete" className="text-sm" />
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <label className="space-y-1 md:col-span-5">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
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
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
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
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
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
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
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

                        <label className="space-y-1 md:col-span-8">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/65 uppercase">
                            Identity Photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className={inputClassName}
                            onChange={(event) => updatePlayerPhoto(player.id, event)}
                            required
                          />
                          <p className="text-[11px] text-[#004AD3]/60">
                            Accepted: clear ID-style photo (headshot only). Max {MAX_IMAGE_SIZE_LABEL}.
                          </p>
                        </label>

                        <div className="md:col-span-4">
                          {player.photoPreview ? (
                            <div className="flex h-full flex-col items-center justify-center rounded-md border border-[#004AD3]/18 bg-white p-3 text-center">
                              <Image
                                src={player.photoPreview}
                                alt={`${player.fullName || `Player ${index + 1}`} photo preview`}
                                width={92}
                                height={92}
                                unoptimized
                                className="h-[92px] w-[92px] rounded-md border border-[#004AD3]/18 object-cover"
                              />
                              <p className="mt-2 max-w-full truncate text-[11px] text-[#004AD3]/72">
                                {player.photoFileName}
                              </p>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#004AD3]/20 bg-[#FAFCFF] p-3 text-center text-xs text-[#004AD3]/58">
                              No player photo uploaded yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-none border border-[#0B6A9B] px-7 py-3 text-sm font-extrabold tracking-[0.08em] text-white uppercase ${
                    isSubmitting ? "cursor-not-allowed bg-[#0B6A9B]/70" : "bg-[#1AD1D7] hover:bg-[#0B6A9B]"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </button>
                <a
                  href={CONTACT_PAGE_HREF}
                  className="rounded-none border border-[#004AD3] px-7 py-3 text-sm font-extrabold tracking-[0.08em] text-[#004AD3] uppercase hover:bg-[#F8FBFF]"
                >
                  Contact
                </a>
              </div>

            </form>
          </div>
        </section>
      </main>

      {statusMessage ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02163D]/45 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeStatus();
            }
          }}
        >
          <div
            className={`relative w-full max-w-[760px] rounded-2xl border px-6 py-5 shadow-[0_20px_44px_rgba(0,0,0,0.24)] ${
              statusTone === "error"
                ? "border-[#B3261E]/35 bg-[#FFF4F4] text-[#8A1C18]"
                : "border-[#0D47B5]/35 bg-[#0D47B5] text-white"
            }`}
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={closeStatus}
              aria-label="Close notification"
              className={`absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                statusTone === "error" ? "text-[#8A1C18] hover:bg-[#8A1C18]/10" : "text-white hover:bg-white/15"
              }`}
            >
              <AppIcon name="close" className="text-[18px]" />
            </button>
            <div className="flex items-start gap-3 pr-10">
              <span
                className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  statusTone === "error" ? "bg-[#8A1C18]/12 text-[#8A1C18]" : "bg-white/16 text-white"
                }`}
              >
                <AppIcon name={statusTone === "error" ? "error" : "check_circle"} className="text-[18px]" />
              </span>
              <p className="text-lg leading-8">{statusMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter variant="register" />
    </div>
  );
}
