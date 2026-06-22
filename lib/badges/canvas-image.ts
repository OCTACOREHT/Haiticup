export const CANVAS_IMAGE_PROXY_ROUTE = "/api/image-proxy";

export const toCanvasSafeImageSrc = (src: string, appOrigin: string) => {
  const value = src.trim();
  if (!value) {
    return value;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith(CANVAS_IMAGE_PROXY_ROUTE)
  ) {
    return value;
  }

  try {
    const resolved = new URL(value, appOrigin);
    if (resolved.origin === appOrigin) {
      return value;
    }

    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return `${CANVAS_IMAGE_PROXY_ROUTE}?url=${encodeURIComponent(resolved.toString())}`;
    }
  } catch {
    return value;
  }

  return value;
};
