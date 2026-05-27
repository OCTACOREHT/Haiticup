import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

const DEFAULT_OPERATIONS_EMAIL = "info@granpanpannationscup.com";
const DEFAULT_SENDER_EMAIL = "notifications@granpanpannationscup.com";
const DEFAULT_FROM_EMAIL = `Granpanpan Nations Cup <${DEFAULT_SENDER_EMAIL}>`;
const WELCOME_TEMPLATE_PATH = path.join(process.cwd(), "WElcome", "email.html");
const WELCOME_IMAGES_DIR = path.join(process.cwd(), "WElcome", "images");
const CLUB_WELCOME_SUBJECT = "Welcome to the Granpanpan Nations Cup!";

type InlineAttachment = {
  content: string;
  filename: string;
  contentId: string;
  contentType: "image/png" | "image/jpeg";
};

type WelcomeTemplateBundle = {
  html: string;
  attachments: InlineAttachment[];
};

let cachedWelcomeTemplateBundle: WelcomeTemplateBundle | null = null;

export type RegistrationEmailInput = {
  registrationId: string;
  teamName: string;
  managerName: string;
  phoneNumber: string;
  contactEmail: string;
  staffCount: number;
  playerCount: number;
};

export type RegistrationEmailResult = {
  enabled: boolean;
  attempted: number;
  sent: number;
  errors: string[];
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const parseRecipients = (value: string | undefined, fallback: string): string[] => {
  const source = isNonEmptyString(value) ? value : fallback;
  const parsed = source
    .split(",")
    .map((item) => item.trim())
    .filter((item) => isValidEmail(item));

  const deduped = new Set(parsed);
  if (isValidEmail(DEFAULT_OPERATIONS_EMAIL)) {
    deduped.add(DEFAULT_OPERATIONS_EMAIL);
  }

  return Array.from(deduped);
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const detectContentType = (filename: string): "image/png" | "image/jpeg" => {
  const extension = path.extname(filename).toLowerCase();
  return extension === ".png" ? "image/png" : "image/jpeg";
};

const injectRegistrationMessageAfterLogo = (html: string, teamName: string) => {
  const safeTeamName = isNonEmptyString(teamName) ? teamName.trim() : "your club";
  const target =
    '<td dir="ltr" style="font-size:16px;white-space:pre-wrap;text-align:left;padding:0px 24px 16px;line-height:1.4;mso-line-height-alt:22.4px;text-decoration:none">&nbsp;</td>';

  const message = `Team: ${escapeHtml(safeTeamName)}<br/>Welcome to the Granpanpan Nations Cup!<br/>The championship officially starts on July 12, 2026.<br/>Get ready for passion, competition, and unforgettable moments.`;

  const replacement = `<td dir="ltr" style="font-size:16px;white-space:pre-wrap;text-align:left;padding:0px 24px 16px;line-height:1.4;mso-line-height-alt:22.4px;text-decoration:none"><div style="text-align:center"><p style="margin:0;font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:24px;font-weight:700;line-height:1.3;color:#004ad3">Thank you</p><p style="margin:8px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:1.6;color:#0f172a">${message}</p></div></td>`;

  return html.replace(target, replacement);
};

const buildCidTemplate = async (html: string): Promise<WelcomeTemplateBundle> => {
  const filePattern = /images\/([A-Za-z0-9]+\.(?:png|jpg|jpeg))/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null = null;
  while (true) {
    match = filePattern.exec(html);
    if (!match) break;
    found.add(match[1]);
  }

  const filenames = Array.from(found);
  const cidByFilename = new Map<string, string>();
  filenames.forEach((filename, index) => {
    cidByFilename.set(filename, `welcome-image-${index + 1}`);
  });

  let cidHtml = html;
  cidByFilename.forEach((cid, filename) => {
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cidHtml = cidHtml.replace(
      new RegExp(`(src=["'])images/${escapedFilename}(["'])`, "g"),
      `$1cid:${cid}$2`,
    );
    cidHtml = cidHtml.replace(
      new RegExp(`(href=["'])images/${escapedFilename}(["'])`, "g"),
      `$1cid:${cid}$2`,
    );
  });

  // Preload links are not useful in emails and may create invalid fetches.
  cidHtml = cidHtml.replace(/<link[^>]+rel=["']preload["'][^>]*>/g, "");

  const attachments: InlineAttachment[] = [];
  for (const filename of filenames) {
    const contentId = cidByFilename.get(filename);
    if (!contentId) continue;
    const imagePath = path.join(WELCOME_IMAGES_DIR, filename);
    const imageBuffer = await readFile(imagePath);
    attachments.push({
      content: imageBuffer.toString("base64"),
      filename,
      contentId,
      contentType: detectContentType(filename),
    });
  }

  return { html: cidHtml, attachments };
};

const getWelcomeTemplateBundle = async () => {
  if (cachedWelcomeTemplateBundle) {
    return cachedWelcomeTemplateBundle;
  }

  const html = await readFile(WELCOME_TEMPLATE_PATH, "utf8");
  cachedWelcomeTemplateBundle = await buildCidTemplate(html);
  return cachedWelcomeTemplateBundle;
};

const cloneInlineAttachments = (attachments: InlineAttachment[]) =>
  attachments.map((attachment) => ({
    content: attachment.content,
    filename: attachment.filename,
    contentId: attachment.contentId,
    contentType: attachment.contentType,
  }));

const buildClubWelcomeText = (teamName: string) => {
  const safeTeamName = isNonEmptyString(teamName) ? teamName.trim() : "Your Club";
  return [
    `Team: ${safeTeamName}`,
    "Welcome to the Granpanpan Nations Cup!",
    "The championship officially starts on July 12, 2026.",
    "Get ready for passion, competition, and unforgettable moments.",
  ].join("\n");
};

const buildRegistrationOpsText = (input: RegistrationEmailInput) =>
  [
    "New Team Registration",
    `Registration ID: ${input.registrationId}`,
    `Team: ${input.teamName.trim()}`,
    `Manager: ${input.managerName.trim()}`,
    `Contact Email: ${input.contactEmail.trim()}`,
    `Phone: ${input.phoneNumber.trim()}`,
    `Staff Count: ${input.staffCount}`,
    `Player Count: ${input.playerCount}`,
  ].join("\n");

export async function sendRegistrationEmails(input: RegistrationEmailInput): Promise<RegistrationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!isNonEmptyString(apiKey)) {
    return { enabled: false, attempted: 0, sent: 0, errors: [] };
  }

  let welcomeBundle: WelcomeTemplateBundle;
  try {
    welcomeBundle = await getWelcomeTemplateBundle();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      enabled: true,
      attempted: 0,
      sent: 0,
      errors: [`Welcome template load failed: ${message}`],
    };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() || DEFAULT_OPERATIONS_EMAIL;
  const contactRecipient = isValidEmail(input.contactEmail) ? input.contactEmail.trim() : null;
  const operationsRecipients = parseRecipients(
    process.env.REGISTRATION_NOTIFICATION_EMAIL || process.env.RESEND_NOTIFICATION_EMAIL,
    DEFAULT_OPERATIONS_EMAIL,
  );

  const resend = new Resend(apiKey);
  const jobs: Array<Promise<{ error: { message?: string } | null }>> = [];

  if (contactRecipient) {
    jobs.push(
      resend.emails.send({
        from,
        replyTo,
        to: [contactRecipient],
        subject: CLUB_WELCOME_SUBJECT,
        html: injectRegistrationMessageAfterLogo(welcomeBundle.html, input.teamName),
        attachments: cloneInlineAttachments(welcomeBundle.attachments),
        text: buildClubWelcomeText(input.teamName),
      }),
    );
  }

  if (operationsRecipients.length > 0) {
    jobs.push(
      resend.emails.send({
        from,
        replyTo,
        to: operationsRecipients,
        subject: `New Team Registration - ${input.teamName.trim()}`,
        html: injectRegistrationMessageAfterLogo(welcomeBundle.html, input.teamName),
        attachments: cloneInlineAttachments(welcomeBundle.attachments),
        text: buildRegistrationOpsText(input),
      }),
    );
  }

  if (jobs.length === 0) {
    return { enabled: true, attempted: 0, sent: 0, errors: ["No valid recipients for automatic emails."] };
  }

  const settled = await Promise.allSettled(jobs);
  const errors: string[] = [];
  let sent = 0;

  settled.forEach((result) => {
    if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(reason);
      return;
    }

    const sendError = result.value.error;
    if (sendError) {
      errors.push(sendError.message || "Resend returned an unknown error.");
      return;
    }

    sent += 1;
  });

  return {
    enabled: true,
    attempted: jobs.length,
    sent,
    errors,
  };
}
