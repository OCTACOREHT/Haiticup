import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/registration-validation";

export const runtime = "nodejs";

type RegisterMediaRequestBody = {
  full_name: string;
  email: string;
  media_name: string;
  photo_url: string;
  photo_size_bytes: number;
  badge_id: string;
  qr_payload: Record<string, unknown>;
  qr_code_data_url: string;
};

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RegisterMediaRequestBody;

    if (
      !isNonEmptyString(payload.full_name) ||
      !isNonEmptyString(payload.email) ||
      !isNonEmptyString(payload.media_name) ||
      !isNonEmptyString(payload.photo_url) ||
      !isNonEmptyString(payload.badge_id)
    ) {
      return Response.json({ error: "Invalid registration payload." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const normalizedEmail = normalizeEmail(payload.email);

    const { data: insertedData, error: insertError } = await supabase
      .from("registere_media")
      .insert({
        full_name: payload.full_name.trim(),
        email: normalizedEmail,
        media_name: payload.media_name.trim(),
        photo_url: payload.photo_url,
        photo_size_bytes: payload.photo_size_bytes,
        badge_id: payload.badge_id,
        qr_payload: payload.qr_payload,
        qr_code_data_url: payload.qr_code_data_url,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505" && insertError.message.includes("email")) {
        return Response.json({ error: "This email is already registered." }, { status: 409 });
      }
      return Response.json({ error: insertError.message }, { status: 400 });
    }

    return Response.json({ id: insertedData.id }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
