import assert from "node:assert/strict";
import { test } from "node:test";

import { CANVAS_IMAGE_PROXY_ROUTE, toCanvasSafeImageSrc } from "../lib/badges/canvas-image";

test("toCanvasSafeImageSrc leaves same-origin and data URLs untouched", () => {
  assert.equal(
    toCanvasSafeImageSrc("data:image/png;base64,abc", "https://example.com"),
    "data:image/png;base64,abc",
  );

  assert.equal(
    toCanvasSafeImageSrc("/images/photo.jpg", "https://example.com"),
    "/images/photo.jpg",
  );
});

test("toCanvasSafeImageSrc proxies external storage URLs", () => {
  const external = "https://project.supabase.co/storage/v1/object/public/registrations/team/photo.jpg";
  const proxied = toCanvasSafeImageSrc(external, "https://haiticup.example");

  assert.equal(
    proxied,
    `${CANVAS_IMAGE_PROXY_ROUTE}?url=${encodeURIComponent(external)}`,
  );
});
