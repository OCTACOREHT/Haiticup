"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { canRenderBadgeMember } from "@/lib/badges/admin-badge-members";
import { toCanvasSafeImageSrc, generateSilhouetteDataUrl } from "@/lib/badges/canvas-image";
import { buildBadgeScanUrl } from "@/lib/badges/scan-url";
import { clearAdminServerSession } from "@/lib/supabase/admin-session-client";
import { getSupabaseClient } from "@/lib/supabase/client";

type BadgeMember = {
  key: string;
  memberType: "STAFF" | "PLAYER" | "MEDIA";
  registereId: string;
  teamName: string;
  badgeId: string;
  fullName: string;
  title: string;
  subtitle: string;
  photoUrl: string | null;
  qrCodeDataUrl: string | null;
  qrPayload: Record<string, unknown> | null;
};

type MembersApiResponse = {
  members: Array<{
    key: string;
    memberType: "STAFF" | "PLAYER" | "MEDIA";
    registereId: string;
    teamName: string;
    badgeId: string;
    fullName: string;
    title: string;
    subtitle: string;
    photoUrl: string | null;
    qrCodeDataUrl: string | null;
    qrPayload: Record<string, unknown> | null;
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

const BADGE_TEMPLATE_FILENAME = "Badge .pdf";
const BADGE_TEMPLATE_URL = "/Badge%20.pdf";
const QR_IMAGE_SIZE_PX = 1400;

const defaultLayout: BadgeLayout = {
  photoX: 0.363,
  photoYTop: 0.218,
  photoSize: 0.274,
  qrX: 0.39,
  qrYTop: 0.596,
  qrSize: 0.22,
  nameX: 0.5,
  nameYTop: 0.465,
  nameSize: 0.046,
  titleX: 0.5,
  titleYTop: 0.482,
  titleSize: 0.033,
  teamX: 0.5,
  teamYTop: 0.736,
  teamSize: 0.028,
  idX: 0.5,
  idYTop: 0.514,
  idSize: 0.031,
};

const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) throw new Error("Invalid data URL.");
  const base64 = dataUrl.slice(commaIndex + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image source."));
    image.src = toCanvasSafeImageSrc(src, window.location.origin);
  });

const normalizeQrDataUrl = async (sourceDataUrl: string, size = QR_IMAGE_SIZE_PX): Promise<string> => {
  const image = await loadImageElement(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context is unavailable.");
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  const imageData = context.getImageData(0, 0, size, size);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const binaryValue = luminance < 180 ? 0 : 255;
    data[i] = binaryValue; data[i + 1] = binaryValue; data[i + 2] = binaryValue; data[i + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

const buildPrintableQrDataUrl = async (member: BadgeMember): Promise<string> => {
  try {
    const scanUrl = buildBadgeScanUrl({
      badgeId: member.badgeId,
      originFallback: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    const generatedQr = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: "M", margin: 2, width: QR_IMAGE_SIZE_PX,
      color: { dark: "#000000FF", light: "#FFFFFFFF" },
    });
    return normalizeQrDataUrl(generatedQr);
  } catch {
    if (member.qrCodeDataUrl) {
      return normalizeQrDataUrl(member.qrCodeDataUrl);
    }

    throw new Error("QR code unavailable for this badge.");
  }
};

const createCircularPhotoDataUrl = async (sourceDataUrl: string | null | undefined, size = 900): Promise<string> => {
  if (!sourceDataUrl || !sourceDataUrl.trim()) {
    return generateSilhouetteDataUrl(size);
  }
  try {
    const image = await loadImageElement(sourceDataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is unavailable.");
    context.clearRect(0, 0, size, size);
    const sourceWidth = image.width || 1;
    const sourceHeight = image.height || 1;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    let cropSize = Math.min(sourceWidth, sourceHeight);
    let cropX = (sourceWidth - cropSize) / 2;
    let cropY = (sourceHeight - cropSize) / 2;
    type FaceDetectorLike = { detect: (image: CanvasImageSource) => Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>> };
    const maybeFaceDetector = (globalThis as { FaceDetector?: new (options?: Record<string, unknown>) => FaceDetectorLike }).FaceDetector;
    if (maybeFaceDetector) {
      try {
        const detector = new maybeFaceDetector({ maxDetectedFaces: 1, fastMode: true });
        const faces = await detector.detect(image);
        const primaryFace = faces?.[0];
        if (primaryFace?.boundingBox) {
          const face = primaryFace.boundingBox;
          const faceCenterX = face.x + face.width / 2;
          const faceCenterY = face.y + face.height * 0.62;
          cropSize = Math.min(Math.max(face.width * 2.6, face.height * 3), Math.min(sourceWidth, sourceHeight));
          cropX = faceCenterX - cropSize / 2;
          cropY = faceCenterY - cropSize / 2;
          cropX = clamp(cropX, 0, sourceWidth - cropSize);
          cropY = clamp(cropY, 0, sourceHeight - cropSize);
        }
      } catch { /* fallback */ }
    }
    if (!maybeFaceDetector) cropY = clamp(cropY + cropSize * 0.08, 0, sourceHeight - cropSize);
    context.save();
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    context.restore();
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to load player image, using silhouette:", error);
    return generateSilhouetteDataUrl(size);
  }
};

const drawStrongBlackText = ({ page, text, x, y, size, font, color = rgb(0, 0, 0) }: {
  page: import("pdf-lib").PDFPage; text: string; x: number; y: number; size: number;
  font: import("pdf-lib").PDFFont; color?: ReturnType<typeof rgb>;
}) => { page.drawText(text, { x, y, size, font, color }); };

const fitTextSizeToWidth = ({ font, text, startSize, minSize, maxWidth }: {
  font: import("pdf-lib").PDFFont; text: string; startSize: number; minSize: number; maxWidth: number;
}) => {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.4;
  return Math.max(size, minSize);
};

const BadgesPageFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
    <span aria-label="Loading" className="size-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
  </div>
);

function BadgesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMemberKey = searchParams.get("member") ?? "";
  const isEmbedded = searchParams.get("embed") === "1";
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<BadgeMember[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedMemberKey, setSelectedMemberKey] = useState("");
  const [templatePdfBytes, setTemplatePdfBytes] = useState<ArrayBuffer | null>(null);
  const [montserratRegularBytes, setMontserratRegularBytes] = useState<ArrayBuffer | null>(null);
  const [montserratBoldBytes, setMontserratBoldBytes] = useState<ArrayBuffer | null>(null);
  const [montserratSemiBoldBytes, setMontserratSemiBoldBytes] = useState<ArrayBuffer | null>(null);
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
      setStatusMessage("Chargement des données...");
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          await clearAdminServerSession();
          if (isMounted) { setStatusMessage("Connexion requise."); setIsLoading(false); }
          router.replace(`/admin/login?next=${encodeURIComponent(requestedMemberKey ? `/badges?member=${requestedMemberKey}${isEmbedded ? "&embed=1" : ""}` : isEmbedded ? "/badges?embed=1" : "/badges")}`);
          return;
        }
        const [membersResponse, templateResult, montserratResult, montserratBoldResult, montserratSemiBoldResult] = await Promise.all([
          fetch("/api/members", { method: "GET", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, cache: "no-store" }),
          fetch(BADGE_TEMPLATE_URL),
          fetch("/Montserrat-Regular.ttf"),
          fetch("/Montserrat-Bold.ttf"),
          fetch("/Montserrat-SemiBold.ttf"),
        ]);
        const membersResult = (await membersResponse.json().catch(() => null)) as MembersApiResponse | null;
        if (membersResponse.status === 401 || membersResponse.status === 403) {
          await supabase.auth.signOut();
          await clearAdminServerSession();
          if (isMounted) { setStatusMessage("Session expirée."); setIsLoading(false); }
          router.replace(`/admin/login?next=${encodeURIComponent(isEmbedded ? "/badges?embed=1" : "/badges")}`);
          return;
        }
        if (!membersResponse.ok) throw new Error(membersResult?.error || "Impossible de charger les membres.");
        if (!templateResult.ok) throw new Error(`Template PDF introuvable.`);
        if (!montserratResult.ok || !montserratBoldResult.ok || !montserratSemiBoldResult.ok) throw new Error("Fonts introuvables.");
        const combinedMembers: BadgeMember[] = (membersResult?.members ?? [])
          .filter(canRenderBadgeMember)
          .map((row) => ({ key: row.key, memberType: row.memberType, registereId: row.registereId, teamName: row.teamName, badgeId: row.badgeId, fullName: row.fullName, title: row.title, subtitle: row.subtitle, photoUrl: row.photoUrl, qrCodeDataUrl: row.qrCodeDataUrl, qrPayload: row.qrPayload }));
        if (!isMounted) return;
        setMembers(combinedMembers);
        setTemplatePdfBytes(await templateResult.arrayBuffer());
        setMontserratRegularBytes(await montserratResult.arrayBuffer());
        setMontserratBoldBytes(await montserratBoldResult.arrayBuffer());
        setMontserratSemiBoldBytes(await montserratSemiBoldResult.arrayBuffer());
        setSelectedMemberKey(requestedMemberKey && combinedMembers.some((m) => m.key === requestedMemberKey) ? requestedMemberKey : (combinedMembers[0]?.key ?? ""));
        setStatusMessage(combinedMembers.length > 0 ? null : "Aucun membre avec badge complet trouvé.");
      } catch (error: unknown) {
        if (!isMounted) return;
        setStatusMessage(error instanceof Error ? error.message : "Erreur de chargement.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadData();
    return () => { isMounted = false; };
  }, [isEmbedded, requestedMemberKey, router]);

  useEffect(() => {
    if (!selectedMember || !templatePdfBytes || !montserratRegularBytes || !montserratBoldBytes || !montserratSemiBoldBytes) return;
    let cancelled = false;
    let localPreviewUrl: string | null = null;
    const generate = async () => {
      setIsGenerating(true);
      setStatusMessage("Génération du badge PDF...");
      try {
        const pdfDoc = await PDFDocument.load(templatePdfBytes);
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        const montserratBoldFont = await pdfDoc.embedFont(montserratBoldBytes!, { subset: false });
        const montserratSemiBoldFont = await pdfDoc.embedFont(montserratSemiBoldBytes!, { subset: false });
        const layout = defaultLayout;
        const badgeBlue = rgb(0.03, 0.07, 0.36);
        const photoDataUrl = await createCircularPhotoDataUrl(selectedMember.photoUrl);
        const printableQrDataUrl = await buildPrintableQrDataUrl(selectedMember);
        const photoBytes = dataUrlToUint8Array(photoDataUrl);
        const qrBytes = dataUrlToUint8Array(printableQrDataUrl);
        const photoImage = await pdfDoc.embedPng(photoBytes);
        const qrImage = printableQrDataUrl.startsWith("data:image/jpeg") ? await pdfDoc.embedJpg(qrBytes) : await pdfDoc.embedPng(qrBytes);
        const photoSize = width * layout.photoSize;
        const photoX = width * layout.photoX;
        const photoY = height - height * layout.photoYTop - photoSize;
        const qrSize = width * layout.qrSize;
        const qrX = width * layout.qrX;
        const qrY = height - height * layout.qrYTop - qrSize;
        page.drawImage(photoImage, { x: photoX, y: photoY, width: photoSize, height: photoSize });
        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
        const resolveBadgeLine = ({ text, sizePercent, maxWidthPercent, font, minScale = 0.55 }: { text: string; sizePercent: number; maxWidthPercent: number; font: import("pdf-lib").PDFFont; minScale?: number }) => {
          const startSize = width * sizePercent;
          const size = fitTextSizeToWidth({ font, text, startSize, minSize: Math.max(7, startSize * minScale), maxWidth: width * maxWidthPercent });
          return { size, lineHeight: font.heightAtSize(size), textWidth: font.widthOfTextAtSize(text, size) };
        };
        const drawCenteredResolvedLine = ({ text, font, topPx, size, lineHeight, textWidth }: { text: string; font: import("pdf-lib").PDFFont; topPx: number; size: number; lineHeight: number; textWidth: number }) => {
          const y = height - topPx - lineHeight;
          const x = width * 0.5 - textWidth / 2;
          drawStrongBlackText({ page, text, x, y, size, font, color: badgeBlue });
          return { bottomTopPx: topPx + lineHeight };
        };
        const typeText = selectedMember.memberType.toUpperCase();
        const nameText = selectedMember.fullName;
        const roleText = selectedMember.subtitle || selectedMember.title;
        const idText = `ID N : ${selectedMember.badgeId}`;
        const typeLine = resolveBadgeLine({ text: typeText, sizePercent: 0.038, maxWidthPercent: 0.5, font: montserratBoldFont, minScale: 0.7 });
        const nameLine = resolveBadgeLine({ text: nameText, sizePercent: layout.nameSize, maxWidthPercent: 0.78, font: montserratBoldFont, minScale: 0.42 });
        const roleLine = resolveBadgeLine({ text: roleText, sizePercent: layout.titleSize, maxWidthPercent: 0.78, font: montserratSemiBoldFont, minScale: 0.5 });
        const idLine = resolveBadgeLine({ text: idText, sizePercent: layout.idSize, maxWidthPercent: 0.88, font: montserratSemiBoldFont, minScale: 0.42 });
        const interlinePx = width * 0.0045;
        const typeToNameGapPx = width * 0.006;
        const nameTopPx = height * layout.nameYTop;
        const typeTopPx = nameTopPx - typeLine.lineHeight - typeToNameGapPx;
        drawCenteredResolvedLine({ text: typeText, font: montserratBoldFont, topPx: typeTopPx, size: typeLine.size, lineHeight: typeLine.lineHeight, textWidth: typeLine.textWidth });
        const nameDraw = drawCenteredResolvedLine({ text: nameText, font: montserratBoldFont, topPx: nameTopPx, size: nameLine.size, lineHeight: nameLine.lineHeight, textWidth: nameLine.textWidth });
        const roleTopPx = nameDraw.bottomTopPx + interlinePx;
        const roleDraw = drawCenteredResolvedLine({ text: roleText, font: montserratSemiBoldFont, topPx: roleTopPx, size: roleLine.size, lineHeight: roleLine.lineHeight, textWidth: roleLine.textWidth });
        const idTopPx = roleDraw.bottomTopPx + interlinePx;
        drawCenteredResolvedLine({ text: idText, font: montserratSemiBoldFont, topPx: idTopPx, size: idLine.size, lineHeight: idLine.lineHeight, textWidth: idLine.textWidth });
        const scanText = "SCAN ME";
        const scanSize = fitTextSizeToWidth({ font: montserratBoldFont, text: scanText, startSize: width * 0.052, minSize: width * 0.04, maxWidth: qrSize + width * 0.12 });
        const scanX = qrX + qrSize / 2 - montserratBoldFont.widthOfTextAtSize(scanText, scanSize) / 2;
        const scanY = qrY - width * 0.055;
        drawStrongBlackText({ page, text: scanText, x: scanX, y: scanY, size: scanSize, font: montserratBoldFont, color: badgeBlue });
        const validText = "VALID UNTIL: 12/2026";
        const validSize = width * 0.03;
        const validX = qrX + qrSize / 2 - montserratSemiBoldFont.widthOfTextAtSize(validText, validSize) / 2;
        const validY = scanY - width * 0.055;
        drawStrongBlackText({ page, text: validText, x: validX, y: validY, size: validSize, font: montserratSemiBoldFont, color: badgeBlue });
        const secondPage = pdfDoc.getPages()[1];
        if (secondPage) {
          const websiteText = "www.granpanpannationscup.com";
          const { width: page2Width, height: page2Height } = secondPage.getSize();
          const websiteSize = fitTextSizeToWidth({ font: montserratBoldFont, text: websiteText, startSize: page2Width * 0.028, minSize: page2Width * 0.02, maxWidth: page2Width * 0.82 });
          const websiteWidth = montserratBoldFont.widthOfTextAtSize(websiteText, websiteSize);
          const websiteLineHeight = montserratBoldFont.heightAtSize(websiteSize);
          const websiteX = page2Width / 2 - websiteWidth / 2;
          const websiteTopPx = page2Height * 0.66;
          const websiteY = page2Height - websiteTopPx - websiteLineHeight;
          drawStrongBlackText({ page: secondPage, text: websiteText, x: websiteX, y: websiteY, size: websiteSize, font: montserratBoldFont, color: badgeBlue });
        }
        const bytes = await pdfDoc.save();
        const byteCopy = new Uint8Array(bytes.length);
        byteCopy.set(bytes);
        const safeBuffer = byteCopy.buffer;
        const blob = new Blob([safeBuffer], { type: "application/pdf" });
        localPreviewUrl = URL.createObjectURL(blob);
        if (cancelled) { URL.revokeObjectURL(localPreviewUrl); return; }
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = localPreviewUrl;
        setGeneratedBytes(safeBuffer);
        setPreviewUrl(localPreviewUrl);
        setStatusMessage(null);
      } catch (error: unknown) {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : "Erreur de génération.");
          setGeneratedBytes(null);
          if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
          setPreviewUrl(null);
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };
    void generate();
    return () => { cancelled = true; if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); };
  }, [montserratBoldBytes, montserratRegularBytes, montserratSemiBoldBytes, selectedMember, templatePdfBytes]);

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
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

  if (isEmbedded) {
    return (
      <div className="flex h-full flex-col bg-[#0F172A] text-[#F8FAFC] p-3">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="size-6 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <select
                className="flex-1 rounded-lg border border-[#1E293B] bg-[#1E293B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-blue-500"
                value={selectedMemberKey}
                onChange={(e) => setSelectedMemberKey(e.target.value)}
                disabled={members.length === 0}
              >
                {members.map((m) => (
                  <option key={m.key} value={m.key}>{m.memberType} - {m.fullName} ({m.badgeId})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!generatedBytes || isGenerating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? "Génération..." : "Télécharger PDF"}
              </button>
            </div>
            {statusMessage && (
              <p className="text-xs text-[#94A3B8]">{statusMessage}</p>
            )}
            <div className="flex-1 overflow-hidden rounded-lg border border-[#1E293B] bg-[#020617]" style={{ minHeight: 0 }}>
              {previewUrl ? (
                <iframe title="Badge preview" src={previewUrl} className="h-full w-full border-0" style={{ minHeight: "600px" }} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                  {isGenerating ? "Génération en cours..." : "Sélectionnez un membre pour prévisualiser le badge."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-[#F8FAFC]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1E293B] bg-[#0F172A] px-6 py-4">
        <div className="flex items-center gap-4">
          <a
            href="/admin"
            className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Retour au panel admin
          </a>
        </div>
        <h1 className="text-sm font-semibold text-[#F8FAFC]">Générateur de Badges — GRANPANPAN NATIONS CUP</h1>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-6">
            <p className="text-xs font-semibold tracking-widest text-[#94A3B8] uppercase">Générateur de Badges</p>
            <h2 className="mt-2 text-2xl font-bold text-[#F8FAFC]">Badge PDF — {BADGE_TEMPLATE_FILENAME}</h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Génère un badge PDF exact à partir du template officiel avec photo, nom, titre, ID et QR code.
            </p>

            {isLoading ? (
              <div className="mt-8 flex items-center justify-center py-16">
                <span className="size-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-4">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold tracking-widest text-[#94A3B8] uppercase">Sélection du membre</span>
                    <select
                      className="w-full rounded-lg border border-[#1E293B] bg-[#1E293B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-blue-500 cursor-pointer"
                      value={selectedMemberKey}
                      onChange={(e) => setSelectedMemberKey(e.target.value)}
                      disabled={members.length === 0}
                    >
                      {members.map((m) => (
                        <option key={m.key} value={m.key}>{m.memberType} - {m.fullName} ({m.badgeId})</option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-lg border border-[#1E293B] bg-[#1E293B]/40 p-4">
                    <p className="text-xs font-semibold tracking-widest text-[#94A3B8] uppercase">Membre sélectionné</p>
                    {selectedMember ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <p className="font-semibold text-[#F8FAFC]">{selectedMember.fullName}</p>
                        <p className="text-[#94A3B8]">{selectedMember.memberType} — {selectedMember.teamName}</p>
                        <p className="font-mono text-xs text-[#64748B]">{selectedMember.badgeId}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-[#64748B]">Sélectionnez un membre.</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!generatedBytes || isGenerating}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {isGenerating ? "Génération en cours..." : "Télécharger le badge PDF"}
                  </button>

                  {statusMessage && <p className="text-sm text-[#94A3B8]">{statusMessage}</p>}
                </div>

                <div className="lg:col-span-8">
                  <div className="h-[720px] overflow-hidden rounded-lg border border-[#1E293B] bg-[#020617]">
                    {previewUrl ? (
                      <iframe title="Badge preview" src={previewUrl} className="h-full w-full border-0" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                        {isGenerating ? "Génération en cours..." : "Sélectionnez un membre pour voir le badge."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
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
