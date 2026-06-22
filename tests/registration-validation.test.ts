import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findDuplicateNormalizedValue,
  normalizeEmail,
} from "../lib/registration-validation";

test("normalizeEmail trims whitespace and lowercases addresses", () => {
  assert.equal(normalizeEmail("  Coach@Club.com "), "coach@club.com");
});

test("findDuplicateNormalizedValue detects duplicate staff emails after normalization", () => {
  const duplicate = findDuplicateNormalizedValue([
    "first@club.com",
    "  Coach@Club.com ",
    "coach@club.com",
  ]);

  assert.deepEqual(duplicate, {
    value: "coach@club.com",
    firstIndex: 1,
    duplicateIndex: 2,
  });
});

test("findDuplicateNormalizedValue returns null for unique addresses", () => {
  assert.equal(
    findDuplicateNormalizedValue(["staff1@club.com", "staff2@club.com", "staff3@club.com"]),
    null,
  );
});
