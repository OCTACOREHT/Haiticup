"use client";

import { useEffect, useRef, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Crown, Download, RefreshCw, FileText, Info } from "lucide-react";

// The 8 team logos in public/Logo ekip/
const SPONSOR_LOGOS = [
  "1804 FC.png",
  "Elite Energy.png",
  "FC des Vétéran.png",
  "FC pac.png",
  "Fc Top Notch.png",
  "Galaxy Fc.png",
  "Island united FC.png",
  "Klass.png",
];

const BADGE_TEMPLATE_URL = "/Badge%20.pdf";
const MONTSERRAT_BOLD_URL = "/Montserrat-Bold.ttf";
const MONTSERRAT_SEMIBOLD_URL = "/Montserrat-SemiBold.ttf";

export default function VipBadges() {
  const [badgeText, setBadgeText] = useState("VIP PASS");
  const [subtitleText, setSubtitleText] = useState("");
  const [namesText, setNamesText] = useState("");
  const [useNamesList, setUseNamesList] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrlRef = useRef<string | null>(null);
  const generatedBytesRef = useRef<ArrayBuffer | null>(null);

  // Cached assets to avoid fetching on every keypress
  const cachedAssetsRef = useRef<{
    template: ArrayBuffer;
    montserratBold: ArrayBuffer;
    montserratSemiBold: ArrayBuffer;
    sponsors: Array<{ name: string; buffer: ArrayBuffer }>;
  } | null>(null);

  // Load all assets once
  const loadAssets = async () => {
    if (cachedAssetsRef.current) return cachedAssetsRef.current;

    setStatusMessage("Téléchargement des ressources (Polices, Logos)...");
    try {
      const [templateRes, boldRes, semiBoldRes] = await Promise.all([
        fetch(BADGE_TEMPLATE_URL),
        fetch(MONTSERRAT_BOLD_URL),
        fetch(MONTSERRAT_SEMIBOLD_URL),
      ]);

      if (!templateRes.ok) throw new Error("Template PDF introuvable.");
      if (!boldRes.ok || !semiBoldRes.ok) throw new Error("Polices introuvables.");

      const [template, montserratBold, montserratSemiBold] = await Promise.all([
        templateRes.arrayBuffer(),
        boldRes.arrayBuffer(),
        semiBoldRes.arrayBuffer(),
      ]);

      // Load sponsor logos
      const sponsors: Array<{ name: string; buffer: ArrayBuffer }> = [];
      for (const logoName of SPONSOR_LOGOS) {
        const url = `/Logo ekip/${encodeURIComponent(logoName)}`;
        const res = await fetch(url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          sponsors.push({ name: logoName, buffer });
        } else {
          console.warn(`Impossible de charger le logo sponsor: ${logoName}`);
        }
      }

      cachedAssetsRef.current = {
        template,
        montserratBold,
        montserratSemiBold,
        sponsors,
      };

      return cachedAssetsRef.current;
    } catch (err) {
      console.error("Asset loading error:", err);
      throw new Error(err instanceof Error ? err.message : "Erreur de chargement des ressources.");
    }
  };

  const generatePdf = async (silent = false) => {
    if (!silent) {
      setIsGenerating(true);
      setError(null);
      setStatusMessage("Génération du badge PDF...");
    }

    try {
      const assets = await loadAssets();
      
      // Initialize target PDF
      const finalPdfDoc = await PDFDocument.create();
      finalPdfDoc.registerFontkit(fontkit);

      const boldFont = await finalPdfDoc.embedFont(assets.montserratBold);
      const semiBoldFont = await finalPdfDoc.embedFont(assets.montserratSemiBold);
      const badgeBlue = rgb(0.03, 0.07, 0.36); // Official deep blue
      const goldColor = rgb(0.72, 0.53, 0.04); // #B8860B Dark Gold / Premium Gold

      // Embed sponsors in the target document
      const sponsorImgs = await Promise.all(
        assets.sponsors.map(async (s) => ({
          name: s.name,
          img: await finalPdfDoc.embedPng(s.buffer),
        }))
      );

      // Determine pages to create
      const itemsToGenerate: Array<{ title: string; subtitle: string; name?: string }> = [];

      if (useNamesList) {
        const names = namesText
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);

        if (names.length > 0) {
          names.forEach((name) => {
            itemsToGenerate.push({
              title: badgeText.trim() || "VIP PASS",
              subtitle: subtitleText.trim(),
              name: name,
            });
          });
        } else {
          itemsToGenerate.push({
            title: badgeText.trim() || "VIP PASS",
            subtitle: subtitleText.trim(),
          });
        }
      } else {
        const count = Math.max(1, quantity);
        for (let i = 0; i < count; i++) {
          itemsToGenerate.push({
            title: badgeText.trim() || "VIP PASS",
            subtitle: subtitleText.trim(),
          });
        }
      }

      // Load background document to copy pages from
      const backgroundPdfDoc = await PDFDocument.load(assets.template);

      for (const item of itemsToGenerate) {
        // Copy the first page (front) and second page (back) of the template
        const copiedPages = await finalPdfDoc.copyPages(backgroundPdfDoc, [0, 1]);
        const page = finalPdfDoc.addPage(copiedPages[0]);
        const { width, height } = page.getSize();

        // Determine text dimensions and positions (no main logo, centered)
        const hasName = !!item.name;
        const hasSubtitle = !!item.subtitle;

        // Centered "VIP PASS"
        const titleVal = item.title.toUpperCase();
        const titleSize = width * 0.11; // Large premium size
        const titleWidth = boldFont.widthOfTextAtSize(titleVal, titleSize);
        const titleX = (width - titleWidth) / 2;
        
        // If there are other elements, push title slightly up; otherwise center it
        const titleY = hasName || hasSubtitle ? height * 0.54 : height * 0.48;

        page.drawText(titleVal, {
          x: titleX,
          y: titleY,
          size: titleSize,
          font: boldFont,
          color: goldColor,
        });

        // Draw Subtitle / Guest Name if any
        if (item.name) {
          // Subtitle goes above name, under VIP PASS
          const subVal = item.subtitle.toUpperCase();
          if (subVal) {
            const subSize = width * 0.032;
            const subWidth = semiBoldFont.widthOfTextAtSize(subVal, subSize);
            const subX = (width - subWidth) / 2;
            const subY = titleY - 26;

            page.drawText(subVal, {
              x: subX,
              y: subY,
              size: subSize,
              font: semiBoldFont,
              color: badgeBlue,
            });
          }

          const nameVal = item.name.toUpperCase();
          const nameSize = width * 0.055;
          const nameWidth = boldFont.widthOfTextAtSize(nameVal, nameSize);
          // Scale down if name is too long
          let finalNameSize = nameSize;
          let finalNameWidth = nameWidth;
          const maxNameW = width * 0.85;
          if (nameWidth > maxNameW) {
            finalNameSize = (maxNameW / nameWidth) * nameSize;
            finalNameWidth = boldFont.widthOfTextAtSize(nameVal, finalNameSize);
          }
          const nameX = (width - finalNameWidth) / 2;
          const nameY = titleY - (subVal ? 58 : 38);

          page.drawText(nameVal, {
            x: nameX,
            y: nameY,
            size: finalNameSize,
            font: boldFont,
            color: badgeBlue,
          });
        } else if (item.subtitle) {
          // Standard layout with just subtitle
          const subVal = item.subtitle.toUpperCase();
          const subSize = width * 0.048;
          const subWidth = semiBoldFont.widthOfTextAtSize(subVal, subSize);
          // Scale if needed
          let finalSubSize = subSize;
          let finalSubWidth = subWidth;
          const maxSubW = width * 0.85;
          if (subWidth > maxSubW) {
            finalSubSize = (maxSubW / subWidth) * subSize;
            finalSubWidth = semiBoldFont.widthOfTextAtSize(subVal, finalSubSize);
          }
          const subX = (width - finalSubWidth) / 2;
          const subY = titleY - 34;

          page.drawText(subVal, {
            x: subX,
            y: subY,
            size: finalSubSize,
            font: semiBoldFont,
            color: badgeBlue,
          });
        }

        // 4. Draw the 8 sponsor/team logos side-by-side at the bottom
        if (sponsorImgs.length > 0) {
          const padding = width * 0.05; // 5% margin
          const availW = width - padding * 2;
          
          // We lay them out in a neat single row
          const boxH = width * 0.08; // Max height for logos
          const boxW = availW / sponsorImgs.length;
          const logoYBottom = height * 0.20; // Moved up even higher as requested

          sponsorImgs.forEach((sp, i) => {
            const aspect = sp.img.width / sp.img.height;
            const maxDrawW = boxW - 4; // leave 4px gap
            const maxDrawH = boxH;

            let drawW = maxDrawW;
            let drawH = drawW / aspect;

            if (drawH > maxDrawH) {
              drawH = maxDrawH;
              drawW = drawH * aspect;
            }

            // Center inside its slot
            const slotX = padding + i * boxW;
            const logoX = slotX + (boxW - drawW) / 2;
            const logoY = logoYBottom + (boxH - drawH) / 2;

            page.drawImage(sp.img, {
              x: logoX,
              y: logoY,
              width: drawW,
              height: drawH,
            });
          });
        }

        // Add the second page (back) of the badge if available in the template
        if (copiedPages[1]) {
          const backPage = finalPdfDoc.addPage(copiedPages[1]);
          const { width: p2W, height: p2H } = backPage.getSize();
          const websiteText = "www.granpanpannationscup.com";
          const websiteSize = p2W * 0.028;
          const websiteWidth = boldFont.widthOfTextAtSize(websiteText, websiteSize);
          const websiteX = (p2W - websiteWidth) / 2;
          const websiteY = p2H - p2H * 0.66 - boldFont.heightAtSize(websiteSize);
          
          backPage.drawText(websiteText, {
            x: websiteX,
            y: websiteY,
            size: websiteSize,
            font: boldFont,
            color: badgeBlue,
          });
        }
      }

      const bytes = await finalPdfDoc.save();
      const byteCopy = new Uint8Array(bytes.length);
      byteCopy.set(bytes);
      const safeBuffer = byteCopy.buffer;
      const blob = new Blob([safeBuffer], { type: "application/pdf" });
      const localUrl = URL.createObjectURL(blob);

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = localUrl;
      generatedBytesRef.current = safeBuffer;

      setPreviewUrl(localUrl);
      setStatusMessage(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur de génération.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate on first mount and whenever visual configurations change
  useEffect(() => {
    void generatePdf();
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [badgeText, subtitleText, namesText, useNamesList, quantity]);

  const handleDownload = () => {
    if (!generatedBytesRef.current) return;
    const blob = new Blob([generatedBytesRef.current], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `badges_vip_${useNamesList ? "liste" : "standard"}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400">
            <Crown className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Badges VIP</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Générateur de badges VIP personnalisés avec logo officiel et logos d'équipes en bas.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left panel: Controls */}
          <div className="space-y-5 lg:col-span-5">
            {/* Custom texts */}
            <div className="space-y-4 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Personnalisation du badge
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Titre Principal (en or)
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="VIP PASS"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Sous-titre / Catégorie
                </label>
                <input
                  type="text"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="INVITÉ D'HONNEUR"
                />
              </div>
            </div>

            {/* Mode selection */}
            <div className="space-y-4 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Mode d'impression
              </h3>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useNamesList}
                    onChange={() => setUseNamesList(false)}
                    className="size-4 accent-blue-600"
                  />
                  <span>Badges Vierges (Standard)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={useNamesList}
                    onChange={() => setUseNamesList(true)}
                    className="size-4 accent-blue-600"
                  />
                  <span>Liste d'invités (Par nom)</span>
                </label>
              </div>

              {/* Mode blank badge quantity */}
              {!useNamesList && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Nombre de badges à imprimer
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex h-9 w-24 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Génère un PDF avec ce nombre de pages identiques.
                  </p>
                </div>
              )}

              {/* Mode list of names */}
              {useNamesList && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Noms des invités (un par ligne)
                  </label>
                  <textarea
                    rows={5}
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    className="flex w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Ex:&#10;Jean Dupont&#10;Marie Durant&#10;Pierre Martin"
                  />
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Génère une page par invité avec son nom sous "VIP PASS".
                  </p>
                </div>
              )}
            </div>

            {/* Status / Errors */}
            {statusMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                <RefreshCw className="size-3 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Download and update controls */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => void generatePdf()}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <RefreshCw className={`size-4 ${isGenerating ? "animate-spin" : ""}`} />
                <span>Régénérer</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || !previewUrl}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors shadow-sm"
              >
                <Download className="size-4" />
                <span>Télécharger PDF</span>
              </button>
            </div>

            {/* Printable spec notice */}
            <div className="flex gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-700 px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              <Info className="size-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Spécifications pour l'impression :</p>
                <p className="mt-1">Ce PDF utilise le format de badge officiel du tournoi. Lors de l'impression, sélectionnez :</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono">
                  <li>Taille réelle (100%)</li>
                  <li>Orientation : Portrait</li>
                  <li>Impression Recto</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right panel: Live Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Prévisualisation en direct
            </h3>
            <div className="flex-1 min-h-[500px] lg:min-h-[600px] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
              {previewUrl ? (
                <iframe
                  title="Badge VIP Preview"
                  src={previewUrl}
                  className="w-full h-full border-0 absolute inset-0"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {isGenerating ? (
                    <>
                      <RefreshCw className="size-8 animate-spin text-blue-500" />
                      <span>Génération de la prévisualisation...</span>
                    </>
                  ) : (
                    <span>Aucun badge généré. Cliquez sur Régénérer.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
