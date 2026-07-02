const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "5 MB";
const UPLOAD_TARGET_BYTES = 3.5 * 1024 * 1024;

export const readImageAsDataUrl = (
  file: File,
  onSuccess: (dataUrl: string) => void,
  onError: () => void,
) => {
  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result === "string") {
      onSuccess(reader.result);
      return;
    }
    onError();
  };

  reader.onerror = () => onError();
  reader.readAsDataURL(file);
};

export const validateImageUpload = (file: File, label: string) => {
  if (!file.type.startsWith("image/")) {
    return `${label}: please upload a valid image file.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${label}: image must be ${MAX_IMAGE_SIZE_LABEL} or less.`;
  }

  return null;
};

export const compressImageFile = (file: File, maxBytes: number = UPLOAD_TARGET_BYTES): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1600;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable."));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas compression failed."));
              return;
            }
            if (blob.size <= maxBytes || quality <= 0.3) {
              resolve(blob);
            } else {
              tryQuality(Math.max(quality - 0.1, 0.3));
            }
          },
          "image/jpeg",
          quality,
        );
      };

      tryQuality(0.92);
    };

    img.onerror = () => reject(new Error("Failed to load image for compression."));
    img.src = objectUrl;
  });

export const uploadToStorage = async (blob: Blob | File, path: string): Promise<string> => {
  const form = new FormData();
  form.append("file", blob, path);
  form.append("path", path);
  const res = await fetch("/api/upload-photo", { method: "POST", body: form });
  const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok) throw new Error(json?.error || "Photo upload failed.");
  if (!json?.url) throw new Error("No URL returned from photo upload.");
  return json.url;
};
