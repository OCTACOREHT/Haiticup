"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";
import { buildBadgeScanUrl } from "@/lib/badges/scan-url";
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
  qrPayload: Record<string, unknown> | null;
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

const normalizeQrDataUrl = async (sourceDataUrl: string, size = QR_IMAGE_SIZE_PX): Promise<string> => {
  const image = await loadImageElement(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);

  const imageData = context.getImageData(0, 0, size, size);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const binaryValue = luminance < 180 ? 0 : 255;
    data[i] = binaryValue;
    data[i + 1] = binaryValue;
    data[i + 2] = binaryValue;
    data[i + 3] = 255;
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
      errorCorrectionLevel: "M",
      margin: 2,
      width: QR_IMAGE_SIZE_PX,
      color: {
        dark: "#000000FF",
        light: "#FFFFFFFF",
      },
    });
    return normalizeQrDataUrl(generatedQr);
  } catch {
    return normalizeQrDataUrl(member.qrCodeDataUrl);
  }
};

const createCircularPhotoDataUrl = async (sourceDataUrl: string, size = 900): Promise<string> => {
  const image = await loadImageElement(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  context.clearRect(0, 0, size, size);
  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  let cropSize = Math.min(sourceWidth, sourceHeight);
  let cropX = (sourceWidth - cropSize) / 2;
  let cropY = (sourceHeight - cropSize) / 2;

  type FaceDetectorLike = {
    detect: (image: CanvasImageSource) => Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>>;
  };

  const maybeFaceDetector = (globalThis as { FaceDetector?: new (options?: Record<string, unknown>) => FaceDetectorLike })
    .FaceDetector;

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
    } catch {
      // Fallback to centered crop below.
    }
  }

  // Slight downward shift so forehead doesn't sit too close to the top edge.
  if (!maybeFaceDetector) {
    cropY = clamp(cropY + cropSize * 0.08, 0, sourceHeight - cropSize);
  }

  context.save();
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
  context.restore();

  return canvas.toDataURL("image/png");
};

const drawStrongBlackText = ({
  page,
  text,
  x,
  y,
  size,
  font,
  color = rgb(0, 0, 0),
}: {
  page: import("pdf-lib").PDFPage;
  text: string;
  x: number;
  y: number;
  size: number;
  font: import("pdf-lib").PDFFont;
  color?: ReturnType<typeof rgb>;
}) => {
  page.drawText(text, { x, y, size, font, color });
};

const fitTextSizeToWidth = ({
  font,
  text,
  startSize,
  minSize,
  maxWidth,
}: {
  font: import("pdf-lib").PDFFont;
  text: string;
  startSize: number;
  minSize: number;
  maxWidth: number;
}) => {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.4;
  }
  return Math.max(size, minSize);
};

const BadgesPageFallback = () => (
  <div className="flex min-h-screen flex-col bg-[#ffffff]">
    <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />
    <main className="flex-1 pt-24 pb-16">
      <section className="mx-auto w-full max-w-[1200px] px-4 md:px-10">
        <div className="rounded-xl border border-[#004AD3]/15 bg-white p-6 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Badge Generator</p>
          <h1 className="mt-2 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-4xl">
            Badge PDF Template
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
              requestedMemberKey
                ? `/badges?member=${requestedMemberKey}${isEmbedded ? "&embed=1" : ""}`
                : isEmbedded
                  ? "/badges?embed=1"
                  : "/badges",
            )}`,
          );
          return;
        }

        const [membersResponse, templateResult, montserratResult, montserratBoldResult, montserratSemiBoldResult] = await Promise.all([
          fetch("/api/members", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }),
          fetch(BADGE_TEMPLATE_URL),
          fetch("/Montserrat-Regular.ttf"),
          fetch("/Montserrat-Bold.ttf"),
          fetch("/Montserrat-SemiBold.ttf"),
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
              requestedMemberKey
                ? `/badges?member=${requestedMemberKey}${isEmbedded ? "&embed=1" : ""}`
                : isEmbedded
                  ? "/badges?embed=1"
                  : "/badges",
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
          router.replace(`/admin/login?next=${encodeURIComponent(isEmbedded ? "/badges?embed=1" : "/badges")}`);
          return;
        }

        if (!membersResponse.ok) {
          throw new Error(membersResult?.error || "Unable to fetch members for badges.");
        }
        if (!templateResult.ok) {
          throw new Error(`Template PDF (${BADGE_TEMPLATE_FILENAME}) could not be loaded.`);
        }
        if (!montserratResult.ok) {
          throw new Error("Montserrat-Regular.ttf could not be loaded.");
        }
        if (!montserratBoldResult.ok) {
          throw new Error("Montserrat-Bold.ttf could not be loaded.");
        }
        if (!montserratSemiBoldResult.ok) {
          throw new Error("Montserrat-SemiBold.ttf could not be loaded.");
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
            qrPayload: row.qrPayload,
          }));
        const templateBytes = await templateResult.arrayBuffer();
        const montserratBytes = await montserratResult.arrayBuffer();
        const montserratBold = await montserratBoldResult.arrayBuffer();
        const montserratSemiBold = await montserratSemiBoldResult.arrayBuffer();

        if (!isMounted) return;

        setMembers(combinedMembers);
        setTemplatePdfBytes(templateBytes);
        setMontserratRegularBytes(montserratBytes);
        setMontserratBoldBytes(montserratBold);
        setMontserratSemiBoldBytes(montserratSemiBold);
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
  }, [isEmbedded, requestedMemberKey, router]);

  useEffect(() => {
    if (!selectedMember || !templatePdfBytes || !montserratRegularBytes || !montserratBoldBytes || !montserratSemiBoldBytes) {
      return;
    }

    let cancelled = false;
    let localPreviewUrl: string | null = null;

    const generate = async () => {
      setIsGenerating(true);
      setStatusMessage("Generating badge from the exact badge PDF template...");

      try {
        const pdfDoc = await PDFDocument.load(templatePdfBytes);
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        const montserratBoldFont = await pdfDoc.embedFont(montserratBoldBytes, { subset: false });
        const montserratSemiBoldFont = await pdfDoc.embedFont(montserratSemiBoldBytes, { subset: false });
        const layout = defaultLayout;
        const badgeBlue = rgb(0.03, 0.07, 0.36);

        const photoDataUrl = await createCircularPhotoDataUrl(selectedMember.photoUrl);
        const printableQrDataUrl = await buildPrintableQrDataUrl(selectedMember);
        const photoBytes = dataUrlToUint8Array(photoDataUrl);
        const qrBytes = dataUrlToUint8Array(printableQrDataUrl);

        const photoImage = await pdfDoc.embedPng(photoBytes);
        const qrImage = printableQrDataUrl.startsWith("data:image/jpeg")
          ? await pdfDoc.embedJpg(qrBytes)
          : await pdfDoc.embedPng(qrBytes);

        const photoSize = width * layout.photoSize;
        const photoX = width * layout.photoX;
        const photoY = height - height * layout.photoYTop - photoSize;

        const qrSize = width * layout.qrSize;
        const qrX = width * layout.qrX;
        const qrY = height - height * layout.qrYTop - qrSize;

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

        const resolveBadgeLine = ({
          text,
          sizePercent,
          maxWidthPercent,
          font,
          minScale = 0.55,
        }: {
          text: string;
          sizePercent: number;
          maxWidthPercent: number;
          font: import("pdf-lib").PDFFont;
          minScale?: number;
        }) => {
          const startSize = width * sizePercent;
          const size = fitTextSizeToWidth({
            font,
            text,
            startSize,
            minSize: Math.max(7, startSize * minScale),
            maxWidth: width * maxWidthPercent,
          });
          return {
            size,
            lineHeight: font.heightAtSize(size),
            textWidth: font.widthOfTextAtSize(text, size),
          };
        };

        const drawCenteredResolvedLine = ({
          text,
          font,
          topPx,
          size,
          lineHeight,
          textWidth,
        }: {
          text: string;
          font: import("pdf-lib").PDFFont;
          topPx: number;
          size: number;
          lineHeight: number;
          textWidth: number;
        }) => {
          const y = height - topPx - lineHeight;
          const x = width * 0.5 - textWidth / 2;
          drawStrongBlackText({
            page,
            text,
            x,
            y,
            size,
            font,
            color: badgeBlue,
          });
          return { bottomTopPx: topPx + lineHeight };
        };

        const typeText = selectedMember.memberType.toUpperCase();
        const nameText = selectedMember.fullName;
        const roleText = selectedMember.subtitle || selectedMember.title;
        const idText = `ID N : ${selectedMember.badgeId}`;

        const typeLine = resolveBadgeLine({
          text: typeText,
          sizePercent: 0.038,
          maxWidthPercent: 0.5,
          font: montserratBoldFont,
          minScale: 0.7,
        });
        const nameLine = resolveBadgeLine({
          text: nameText,
          sizePercent: layout.nameSize,
          maxWidthPercent: 0.78,
          font: montserratBoldFont,
          minScale: 0.42,
        });
        const roleLine = resolveBadgeLine({
          text: roleText,
          sizePercent: layout.titleSize,
          maxWidthPercent: 0.78,
          font: montserratSemiBoldFont,
          minScale: 0.5,
        });
        const idLine = resolveBadgeLine({
          text: idText,
          sizePercent: layout.idSize,
          maxWidthPercent: 0.88,
          font: montserratSemiBoldFont,
          minScale: 0.42,
        });

        // Enforce equal interline between name, role, and ID for consistent rhythm.
        const interlinePx = width * 0.0045;
        const typeToNameGapPx = width * 0.006;
        const nameTopPx = height * layout.nameYTop;
        const typeTopPx = nameTopPx - typeLine.lineHeight - typeToNameGapPx;
        drawCenteredResolvedLine({
          text: typeText,
          font: montserratBoldFont,
          topPx: typeTopPx,
          size: typeLine.size,
          lineHeight: typeLine.lineHeight,
          textWidth: typeLine.textWidth,
        });
        const nameDraw = drawCenteredResolvedLine({
          text: nameText,
          font: montserratBoldFont,
          topPx: nameTopPx,
          size: nameLine.size,
          lineHeight: nameLine.lineHeight,
          textWidth: nameLine.textWidth,
        });
        const roleTopPx = nameDraw.bottomTopPx + interlinePx;
        const roleDraw = drawCenteredResolvedLine({
          text: roleText,
          font: montserratSemiBoldFont,
          topPx: roleTopPx,
          size: roleLine.size,
          lineHeight: roleLine.lineHeight,
          textWidth: roleLine.textWidth,
        });
        const idTopPx = roleDraw.bottomTopPx + interlinePx;
        drawCenteredResolvedLine({
          text: idText,
          font: montserratSemiBoldFont,
          topPx: idTopPx,
          size: idLine.size,
          lineHeight: idLine.lineHeight,
          textWidth: idLine.textWidth,
        });

        const scanText = "SCAN ME";
        const scanSize = fitTextSizeToWidth({
          font: montserratBoldFont,
          text: scanText,
          startSize: width * 0.052,
          minSize: width * 0.04,
          maxWidth: qrSize + width * 0.12,
        });
        const scanX = qrX + qrSize / 2 - montserratBoldFont.widthOfTextAtSize(scanText, scanSize) / 2;
        const scanY = qrY - width * 0.055;
        drawStrongBlackText({
          page,
          text: scanText,
          x: scanX,
          y: scanY,
          size: scanSize,
          font: montserratBoldFont,
          color: badgeBlue,
        });

        const validText = "VALID UNTIL: 12/2026";
        const validSize = width * 0.03;
        const validX = qrX + qrSize / 2 - montserratSemiBoldFont.widthOfTextAtSize(validText, validSize) / 2;
        const validY = scanY - width * 0.055;
        drawStrongBlackText({
          page,
          text: validText,
          x: validX,
          y: validY,
          size: validSize,
          font: montserratSemiBoldFont,
          color: badgeBlue,
        });

        const secondPage = pdfDoc.getPages()[1];
        if (secondPage) {
          const websiteText = "www.granpanpannationscup.com";
          const { width: page2Width, height: page2Height } = secondPage.getSize();
          const websiteSize = fitTextSizeToWidth({
            font: montserratBoldFont,
            text: websiteText,
            startSize: page2Width * 0.028,
            minSize: page2Width * 0.02,
            maxWidth: page2Width * 0.82,
          });
          const websiteWidth = montserratBoldFont.widthOfTextAtSize(websiteText, websiteSize);
          const websiteLineHeight = montserratBoldFont.heightAtSize(websiteSize);
          const websiteX = page2Width / 2 - websiteWidth / 2;
          const websiteTopPx = page2Height * 0.66;
          const websiteY = page2Height - websiteTopPx - websiteLineHeight;

          drawStrongBlackText({
            page: secondPage,
            text: websiteText,
            x: websiteX,
            y: websiteY,
            size: websiteSize,
            font: montserratBoldFont,
            color: badgeBlue,
          });
        }

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
  }, [montserratBoldBytes, montserratRegularBytes, montserratSemiBoldBytes, selectedMember, templatePdfBytes]);

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
      {!isEmbedded ? <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" /> : null}

      <main className={isEmbedded ? "flex-1 p-3" : "flex-1 pt-24 pb-16"}>
        <section className={isEmbedded ? "mx-auto w-full" : "mx-auto w-full max-w-[1200px] px-4 md:px-10"}>
          <div className="rounded-xl border border-[#004AD3]/15 bg-white p-6 shadow-[0_12px_28px_rgba(0,74,211,0.08)] md:p-8">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/65 uppercase">Badge Generator</p>
            <h1 className="mt-2 text-2xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-4xl">
              Badge PDF Template
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#004AD3]/78 md:text-base">
              This page uses the exact original file <strong>{BADGE_TEMPLATE_FILENAME}</strong> and only injects real photo, name,
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
                  <p className="text-xs font-bold tracking-[0.08em] text-[#004AD3]/70 uppercase">Selected Member</p>
                  {selectedMember ? (
                    <div className="mt-3 space-y-2 text-sm text-[#004AD3]/85">
                      <p className="font-semibold">{selectedMember.fullName}</p>
                      <p>
                        {selectedMember.memberType} - {selectedMember.teamName}
                      </p>
                      <p className="font-mono text-xs">{selectedMember.badgeId}</p>
                      <p className="text-[11px] text-[#004AD3]/70">
                        Font used in PDF: <strong>Montserrat Bold</strong> (black).
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-[#004AD3]/70">Select a member to preview.</p>
                  )}
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

      {!isEmbedded ? <SiteFooter variant="register" /> : null}
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
