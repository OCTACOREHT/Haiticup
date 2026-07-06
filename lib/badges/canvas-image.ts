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

export const generateSilhouetteDataUrl = (size = 900): string => {
  if (typeof window === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Elegant linear gradient background (Slate)
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#F8FAFC");
  grad.addColorStop(1, "#E2E8F0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Soft slate gray color for the silhouette shapes
  ctx.fillStyle = "#94A3B8";

  // Head
  ctx.beginPath();
  const headRadius = size * 0.20;
  const headCenterX = size / 2;
  const headCenterY = size * 0.32;
  ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Torso / Shoulders
  ctx.beginPath();
  const shouldersY = size * 0.55;
  ctx.moveTo(size * 0.15, size);
  ctx.quadraticCurveTo(size * 0.2, shouldersY, size * 0.32, shouldersY);
  ctx.lineTo(size * 0.68, shouldersY);
  ctx.quadraticCurveTo(size * 0.8, shouldersY, size * 0.85, size);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.beginPath();
  ctx.moveTo(size * 0.42, size * 0.45);
  ctx.lineTo(size * 0.58, size * 0.45);
  ctx.lineTo(size * 0.55, size * 0.56);
  ctx.lineTo(size * 0.45, size * 0.56);
  ctx.closePath();
  ctx.fill();

  // Collar detail (V-neck look)
  ctx.beginPath();
  ctx.moveTo(size * 0.46, size * 0.55);
  ctx.lineTo(size * 0.5, size * 0.60);
  ctx.lineTo(size * 0.54, size * 0.55);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = size * 0.015;
  ctx.stroke();

  return canvas.toDataURL("image/png");
};
