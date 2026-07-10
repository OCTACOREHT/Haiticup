"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import { buildBadgeScanUrl } from "@/lib/badges/scan-url";
import { normalizeEmail } from "@/lib/registration-validation";
import {
  compressImageFile,
  readImageAsDataUrl,
  uploadToStorage,
  validateImageUpload,
} from "@/lib/image-upload";
import { buildBadgeId, buildTeamCode } from "@/lib/badges/utils";

const MAX_IMAGE_SIZE_LABEL = "5 MB";
const QR_IMAGE_SIZE_PX = 1400;

const inputClassName =
  "w-full rounded-md border border-[#004AD3]/20 bg-white px-3 py-2 text-sm text-[#004AD3] outline-none transition focus:border-[#004AD3] focus:ring-2 focus:ring-[#004AD3]/15";

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

export default function RegisterMediaPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [photoAuthorization, setPhotoAuthorization] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const showStatus = (message: string, tone: "info" | "success" | "error" = "info") => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  const clearStatus = () => setStatusMessage(null);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateImageUpload(selectedFile, "Media photo");
    if (validationError) {
      showStatus(validationError, "error");
      event.target.value = "";
      return;
    }

    readImageAsDataUrl(
      selectedFile,
      (dataUrl) => {
        setPhotoPreview(dataUrl);
        setPhotoFileName(selectedFile.name);
        setPhotoFile(selectedFile);
        clearStatus();
      },
      () => showStatus("Unable to read the photo file. Please try another image.", "error"),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!fullName.trim() || !email.trim() || !mediaName.trim()) {
      showStatus("Please complete all fields.", "error");
      return;
    }

    if (!photoFile || !photoPreview) {
      showStatus("Please upload your identity photo.", "error");
      return;
    }

    if (!photoAuthorization) {
      showStatus("Please authorize photo usage.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationToken = crypto.randomUUID();
      const mediaCode = buildTeamCode(mediaName, registrationToken);
      const folder = `media-${registrationToken}`;

      showStatus("Uploading photo…", "info");
      const compressedPhoto = await compressImageFile(photoFile);
      const uploadedPhotoUrl = await uploadToStorage(compressedPhoto, `${folder}/photo.jpg`);

      showStatus("Generating QR code…", "info");
      const badgeId = buildBadgeId("MEDIA", mediaCode, 1);
      const qrPayload = {
        badge_id: badgeId,
        member_type: "MEDIA",
        registration_id: registrationToken,
        full_name: fullName.trim(),
        media_name: mediaName.trim(),
        email: normalizeEmail(email),
        scan_url: buildBadgeScanUrl({
          badgeId,
          originFallback: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      };
      const qrCodeDataUrl = await buildQrCodeDataUrl(badgeId);

      showStatus("Submitting registration…", "info");
      const response = await fetch("/api/register-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: normalizeEmail(email),
          media_name: mediaName.trim(),
          photo_url: uploadedPhotoUrl,
          photo_size_bytes: photoFile.size,
          badge_id: badgeId,
          qr_payload: qrPayload,
          qr_code_data_url: qrCodeDataUrl,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Server failed to save registration.");
      }

      showStatus("Your media registration was successfully submitted!", "success");

      setFullName("");
      setEmail("");
      setMediaName("");
      setPhotoPreview(null);
      setPhotoFileName("");
      setPhotoFile(null);
      setPhotoAuthorization(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit registration.";
      showStatus(`Submission failed: ${message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[800px] px-4 md:px-10">
          <div className="rounded-xl border border-[#004AD3]/15 bg-white p-8 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-10">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">
              Media Portal
            </p>
            <h1 className="mt-2 text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-5xl">
              Media Registration
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#004AD3]/78 md:text-base">
              Register as a media representative to request your tournament access badge.
            </p>

            {statusMessage && (
              <div
                className={`mt-6 rounded-md p-4 text-sm font-semibold ${
                  statusTone === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : statusTone === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {statusMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-8">
                  <div className="grid grid-cols-1 gap-5">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                        Full Name
                      </span>
                      <input
                        className={inputClassName}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                        Email Address
                      </span>
                      <input
                        type="email"
                        className={inputClassName}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="media@company.com"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                        Media / Organization Name
                      </span>
                      <input
                        className={inputClassName}
                        value={mediaName}
                        onChange={(e) => setMediaName(e.target.value)}
                        placeholder="Sports TV Haiti"
                        required
                      />
                    </label>
                  </div>
                </div>

                <aside className="rounded-lg border border-[#004AD3]/18 bg-[#ffffff] p-5 lg:col-span-4">
                  <p className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Identity Photo</p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#004AD3]/35 bg-white px-4 py-5 text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <span className="text-sm font-semibold text-[#004AD3]">Upload Photo</span>
                  </label>
                  <p className="mt-2 text-[11px] text-[#004AD3]/60">Max size: {MAX_IMAGE_SIZE_LABEL}</p>

                  {photoPreview ? (
                    <div className="mt-4 flex flex-col items-center rounded-md border border-[#004AD3]/18 bg-white p-3 text-center">
                      <Image
                        src={photoPreview}
                        alt="Photo preview"
                        width={120}
                        height={120}
                        unoptimized
                        className="h-[120px] w-[120px] rounded-md border border-[#004AD3]/18 object-cover"
                      />
                      <p className="mt-2 text-[10px] text-[#004AD3]/72 truncate w-full">{photoFileName}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[#004AD3]/60 text-center">No photo selected.</p>
                  )}
                </aside>
              </div>

              <section className="rounded-lg border border-[#FF6B53]/20 bg-[#FFF8F4] p-5 md:p-6">
                <label className="flex items-start gap-3 rounded-md border border-[#0D47B5]/20 bg-white p-4">
                  <input
                    type="checkbox"
                    checked={photoAuthorization}
                    onChange={(e) => setPhotoAuthorization(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0D47B5]"
                    required
                  />
                  <span className="text-sm font-semibold leading-6 text-[#0D47B5]/88">
                    I authorize the tournament organizers to use my submitted photo for official media badges and identification.
                  </span>
                </label>
              </section>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md border border-[#FF6B53] bg-[#FF6B53] px-8 py-3.5 text-sm font-extrabold tracking-[0.08em] [font-family:var(--font-nav),sans-serif] text-white uppercase transition-colors hover:bg-[#e55941] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter variant="register" />
    </div>
  );
}
