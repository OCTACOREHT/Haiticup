export type DuplicateNormalizedValue = {
  value: string;
  firstIndex: number;
  duplicateIndex: number;
};

type ValueNormalizer = (value: unknown) => string;

export const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const normalizeTrimmedValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const findDuplicateNormalizedValue = (
  values: readonly unknown[],
  normalize: ValueNormalizer = normalizeEmail,
): DuplicateNormalizedValue | null => {
  const seen = new Map<string, number>();

  for (let index = 0; index < values.length; index += 1) {
    const normalized = normalize(values[index]);
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
