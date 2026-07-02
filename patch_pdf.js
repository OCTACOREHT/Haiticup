const fs = require('fs');

const file = 'app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = `const rows: RosterRow[] = [];`;
const endMarker = `const pages = pdfDoc.getPages();`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newLogic = `
      const pdfDoc = await PDFDocument.create();
      const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const logoBytes = await fetch("/Granpanpan%20Nation%20cupfull.png").then(async (res) => {
        if (!res.ok) throw new Error("Logo introuvable pour le PDF.");
        return res.arrayBuffer();
      });
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const pageWidth = 842;
      const pageHeight = 595;
      const marginX = 28;
      const marginTop = 22;
      const marginBottom = 24;
      const headerGap = 16;
      const tableHeaderHeight = 20;
      const rowHeight = 18;
      const textSize = 9;
      const tableTopColor = rgb(0.91, 0.94, 0.99);
      const tableBorderColor = rgb(0.80, 0.84, 0.90);
      const headerTextColor = rgb(0.11, 0.26, 0.58);
      const lineTextColor = rgb(0.10, 0.13, 0.20);
      const altRowColor = rgb(0.98, 0.99, 1);

      const columns: Array<{ label: string; width: number; align?: "left" | "center" | "right" }> = [
        { label: "#", width: 28, align: "right" },
        { label: "TEAM", width: 150 },
        { label: "TYPE", width: 52, align: "center" },
        { label: "NAME", width: 190 },
        { label: "POSITION / ROLE", width: 130 },
        { label: "JERSEY", width: 52, align: "center" },
        { label: "BADGE ID", width: 140 },
      ];

      const shorten = (input: string, maxWidth: number) => {
        if (normalFont.widthOfTextAtSize(input, textSize) <= maxWidth) return input;
        const ellipsis = "...";
        const ellipsisWidth = normalFont.widthOfTextAtSize(ellipsis, textSize);
        let out = input;
        while (out.length > 0 && normalFont.widthOfTextAtSize(out, textSize) + ellipsisWidth > maxWidth) out = out.slice(0, -1);
        return out.length > 0 ? \`\${out}\${ellipsis}\` : ellipsis;
      };

      const buildFileSlug = (value: string) => {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return slug || "team";
      };

      const drawTableHeader = (page: import("pdf-lib").PDFPage, yTop: number) => {
        let x = marginX;
        for (const col of columns) {
          page.drawRectangle({
            x,
            y: yTop - tableHeaderHeight,
            width: col.width,
            height: tableHeaderHeight,
            color: tableTopColor,
            borderColor: tableBorderColor,
            borderWidth: 0.8,
          });
          const textWidth = boldFont.widthOfTextAtSize(col.label, 8);
          const tx =
            col.align === "right"
              ? x + col.width - 4 - textWidth
              : col.align === "center"
                ? x + (col.width - textWidth) / 2
                : x + 4;
          page.drawText(col.label, { x: tx, y: yTop - tableHeaderHeight + 6, size: 8, font: boldFont, color: headerTextColor });
          x += col.width;
        }
      };

      const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      for (const team of selectedTeams) {
        const teamPlayers = players.filter((p) => p.registereId === team.id).sort((a, b) => a.fullName.localeCompare(b.fullName));
        const teamStaff = staff.filter((s) => s.registereId === team.id).sort((a, b) => a.fullName.localeCompare(b.fullName));

        const teamRows: RosterRow[] = [];
        
        teamPlayers.forEach((player) => {
          teamRows.push({
            teamName: safe(team.teamName),
            memberType: "PLAYER",
            fullName: safe(player.fullName),
            roleLabel: safe(player.position),
            jerseyLabel: safe(player.jerseyNumber),
            badgeId: safe(player.badgeId),
          });
        });

        teamStaff.forEach((member) => {
          teamRows.push({
            teamName: safe(team.teamName),
            memberType: "STAFF",
            fullName: safe(member.fullName),
            roleLabel: safe(member.role),
            jerseyLabel: "-",
            badgeId: safe(member.badgeId),
          });
        });

        let teamLogoImage = null;
        if (team.logoUrl) {
          try {
            const res = await fetch(team.logoUrl);
            if (res.ok) {
              const bytes = await res.arrayBuffer();
              try {
                teamLogoImage = await pdfDoc.embedPng(bytes);
              } catch {
                try {
                  teamLogoImage = await pdfDoc.embedJpg(bytes);
                } catch {
                  console.warn("Could not embed team logo for", team.teamName);
                }
              }
            }
          } catch (e) {
            console.warn("Could not fetch team logo for", team.teamName);
          }
        }

        const subtitle = \`Official Team Roster - \${team.teamName}\`;
        const metaLine = \`Generated: \${reportDate} | Players: \${teamPlayers.length} | Staff: \${teamStaff.length}\`;

        const drawHeader = (page: import("pdf-lib").PDFPage) => {
          const logoTargetHeight = 42;
          const logoScale = logoTargetHeight / logoImage.height;
          const logoWidth = logoImage.width * logoScale;
          const topY = pageHeight - marginTop;
          const logoY = topY - logoTargetHeight;
          page.drawImage(logoImage, { x: marginX, y: logoY, width: logoWidth, height: logoTargetHeight });

          if (teamLogoImage) {
            const tLogoScale = logoTargetHeight / teamLogoImage.height;
            const tLogoWidth = teamLogoImage.width * tLogoScale;
            page.drawImage(teamLogoImage, { x: pageWidth - marginX - tLogoWidth, y: logoY, width: tLogoWidth, height: logoTargetHeight });
          }

          const titleX = marginX + logoWidth + 12;
          page.drawText(subtitle, { x: titleX, y: topY - 22, size: 10.5, font: boldFont, color: lineTextColor });
          page.drawText(metaLine, { x: titleX, y: topY - 36, size: 9, font: normalFont, color: rgb(0.35, 0.40, 0.48) });

          return logoY - headerGap;
        };

        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let yTop = drawHeader(page);
        drawTableHeader(page, yTop);
        let yCursor = yTop - tableHeaderHeight;

        if (teamRows.length === 0) {
          page.drawText("No players or staff available for this team.", {
            x: marginX + 4,
            y: yCursor - 16,
            size: 10,
            font: normalFont,
            color: rgb(0.43, 0.47, 0.55),
          });
        } else {
          for (let i = 0; i < teamRows.length; i++) {
            if (yCursor - rowHeight < marginBottom) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yTop = drawHeader(page);
              drawTableHeader(page, yTop);
              yCursor = yTop - tableHeaderHeight;
            }

            const row = teamRows[i];
            const rowBottom = yCursor - rowHeight;
            let x = marginX;
            const values = [
              String(i + 1),
              row.teamName,
              row.memberType,
              row.fullName,
              row.roleLabel,
              row.jerseyLabel,
              row.badgeId,
            ];

            for (let c = 0; c < columns.length; c++) {
              const col = columns[c];
              page.drawRectangle({
                x,
                y: rowBottom,
                width: col.width,
                height: rowHeight,
                color: i % 2 === 0 ? rgb(1, 1, 1) : altRowColor,
                borderColor: tableBorderColor,
                borderWidth: 0.45,
              });

              const raw = values[c] ?? "-";
              const maxTextWidth = col.width - 8;
              const text = shorten(raw, maxTextWidth);
              const textWidth = normalFont.widthOfTextAtSize(text, textSize);
              const tx =
                col.align === "right"
                  ? x + col.width - 4 - textWidth
                  : col.align === "center"
                    ? x + (col.width - textWidth) / 2
                    : x + 4;

              page.drawText(text, {
                x: tx,
                y: rowBottom + (rowHeight - textSize) / 2 + 1,
                size: textSize,
                font: normalFont,
                color: lineTextColor,
              });

              x += col.width;
            }
            yCursor -= rowHeight;
          }
        }
      }

      const drawFooter = (page: import("pdf-lib").PDFPage, pageNum: number, totalPages: number) => {
        const label = \`Page \${pageNum}/\${totalPages}\`;
        const textWidth = normalFont.widthOfTextAtSize(label, 8);
        page.drawText(label, {
          x: pageWidth - marginX - textWidth,
          y: 10,
          size: 8,
          font: normalFont,
          color: rgb(0.45, 0.50, 0.58),
        });
      };

      `;

content = content.slice(0, startIndex) + newLogic + content.slice(endIndex);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully patched the PDF generation logic");
