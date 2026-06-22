export const runtime = "nodejs";

const STORAGE_PATH_PREFIX = "/storage/v1/object/public/registrations/";

const getAllowedOrigin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return new URL(supabaseUrl).origin;
};

export async function GET(request: Request) {
  try {
    const rawUrl = new URL(request.url).searchParams.get("url");
    if (!rawUrl) {
      return Response.json({ error: "Missing url parameter." }, { status: 400 });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(rawUrl);
    } catch {
      return Response.json({ error: "Invalid image URL." }, { status: 400 });
    }

    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      return Response.json({ error: "Unsupported image URL protocol." }, { status: 400 });
    }

    const allowedOrigin = getAllowedOrigin();
    if (targetUrl.origin !== allowedOrigin || !targetUrl.pathname.startsWith(STORAGE_PATH_PREFIX)) {
      return Response.json({ error: "Image source is not allowed." }, { status: 403 });
    }

    const upstream = await fetch(targetUrl.toString(), { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "Unable to fetch image." }, { status: 502 });
    }

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
