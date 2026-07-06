import assert from "node:assert/strict";
import { test } from "node:test";

import { canRenderBadgeMember } from "../lib/badges/admin-badge-members";

test("canRenderBadgeMember allows badges without stored QR data", () => {
  assert.equal(
    canRenderBadgeMember({
      badgeId: "STF-2026-GRNPAN0001",
      photoUrl: "https://example.com/photo.jpg",
    }),
    true,
  );
});

test("canRenderBadgeMember rejects rows without a badge id", () => {
  assert.equal(
    canRenderBadgeMember({
      badgeId: null,
      photoUrl: "https://example.com/photo.jpg",
    }),
    false,
  );
});

test("canRenderBadgeMember allows rows with a badge id but without photo", () => {
  assert.equal(
    canRenderBadgeMember({
      badgeId: "STF-2026-GRNPAN0001",
      photoUrl: null,
    }),
    true,
  );
});
