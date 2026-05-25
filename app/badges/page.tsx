"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";
import { getSupabaseClient } from "@/lib/supabase/client";

type BadgeMember = {
  key: string;
  memberType: "STAFF" | "PLAYER";
  registereId: string;
  teamName: string;
  badgeId: string;
  fullName: string;
  title: string;
  subtitle: string;
  photoUrl: string;
  qrCodeDataUrl: string;
};

type MembersApiResponse = {
  members: Array<{
    key: string;
    memberType: "STAFF" | "PLAYER";
    registereId: string;
    teamName: string;
    badgeId: string;
    fullName: string;
    title: string;
    subtitle: string;
    photoUrl: string | null;
    qrCodeDataUrl: string | null;
  }>;
  staffCount: number;
  playerCount: number;
  error?: string;
};

type BadgeLayout = {
  photoX: number;
  photoYTop: number;
  photoSize: number;
  qrX: number;
  qrYTop: number;
  qrSize: number;
  nameX: number;
  nameYTop: number;
  nameSize: number;
  titleX: number;
  titleYTop: number;
  titleSize: number;
  teamX: number;
  teamYTop: number;
  teamSize: number;
  idX: number;
  idYTop: number;
  idSize: number;
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

const defaultLayout: BadgeLayout = {
  photoX: 0.34,
  photoYTop: 0.215,
  photoSize: 0.28,
  qrX: 0.69,
  qrYTop: 0.74,
  qrSize: 0.22,
  nameX: 0.08,
  nameYTop: 0.64,
  nameSize: 0.056,
  titleX: 0.08,
  titleYTop: 0.70,
  titleSize: 0.036,
  teamX: 0.08,
  teamYTop: 0.75,
  teamSize: 0.031,
  idX: 0.08,
  idYTop: 0.80,
  idSize: 0.030,
};

const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("Invalid data URL.");
  }

  const base64 = dataUrl.slice(commaIndex + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image source."));
    image.src = src;
  });

const createFittedPhotoDataUrl = async (sourceDataUrl: string, size = 900): Promise<string> => {
  const image = await loadImageElement(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  context.clearRect(0, 0, size, size);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, size, size);

  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;
  const ratio = Math.min(size / sourceWidth, size / sourceHeight);
  const drawWidth = sourceWidth * ratio;
  const drawHeight = sourceHeight * ratio;
  const drawX = (size - drawWidth) / 2;
  const drawY = (size - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  return canvas.toDataURL("image/png");
};

const clampPercent = (value: number) => Math.max(0, Math.min(1, value));

const updateLayoutValue = (layout: BadgeLayout, key: keyof BadgeLayout, value: number): BadgeLayout => ({
  ...layout,
  [key]: clampPercent(value),
});

const drawStrongBlackText = ({
  page,
  text,
  x,
  y,
  size,
  font,
  hasTrueBoldFont,
}: {
  page: import("pdf-lib").PDFPage;
  text: string;
  x: number;
  y: number;
  size: number;
  font: import("pdf-lib").PDFFont;
  hasTrueBoldFont: boolean;
}) => {
  const color = rgb(0, 0, 0);

  if (hasTrueBoldFont) {
    page.drawText(text, { x, y, size, font, color });
    return;
  }

  const offset = Math.max(0.35, size * 0.03);
  const passes: Array<[number, number]> = [
    [0, 0],
    [offset, 0],
    [-offset, 0],
    [0, offset],
    [0, -offset],
    [offset * 0.7, offset * 0.7],
    [offset * 0.7, -offset * 0.7],
    [-offset * 0.7, offset * 0.7],
    [-offset * 0.7, -offset * 0.7],
  ];

  passes.forEach(([dx, dy]) => {
    page.drawText(text, {
      x: x + dx,
      y: y + dy,
      size,
      font,
      color,
    });
  });
};

const BadgesPageFallback = () => (
  <div className="flex min-h-screen flex-col bg-[#ffffff]">
    <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />
    <main className="flex-1 pt-24 pb-16">
      <section className="mx-auto w-full max-w-[1200px] px-4 md:px-10">
        <div className="rounded-xl border border-[#004AD3]/15 bg-white p-6 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Badge Generator</p>
          <h1 className="mt-2 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-4xl">
            Nations Cup PDF Template
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#004AD3]/78 md:text-base">
            Loading badge generator...
          </p>
        </div>
      </section>
    </main>
    <SiteFooter variant="register" />
  </div>
);

function BadgesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMemberKey = searchParams.get("member") ?? "";
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<BadgeMember[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedMemberKey, setSelectedMemberKey] = useState("");
  const [templatePdfBytes, setTemplatePdfBytes] = useState<ArrayBuffer | null>(null);
  const [montserratRegularBytes, setMontserratRegularBytes] = useState<ArrayBuffer | null>(null);
  const [montserratBoldBytes, setMontserratBoldBytes] = useState<ArrayBuffer | null>(null);
  const [layout, setLayout] = useState<BadgeLayout>(defaultLayout);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedBytes, setGeneratedBytes] = useState<ArrayBuffer | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const selectedMember = useMemo(
    () => members.find((member) => member.key === selectedMemberKey) ?? null,
    [members, selectedMemberKey],
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setStatusMessage("Loading registered members and badge template...");

      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          if (isMounted) {
            setStatusMessage("Please login to access badge generator.");
            setIsLoading(false);
          }
          router.replace(
            `/admin/login?next=${encodeURIComponent(
              requestedMemberKey ? `/badges?member=${requestedMemberKey}` : "/badges",
            )}`,
          );
          return;
        }

        const [membersResponse, templateResult, montserratResult, montserratBoldResult] = await Promise.all([
          fetch("/api/members", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }),
          fetch("/Nations%20Cup.pdf"),
          fetch("/Montserrat-Regular.ttf"),
          fetch("/Montserrat-Bold.ttf"),
        ]);

        const membersResult = (await membersResponse.json().catch(() => null)) as MembersApiResponse | null;

        if (membersResponse.status === 401) {
          await supabase.auth.signOut();
          if (isMounted) {
            setStatusMessage("Session expired. Please login again.");
            setIsLoading(false);
          }
          router.replace(
            `/admin/login?next=${encodeURIComponent(
              requestedMemberKey ? `/badges?member=${requestedMemberKey}` : "/badges",
            )}`,
          );
          return;
        }

        if (membersResponse.status === 403) {
          await supabase.auth.signOut();
          if (isMounted) {
            setStatusMessage("Access denied: this account is not authorized for admin.");
            setIsLoading(false);
          }
          router.replace("/admin/login?next=/badges");
          return;
        }

        if (!membersResponse.ok) {
          throw new Error(membersResult?.error || "Unable to fetch members for badges.");
        }
        if (!templateResult.ok) {
          throw new Error("Template PDF (Nations Cup.pdf) could not be loaded.");
        }
        if (!montserratResult.ok) {
          throw new Error("Montserrat-Regular.ttf could not be loaded.");
        }

        const combinedMembers: BadgeMember[] = (membersResult?.members ?? [])
          .filter((row) => Boolean(row.photoUrl) && Boolean(row.qrCodeDataUrl) && Boolean(row.badgeId))
          .map((row) => ({
            key: row.key,
            memberType: row.memberType,
            registereId: row.registereId,
            teamName: row.teamName,
            badgeId: row.badgeId,
            fullName: row.fullName,
            title: row.title,
            subtitle: row.subtitle,
            photoUrl: row.photoUrl as string,
            qrCodeDataUrl: row.qrCodeDataUrl as string,
          }));
        const templateBytes = await templateResult.arrayBuffer();
        const montserratBytes = await montserratResult.arrayBuffer();
        const montserratBold = montserratBoldResult.ok ? await montserratBoldResult.arrayBuffer() : null;

        if (!isMounted) return;

        setMembers(combinedMembers);
        setTemplatePdfBytes(templateBytes);
        setMontserratRegularBytes(montserratBytes);
        setMontserratBoldBytes(montserratBold);
        setSelectedMemberKey(
          requestedMemberKey && combinedMembers.some((member) => member.key === requestedMemberKey)
            ? requestedMemberKey
            : (combinedMembers[0]?.key ?? ""),
        );
        setStatusMessage(combinedMembers.length > 0 ? null : "No complete badge data found yet.");
      } catch (error: unknown) {
        if (!isMounted) return;
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unable to load badge data.";
        setStatusMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [requestedMemberKey, router]);

  useEffect(() => {
    if (!selectedMember || !templatePdfBytes || !montserratRegularBytes) {
      return;
    }

    let cancelled = false;
    let localPreviewUrl: string | null = null;

    const generate = async () => {
      setIsGenerating(true);
      setStatusMessage("Generating badge from the exact Nations Cup PDF template...");

      try {
        const pdfDoc = await PDFDocument.load(templatePdfBytes);
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        const baseFont = await pdfDoc.embedFont(montserratRegularBytes);
        const hasTrueBoldFont = Boolean(montserratBoldBytes);
        const boldFont = montserratBoldBytes ? await pdfDoc.embedFont(montserratBoldBytes) : baseFont;

        const photoDataUrl = await createFittedPhotoDataUrl(selectedMember.photoUrl);
        const photoBytes = dataUrlToUint8Array(photoDataUrl);
        const qrBytes = dataUrlToUint8Array(selectedMember.qrCodeDataUrl);

        const photoImage = await pdfDoc.embedPng(photoBytes);
        const qrImage = selectedMember.qrCodeDataUrl.startsWith("data:image/jpeg")
          ? await pdfDoc.embedJpg(qrBytes)
          : await pdfDoc.embedPng(qrBytes);

        const photoSize = width * layout.photoSize;
        const photoX = width * layout.photoX;
        const photoY = height - height * layout.photoYTop - photoSize;

        const qrSize = width * layout.qrSize;
        const qrX = width * layout.qrX;
        const qrY = height - height * layout.qrYTop - qrSize;

        const photoPadding = width * 0.02;
        page.drawRectangle({
          x: photoX - photoPadding,
          y: photoY - photoPadding,
          width: photoSize + photoPadding * 2,
          height: photoSize + photoPadding * 2,
          color: rgb(1, 1, 1),
        });

        const qrPadding = width * 0.015;
        page.drawRectangle({
          x: qrX - qrPadding,
          y: qrY - qrPadding,
          width: qrSize + qrPadding * 2,
          height: qrSize + qrPadding * 2,
          color: rgb(1, 1, 1),
        });

        const textLeft = width * (Math.min(layout.nameX, layout.titleX, layout.teamX, layout.idX) - 0.03);
        const textTop = height * (Math.min(layout.nameYTop, layout.titleYTop, layout.teamYTop, layout.idYTop) - 0.05);
        const textBottom =
          height * (Math.max(layout.nameYTop, layout.titleYTop, layout.teamYTop, layout.idYTop) + 0.05);
        const textHeight = Math.max(width * 0.12, textBottom - textTop);

        page.drawRectangle({
          x: textLeft,
          y: height - textTop - textHeight,
          width: width * 0.66,
          height: textHeight,
          color: rgb(1, 1, 1),
        });

        page.drawImage(photoImage, {
          x: photoX,
          y: photoY,
          width: photoSize,
          height: photoSize,
        });

        page.drawImage(qrImage, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });

        drawStrongBlackText({
          page,
          text: selectedMember.fullName.toUpperCase(),
          x: width * layout.nameX,
          y: height - height * layout.nameYTop,
          size: width * layout.nameSize,
          font: boldFont,
          hasTrueBoldFont,
        });

        drawStrongBlackText({
          page,
          text: `${selectedMember.title} - ${selectedMember.subtitle}`.toUpperCase(),
          x: width * layout.titleX,
          y: height - height * layout.titleYTop,
          size: width * layout.titleSize,
          font: boldFont,
          hasTrueBoldFont,
        });

        drawStrongBlackText({
          page,
          text: `TEAM: ${selectedMember.teamName.toUpperCase()}`,
          x: width * layout.teamX,
          y: height - height * layout.teamYTop,
          size: width * layout.teamSize,
          font: boldFont,
          hasTrueBoldFont,
        });

        drawStrongBlackText({
          page,
          text: `ID: ${selectedMember.badgeId}`,
          x: width * layout.idX,
          y: height - height * layout.idYTop,
          size: width * layout.idSize,
          font: boldFont,
          hasTrueBoldFont,
        });

        const bytes = await pdfDoc.save();
        const byteCopy = new Uint8Array(bytes.length);
        byteCopy.set(bytes);
        const safeBuffer = byteCopy.buffer;

        const blob = new Blob([safeBuffer], { type: "application/pdf" });
        localPreviewUrl = URL.createObjectURL(blob);

        if (cancelled) {
          URL.revokeObjectURL(localPreviewUrl);
          return;
        }

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = localPreviewUrl;
        setGeneratedBytes(safeBuffer);
        setPreviewUrl(localPreviewUrl);
        setStatusMessage(null);
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Failed to generate the badge PDF.";

        if (!cancelled) {
          setStatusMessage(message);
          setGeneratedBytes(null);
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
          }
          setPreviewUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    };

    void generate();

    return () => {
      cancelled = true;
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [layout, montserratBoldBytes, montserratRegularBytes, selectedMember, templatePdfBytes]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleDownload = () => {
    if (!selectedMember || !generatedBytes) return;

    const blob = new Blob([generatedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedMember.badgeId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[1200px] px-4 md:px-10">
          <div className="rounded-xl border border-[#004AD3]/15 bg-white p-6 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-8">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Badge Generator</p>
            <h1 className="mt-2 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-4xl">
              Nations Cup PDF Template
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#004AD3]/78 md:text-base">
              This page uses the exact original file <strong>Nations Cup.pdf</strong> and only injects real photo, name,
              title, ID, and QR data.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-4">
                <label className="space-y-2">
                  <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                    Member Selection
                  </span>
                  <select
                    className="w-full rounded-md border border-[#004AD3]/20 bg-white px-3 py-2 text-sm text-[#004AD3] outline-none focus:border-[#004AD3] focus:ring-2 focus:ring-[#004AD3]/15"
                    value={selectedMemberKey}
                    onChange={(event) => setSelectedMemberKey(event.target.value)}
                    disabled={isLoading || members.length === 0}
                  >
                    {members.map((member) => (
                      <option key={member.key} value={member.key}>
                        {member.memberType} - {member.fullName} ({member.badgeId})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-md border border-[#004AD3]/12 bg-[#FAFCFF] p-4">
                  <p className="text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Position Controls</p>
                  <p className="mt-2 text-[11px] leading-5 text-[#004AD3]/65">
                    Keep these values only for alignment fine-tuning while staying on the same exact template.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        ["photoX", "Photo X"],
                        ["photoYTop", "Photo Y"],
                        ["photoSize", "Photo Size"],
                        ["qrX", "QR X"],
                        ["qrYTop", "QR Y"],
                        ["qrSize", "QR Size"],
                        ["nameX", "Name X"],
                        ["nameYTop", "Name Y"],
                        ["nameSize", "Name Size"],
                        ["titleX", "Title X"],
                        ["titleYTop", "Title Y"],
                        ["titleSize", "Title Size"],
                        ["teamX", "Team X"],
                        ["teamYTop", "Team Y"],
                        ["teamSize", "Team Size"],
                        ["idX", "ID X"],
                        ["idYTop", "ID Y"],
                        ["idSize", "ID Size"],
                      ] as Array<[keyof BadgeLayout, string]>
                    ).map(([key, label]) => (
                      <label key={key} className="space-y-1">
                        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">
                          {label}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.005}
                          value={layout[key]}
                          onChange={(event) => setLayout((current) => updateLayoutValue(current, key, Number(event.target.value)))}
                          className="w-full rounded border border-[#004AD3]/20 px-2 py-1 text-xs text-[#004AD3] outline-none focus:border-[#004AD3]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!generatedBytes || isGenerating}
                  className={`w-full rounded-none border border-[#0B6A9B] px-5 py-3 text-sm font-extrabold tracking-[0.08em] text-white uppercase ${
                    !generatedBytes || isGenerating
                      ? "cursor-not-allowed bg-[#0B6A9B]/60"
                      : "bg-[#1AD1D7] hover:bg-[#0B6A9B]"
                  }`}
                >
                  {isGenerating ? "Generating..." : "Download Exact PDF Badge"}
                </button>

                {statusMessage ? <p className="text-sm text-[#004AD3]/80">{statusMessage}</p> : null}
              </div>

              <div className="lg:col-span-8">
                <div className="h-[760px] overflow-hidden rounded-lg border border-[#004AD3]/15 bg-white">
                  {previewUrl ? (
                    <iframe title="Badge preview" src={previewUrl} className="h-full w-full border-0" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#004AD3]/65">
                      Select a member to preview the exact badge PDF.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter variant="register" />
    </div>
  );
}

export default function BadgesPage() {
  return (
    <Suspense fallback={<BadgesPageFallback />}>
      <BadgesPageContent />
    </Suspense>
  );
}
