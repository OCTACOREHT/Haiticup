export type DuplicateNormalizedValue = {
  value: string;
  firstIndex: number;
  duplicateIndex: number;
};

export const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const findDuplicateNormalizedValue = (
  values: readonly unknown[],
): DuplicateNormalizedValue | null => {
  const seen = new Map<string, number>();

  for (let index = 0; index < values.length; index += 1) {
    const normalized = normalizeEmail(values[index]);
    if (!normalized) {
      continue;
    }

    const firstIndex = seen.get(normalized);
    if (firstIndex !== undefined) {
      return {
        value: normalized,
        firstIndex,
        duplicateIndex: index,
      };
    }

    seen.set(normalized, index);
  }

  return null;
};
