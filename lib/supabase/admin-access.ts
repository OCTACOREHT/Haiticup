import { getServiceSupabaseClient } from "@/lib/supabase/server";

type AdminUserRow = {
  user_id: string;
  is_active: boolean | null;
  full_name: string | null;
};

export type AdminAccessResult =
  | {
      ok: true;
      userId: string;
      email: string;
      fullName: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

export const verifyAdminAccess = async (token: string | null): Promise<AdminAccessResult> => {
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing Authorization bearer token.",
    };
  }

  const supabase = getServiceSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired session.",
    };
  }

  const authUser = authData.user;
  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, is_active, full_name")
    .eq("user_id", authUser.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) {
    return {
      ok: false,
      status: 403,
      error: `Admin check failed: ${adminError.message}`,
    };
  }

  if (!adminRow) {
    return {
      ok: false,
      status: 403,
      error: "Access denied: this account is not allowed in admin area.",
    };
  }

  const typedAdminRow = adminRow as AdminUserRow;

  return {
    ok: true,
    userId: authUser.id,
    email: authUser.email ?? "",
    fullName: typedAdminRow.full_name?.trim() || authUser.email || "Admin",
  };
};
