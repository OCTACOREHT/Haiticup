const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Add badgeSearch state
const searchStateAnchor = `  const [playerSearch, setPlayerSearch] = useState("");`;
const searchStateNew = `  const [playerSearch, setPlayerSearch] = useState("");
  const [badgeSearch, setBadgeSearch] = useState("");`;
if (content.includes(searchStateAnchor) && !content.includes(`const [badgeSearch`)) {
  content = content.replace(searchStateAnchor, searchStateNew);
  console.log('1. Added badgeSearch state');
}

// 2. Refactor handleDirectBadgeDownload and add handleDownloadTeamBadges and fillBadgeDocument
const oldBadgeDownloadLogic = `  // ? Direct badge download ?

  const handleDirectBadgeDownload = async (memberKey: string) => {
    const member = badgeMembers.find((m) => m.key === memberKey);
    if (!member) return;
    setDownloadingBadgeKey(memberKey);
    try {
      const { template, bold, semiBold } = await loadBadgeResources();
      const pdfDoc = await PDFDocument.load(template);
      pdfDoc.registerFontkit(fontkit);
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      const boldFont = await pdfDoc.embedFont(bold, { subset: false });
      const semiBoldFont = await pdfDoc.embedFont(semiBold, { subset: false });
      const L = defaultBadgeLayout;
      const badgeBlue = rgb(0.03, 0.07, 0.36);

      const photoData = await circularPhoto(member.photoUrl);
      const qrData = await buildQrDataUrl(member);
      const photoImg = await pdfDoc.embedPng(dataUrlToUint8Array(photoData));
      const qrImg = qrData.startsWith("data:image/jpeg") ? await pdfDoc.embedJpg(dataUrlToUint8Array(qrData)) : await pdfDoc.embedPng(dataUrlToUint8Array(qrData));

      const ps = width * L.photoSize, px = width * L.photoX, py = height - height * L.photoYTop - ps;
      const qs = width * L.qrSize, qx = width * L.qrX, qy = height - height * L.qrYTop - qs;
      page.drawImage(photoImg, { x: px, y: py, width: ps, height: ps });
      page.drawImage(qrImg, { x: qx, y: qy, width: qs, height: qs });

      const resolve = (text: string, sp: number, mwp: number, font: import("pdf-lib").PDFFont, ms = 0.55) => {
        const s = fitText(font, text, width * sp, Math.max(7, width * sp * ms), width * mwp);
        return { s, lh: font.heightAtSize(s), tw: font.widthOfTextAtSize(text, s) };
      };
      const drawCentered = (text: string, font: import("pdf-lib").PDFFont, topPx: number, s: number, lh: number, tw: number) => {
        page.drawText(text, { x: width * 0.5 - tw / 2, y: height - topPx - lh, size: s, font, color: badgeBlue });
        return topPx + lh;
      };

      const typeText = member.memberType.toUpperCase();
      const nameText = member.fullName;
      const roleText = member.subtitle || member.title;
      const idText = \`ID N : \${member.badgeId}\`;
      const inter = width * 0.0045, gap = width * 0.006;
      const nameTop = height * L.nameYTop;
      const typeInfo = resolve(typeText, 0.038, 0.5, boldFont, 0.7);
      drawCentered(typeText, boldFont, nameTop - typeInfo.lh - gap, typeInfo.s, typeInfo.lh, typeInfo.tw);
      const nameInfo = resolve(nameText, L.nameSize, 0.78, boldFont, 0.42);
      const afterName = drawCentered(nameText, boldFont, nameTop, nameInfo.s, nameInfo.lh, nameInfo.tw);
      const roleInfo = resolve(roleText, L.titleSize, 0.78, semiBoldFont, 0.5);
      const afterRole = drawCentered(roleText, semiBoldFont, afterName + inter, roleInfo.s, roleInfo.lh, roleInfo.tw);
      const idInfo = resolve(idText, L.idSize, 0.88, semiBoldFont, 0.42);
      drawCentered(idText, semiBoldFont, afterRole + inter, idInfo.s, idInfo.lh, idInfo.tw);

      const scanText = "SCAN ME";
      const scanS = fitText(boldFont, scanText, width * 0.052, width * 0.04, qs + width * 0.12);
      page.drawText(scanText, { x: qx + qs / 2 - boldFont.widthOfTextAtSize(scanText, scanS) / 2, y: qy - width * 0.055, size: scanS, font: boldFont, color: badgeBlue });
      const validText = "VALID UNTIL: 12/2026";
      const validS = width * 0.03;
      page.drawText(validText, { x: qx + qs / 2 - semiBoldFont.widthOfTextAtSize(validText, validS) / 2, y: qy - width * 0.11, size: validS, font: semiBoldFont, color: badgeBlue });

      const p2 = pdfDoc.getPages()[1];
      if (p2) {
        const { width: w2, height: h2 } = p2.getSize();
        const wt = "www.granpanpannationscup.com";
        const ws = fitText(boldFont, wt, w2 * 0.028, w2 * 0.02, w2 * 0.82);
        p2.drawText(wt, { x: w2 / 2 - boldFont.widthOfTextAtSize(wt, ws) / 2, y: h2 - h2 * 0.66 - boldFont.heightAtSize(ws), size: ws, font: boldFont, color: badgeBlue });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = \`\${member.badgeId}.pdf\`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Erreur de génération du badge.");
      setStatusTone("error");
    } finally {
      setDownloadingBadgeKey(null);
    }
  };`;

const newBadgeDownloadLogic = `  // ? Badge PDF filling helper ?

  const fillBadgeDocument = async (member: AdminBadgeMember, template: ArrayBuffer, bold: ArrayBuffer, semiBold: ArrayBuffer) => {
    const pdfDoc = await PDFDocument.load(template);
    pdfDoc.registerFontkit(fontkit);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const boldFont = await pdfDoc.embedFont(bold, { subset: false });
    const semiBoldFont = await pdfDoc.embedFont(semiBold, { subset: false });
    const L = defaultBadgeLayout;
    const badgeBlue = rgb(0.03, 0.07, 0.36);

    const photoData = await circularPhoto(member.photoUrl);
    const qrData = await buildQrDataUrl(member);
    const photoImg = await pdfDoc.embedPng(dataUrlToUint8Array(photoData));
    const qrImg = qrData.startsWith("data:image/jpeg") ? await pdfDoc.embedJpg(dataUrlToUint8Array(qrData)) : await pdfDoc.embedPng(dataUrlToUint8Array(qrData));

    const ps = width * L.photoSize, px = width * L.photoX, py = height - height * L.photoYTop - ps;
    const qs = width * L.qrSize, qx = width * L.qrX, qy = height - height * L.qrYTop - qs;
    page.drawImage(photoImg, { x: px, y: py, width: ps, height: ps });
    page.drawImage(qrImg, { x: qx, y: qy, width: qs, height: qs });

    const resolve = (text: string, sp: number, mwp: number, font: import("pdf-lib").PDFFont, ms = 0.55) => {
      const s = fitText(font, text, width * sp, Math.max(7, width * sp * ms), width * mwp);
      return { s, lh: font.heightAtSize(s), tw: font.widthOfTextAtSize(text, s) };
    };
    const drawCentered = (text: string, font: import("pdf-lib").PDFFont, topPx: number, s: number, lh: number, tw: number) => {
      page.drawText(text, { x: width * 0.5 - tw / 2, y: height - topPx - lh, size: s, font, color: badgeBlue });
      return topPx + lh;
    };

    const typeText = member.memberType.toUpperCase();
    const nameText = member.fullName;
    const roleText = member.subtitle || member.title;
    const idText = \`ID N : \${member.badgeId}\`;
    const inter = width * 0.0045, gap = width * 0.006;
    const nameTop = height * L.nameYTop;
    const typeInfo = resolve(typeText, 0.038, 0.5, boldFont, 0.7);
    drawCentered(typeText, boldFont, nameTop - typeInfo.lh - gap, typeInfo.s, typeInfo.lh, typeInfo.tw);
    const nameInfo = resolve(nameText, L.nameSize, 0.78, boldFont, 0.42);
    const afterName = drawCentered(nameText, boldFont, nameTop, nameInfo.s, nameInfo.lh, nameInfo.tw);
    const roleInfo = resolve(roleText, L.titleSize, 0.78, semiBoldFont, 0.5);
    const afterRole = drawCentered(roleText, semiBoldFont, afterName + inter, roleInfo.s, roleInfo.lh, roleInfo.tw);
    const idInfo = resolve(idText, L.idSize, 0.88, semiBoldFont, 0.42);
    drawCentered(idText, semiBoldFont, afterRole + inter, idInfo.s, idInfo.lh, idInfo.tw);

    const scanText = "SCAN ME";
    const scanS = fitText(boldFont, scanText, width * 0.052, width * 0.04, qs + width * 0.12);
    page.drawText(scanText, { x: qx + qs / 2 - boldFont.widthOfTextAtSize(scanText, scanS) / 2, y: qy - width * 0.055, size: scanS, font: boldFont, color: badgeBlue });
    const validText = "VALID UNTIL: 12/2026";
    const validS = width * 0.03;
    page.drawText(validText, { x: qx + qs / 2 - semiBoldFont.widthOfTextAtSize(validText, validS) / 2, y: qy - width * 0.11, size: validS, font: semiBoldFont, color: badgeBlue });

    const p2 = pdfDoc.getPages()[1];
    if (p2) {
      const { width: w2, height: h2 } = p2.getSize();
      const wt = "www.granpanpannationscup.com";
      const ws = fitText(boldFont, wt, w2 * 0.028, w2 * 0.02, w2 * 0.82);
      p2.drawText(wt, { x: w2 / 2 - boldFont.widthOfTextAtSize(wt, ws) / 2, y: h2 - h2 * 0.66 - boldFont.heightAtSize(ws), size: ws, font: boldFont, color: badgeBlue });
    }
    
    return pdfDoc;
  };

  // ? Direct badge download ?

  const handleDirectBadgeDownload = async (memberKey: string) => {
    const member = badgeMembers.find((m) => m.key === memberKey);
    if (!member) return;
    setDownloadingBadgeKey(memberKey);
    try {
      const { template, bold, semiBold } = await loadBadgeResources();
      const pdfDoc = await fillBadgeDocument(member, template, bold, semiBold);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = \`\${member.badgeId}.pdf\`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Erreur de génération du badge.");
      setStatusTone("error");
    } finally {
      setDownloadingBadgeKey(null);
    }
  };

  const handleDownloadTeamBadges = async (teamId: string, teamName: string) => {
    const teamMembers = badgeMembers.filter(m => m.registereId === teamId);
    if (teamMembers.length === 0) {
      setStatusMessage("Aucun badge disponible pour cette équipe.");
      setStatusTone("info");
      return;
    }
    setDownloadingBadgeKey(\`team-\${teamId}\`);
    try {
      const { template, bold, semiBold } = await loadBadgeResources();
      const finalPdf = await PDFDocument.create();

      for (const member of teamMembers) {
        const doc = await fillBadgeDocument(member, template, bold, semiBold);
        const pageCount = doc.getPages().length;
        const indices = Array.from({ length: pageCount }, (_, i) => i);
        const copiedPages = await finalPdf.copyPages(doc, indices);
        copiedPages.forEach(p => finalPdf.addPage(p));
      }

      const bytes = await finalPdf.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = \`Badges_\${teamName.replace(/\\s+/g, "_")}.pdf\`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Erreur de génération des badges de l'équipe.");
      setStatusTone("error");
    } finally {
      setDownloadingBadgeKey(null);
    }
  };`;

if (content.includes(oldBadgeDownloadLogic)) {
  content = content.replace(oldBadgeDownloadLogic, newBadgeDownloadLogic);
  console.log('2. Refactored badge generation and added team download logic');
} else {
  console.log('2. WARNING: Could not find old badge download logic block.');
}

// 3. Add search bar to Badges tab
const oldBadgesHeader = `              <div className="border-b border-gray-200 px-5 py-4">
                <div>
                  <p className="font-semibold text-gray-900">Badges membres</p>
                  <p className="mt-0.5 text-xs text-gray-500">Visualisez le badge dans une fenêtre ou téléchargez-le directement en PDF.</p>
                </div>
              </div>`;
const newBadgesHeader = `              <div className="border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Badges membres</p>
                  <p className="mt-0.5 text-xs text-gray-500">Visualisez le badge dans une fenêtre ou téléchargez-le directement en PDF.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher (nom, ID, équipe)..."
                    value={badgeSearch}
                    onChange={(e) => setBadgeSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>`;

if (content.includes(oldBadgesHeader)) {
  content = content.replace(oldBadgesHeader, newBadgesHeader);
  console.log('3. Added search input to badges tab');
} else {
  console.log('3. WARNING: Could not find old badges header.');
}

// 4. Update the badges iteration to use filtered list
const oldBadgesLoop = `                  <tbody className="divide-y divide-gray-100">
                    {badgeMembers.map((member) => {
                      const isDl = downloadingBadgeKey === member.key;
                      return (
                        <tr key={member.key} className="hover:bg-gray-50">`;
const newBadgesLoop = `                  <tbody className="divide-y divide-gray-100">
                    {(() => {
                      const lowerSearch = badgeSearch.toLowerCase().trim();
                      const filtered = badgeMembers.filter(m => 
                        !lowerSearch || 
                        m.fullName.toLowerCase().includes(lowerSearch) || 
                        m.teamName.toLowerCase().includes(lowerSearch) || 
                        m.badgeId.toLowerCase().includes(lowerSearch)
                      );
                      
                      return (
                        <>
                          {filtered.map((member) => {
                            const isDl = downloadingBadgeKey === member.key;
                            return (
                              <tr key={member.key} className="hover:bg-gray-50">`;

const oldBadgesLoopEnd = `                        </tr>
                      );
                    })}
                    {badgeMembers.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Aucun membre avec badge.</td></tr>}
                  </tbody>`;
const newBadgesLoopEnd = `                              </tr>
                            );
                          })}
                          {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Aucun membre ne correspond à votre recherche.</td></tr>}
                        </>
                      );
                    })()}
                  </tbody>`;

if (content.includes(oldBadgesLoop) && content.includes(oldBadgesLoopEnd)) {
  content = content.replace(oldBadgesLoop, newBadgesLoop);
  content = content.replace(oldBadgesLoopEnd, newBadgesLoopEnd);
  console.log('4. Updated badges tab to render filtered members');
} else {
  console.log('4. WARNING: Could not find old badges iteration blocks.');
}

// 5. Add team download button in Teams tab
const oldTeamDetailsHeader = `                          {isExp && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                              <div className="grid gap-6 xl:grid-cols-2">`;
const newTeamDetailsHeader = `                          {isExp && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                              <div className="mb-4 flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">Membres de l'équipe</h4>
                                <button
                                  type="button"
                                  onClick={() => void handleDownloadTeamBadges(team.id, team.teamName)}
                                  disabled={downloadingBadgeKey === \`team-\${team.id}\`}
                                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  {downloadingBadgeKey === \`team-\${team.id}\` ? <Spinner /> : <DownloadIcon className="size-3.5" />}
                                  Télécharger tous les badges (PDF)
                                </button>
                              </div>
                              <div className="grid gap-6 xl:grid-cols-2">`;

if (content.includes(oldTeamDetailsHeader)) {
  content = content.replace(oldTeamDetailsHeader, newTeamDetailsHeader);
  console.log('5. Added download team badges button to Teams tab');
} else {
  console.log('5. WARNING: Could not find team details header block.');
}

// Convert line endings back to CRLF before writing
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Script execution completed.');
