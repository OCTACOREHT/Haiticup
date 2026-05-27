import { sendContactEmails } from "@/lib/email/contact-emails";

export const runtime = "nodejs";

type ContactRequestBody = {
  full_name: string;
  email: string;
  club_name?: string | null;
  phone_number?: string | null;
  subject: string;
  message: string;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactRequestBody;

    if (
      !isNonEmptyString(payload.full_name) ||
      !isNonEmptyString(payload.email) ||
      !isNonEmptyString(payload.subject) ||
      !isNonEmptyString(payload.message)
    ) {
      return Response.json({ error: "Invalid contact payload." }, { status: 400 });
    }

    if (!isValidEmail(payload.email)) {
      return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const mailResult = await sendContactEmails({
      fullName: payload.full_name.trim(),
      email: payload.email.trim(),
      clubName: isNonEmptyString(payload.club_name) ? payload.club_name.trim() : null,
      phoneNumber: isNonEmptyString(payload.phone_number) ? payload.phone_number.trim() : null,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
    });

    if (!mailResult.enabled) {
      return Response.json({ error: "Email service is not configured yet." }, { status: 503 });
    }

    if (mailResult.errors.length > 0) {
      console.error("Contact email send issues:", mailResult.errors);
    }

    if (mailResult.attempted > 0 && mailResult.sent === 0) {
      return Response.json(
        { error: "We could not deliver your message right now. Please try again in a moment." },
        { status: 502 },
      );
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Unexpected server error.";

    return Response.json({ error: message }, { status: 500 });
  }
}
