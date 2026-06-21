import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const STORAGE_BUCKET = "registrations";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const getServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

const ensureBucketExists = async (supabase: ReturnType<typeof getServiceClient>) => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.name === STORAGE_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const storagePath = formData.get("path") as string | null;

    if (!file || !storagePath || storagePath.trim().length === 0) {
      return Response.json({ error: "Missing file or path." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return Response.json({ error: "File too large. Maximum 5 MB." }, { status: 413 });
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(mime) && !mime.startsWith("image/")) {
      return Response.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    const supabase = getServiceClient();
    await ensureBucketExists(supabase);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath.trim(), buffer, { contentType: mime, upsert: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    return Response.json({ url: publicData.publicUrl }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
