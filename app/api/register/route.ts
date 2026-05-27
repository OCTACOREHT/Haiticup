import { createClient } from "@supabase/supabase-js";
import { sendRegistrationEmails } from "@/lib/email/registration-emails";

export const runtime = "nodejs";

type StaffMemberInput = {
  badge_id: string;
  full_name: string;
  role: string;
  phone_number: string;
  email: string;
  photo_url: string;
  photo_size_bytes: number;
  qr_payload: Record<string, unknown>;
  qr_code_data_url: string;
};

type PlayerInput = {
  badge_id: string;
  full_name: string;
  position: string;
  jersey_number: string;
  age: number;
  photo_url: string;
  photo_size_bytes: number;
  qr_payload: Record<string, unknown>;
  qr_code_data_url: string;
};

type RegisterRequestBody = {
  team_name: string;
  manager_name: string;
  phone_number: string;
  contact_email: string;
  club_address: string;
  website: string | null;
  club_logo_url: string;
  photo_authorization: boolean;
  staff_members: StaffMemberInput[];
  players: PlayerInput[];
};

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RegisterRequestBody;

    if (
      !isNonEmptyString(payload.team_name) ||
      !isNonEmptyString(payload.manager_name) ||
      !isNonEmptyString(payload.phone_number) ||
      !isNonEmptyString(payload.contact_email) ||
      !isNonEmptyString(payload.club_address) ||
      !isNonEmptyString(payload.club_logo_url) ||
      !Array.isArray(payload.staff_members) ||
      !Array.isArray(payload.players)
    ) {
      return Response.json({ error: "Invalid registration payload." }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: registrationData, error: registrationError } = await supabase
      .from("registere")
      .insert({
        team_name: payload.team_name.trim(),
        manager_name: payload.manager_name.trim(),
        phone_number: payload.phone_number.trim(),
        contact_email: payload.contact_email.trim(),
        club_address: payload.club_address.trim(),
        website: payload.website?.trim() || null,
        club_logo_url: payload.club_logo_url,
        photo_authorization: Boolean(payload.photo_authorization),
      })
      .select("id")
      .single();

    if (registrationError || !registrationData?.id) {
      return Response.json(
        { error: registrationError?.message || "Unable to create registration row." },
        { status: 400 },
      );
    }

    const registrationId = registrationData.id as string;

    const staffRows = payload.staff_members.map((staff) => ({
      registere_id: registrationId,
      badge_id: staff.badge_id,
      full_name: staff.full_name,
      role: staff.role,
      phone_number: staff.phone_number,
      email: staff.email,
      photo_url: staff.photo_url,
      photo_size_bytes: staff.photo_size_bytes,
      qr_payload: staff.qr_payload,
      qr_code_data_url: staff.qr_code_data_url,
    }));

    const playerRows = payload.players.map((player) => ({
      registere_id: registrationId,
      badge_id: player.badge_id,
      full_name: player.full_name,
      position: player.position,
      jersey_number: player.jersey_number,
      age: player.age,
      photo_url: player.photo_url,
      photo_size_bytes: player.photo_size_bytes,
      qr_payload: player.qr_payload,
      qr_code_data_url: player.qr_code_data_url,
    }));

    if (staffRows.length > 0) {
      const { error: staffInsertError } = await supabase.from("registere_staff").insert(staffRows);
      if (staffInsertError) {
        await supabase.from("registere").delete().eq("id", registrationId);
        return Response.json({ error: staffInsertError.message }, { status: 400 });
      }
    }

    if (playerRows.length > 0) {
      const { error: playersInsertError } = await supabase.from("registere_players").insert(playerRows);
      if (playersInsertError) {
        await supabase.from("registere_staff").delete().eq("registere_id", registrationId);
        await supabase.from("registere").delete().eq("id", registrationId);
        return Response.json({ error: playersInsertError.message }, { status: 400 });
      }
    }

    const mailResult = await sendRegistrationEmails({
      registrationId,
      teamName: payload.team_name.trim(),
      managerName: payload.manager_name.trim(),
      phoneNumber: payload.phone_number.trim(),
      contactEmail: payload.contact_email.trim(),
      staffCount: staffRows.length,
      playerCount: playerRows.length,
    });

    if (mailResult.errors.length > 0) {
      console.error("Registration email send issues:", mailResult.errors);
    }

    return Response.json({ registration_id: registrationId }, { status: 200 });
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
