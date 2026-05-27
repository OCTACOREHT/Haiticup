import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

const DEFAULT_OPERATIONS_EMAIL = "info@granpanpannationscup.com";
const DEFAULT_SENDER_EMAIL = "notifications@granpanpannationscup.com";
const DEFAULT_FROM_EMAIL = `Granpanpan Nations Cup <${DEFAULT_SENDER_EMAIL}>`;
const WELCOME_TEMPLATE_PATH = path.join(process.cwd(), "WElcome", "email.html");
const WELCOME_IMAGES_DIR = path.join(process.cwd(), "WElcome", "images");

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

export type ContactMessageInput = {
  fullName: string;
  email: string;
  clubName: string | null;
  phoneNumber: string | null;
  subject: string;
  message: string;
};

export type ContactEmailResult = {
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

const injectThankYouMessageAfterLogo = (html: string) => {
  const target =
    '<td dir="ltr" style="font-size:16px;white-space:pre-wrap;text-align:left;padding:0px 24px 16px;line-height:1.4;mso-line-height-alt:22.4px;text-decoration:none">&nbsp;</td>';

  const replacement = `<td dir="ltr" style="font-size:16px;white-space:pre-wrap;text-align:left;padding:0px 24px 16px;line-height:1.4;mso-line-height-alt:22.4px;text-decoration:none"><div style="text-align:center"><p style="margin:0;font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:24px;font-weight:700;line-height:1.3;color:#004ad3">Thank you</p><p style="margin:8px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:1.6;color:#0f172a">Thank you for contacting Granpanpan Nations Cup. We received your message and our team will reply shortly.</p></div></td>`;

  return html.replace(target, replacement);
};

const detectContentType = (filename: string): "image/png" | "image/jpeg" => {
  const extension = path.extname(filename).toLowerCase();
  return extension === ".png" ? "image/png" : "image/jpeg";
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
  cidHtml = injectThankYouMessageAfterLogo(cidHtml);

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

const buildOpsText = (input: ContactMessageInput) => {
  const safeClub = isNonEmptyString(input.clubName) ? input.clubName.trim() : "N/A";
  const safePhone = isNonEmptyString(input.phoneNumber) ? input.phoneNumber.trim() : "N/A";
  return [
    "New Contact Request",
    `Name: ${input.fullName.trim()}`,
    `Email: ${input.email.trim()}`,
    `Club: ${safeClub}`,
    `Phone: ${safePhone}`,
    `Subject: ${input.subject.trim()}`,
    "",
    "Message:",
    input.message.trim(),
  ].join("\n");
};

const buildVisitorText = (input: ContactMessageInput) =>
  [
    "Granpanpan Nations Cup",
    "We received your message. Our operations team will contact you soon.",
    `Subject: ${input.subject.trim()}`,
    "",
    "Your message:",
    input.message.trim(),
  ].join("\n");

export async function sendContactEmails(input: ContactMessageInput): Promise<ContactEmailResult> {
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
  const recipients = parseRecipients(
    process.env.CONTACT_NOTIFICATION_EMAIL || process.env.RESEND_NOTIFICATION_EMAIL,
    DEFAULT_OPERATIONS_EMAIL,
  );

  const safeEmail = input.email.trim();

  const resend = new Resend(apiKey);
  const jobs: Array<Promise<{ error: { message?: string } | null }>> = [];

  if (recipients.length > 0) {
    jobs.push(
      resend.emails.send({
        from,
        replyTo,
        to: recipients,
        subject: `New Contact Request - ${input.subject.trim()}`,
        html: welcomeBundle.html,
        attachments: welcomeBundle.attachments,
        text: buildOpsText(input),
      }),
    );
  }

  if (isValidEmail(safeEmail)) {
    jobs.push(
      resend.emails.send({
        from,
        replyTo,
        to: [safeEmail],
        subject: "We received your message - Granpanpan Nations Cup",
        html: welcomeBundle.html,
        attachments: welcomeBundle.attachments,
        text: buildVisitorText(input),
      }),
    );
  }

  if (jobs.length === 0) {
    return { enabled: true, attempted: 0, sent: 0, errors: ["No valid recipients for contact emails."] };
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
