type SessionApiResponse = {
  error?: string;
};

export const establishAdminServerSession = async (accessToken: string) => {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as SessionApiResponse | null;
    throw new Error(payload?.error || "Unable to establish admin session.");
  }
};

export const clearAdminServerSession = async () => {
  await fetch("/api/admin/session", {
    method: "DELETE",
    cache: "no-store",
  }).catch(() => null);
};

