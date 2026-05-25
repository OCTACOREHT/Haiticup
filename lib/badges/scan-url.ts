const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

export const getBadgeScanBaseUrl = (originFallback?: string) => {
  const configured = process.env.NEXT_PUBLIC_BADGE_SCAN_BASE_URL?.trim();
  if (configured) {
    return trimTrailingSlashes(configured);
  }

  const fallback = originFallback?.trim();
  if (fallback) {
    return trimTrailingSlashes(fallback);
  }

  return "http://localhost:3000";
};

export const buildBadgeScanUrl = ({
  badgeId,
  originFallback,
}: {
  badgeId: string;
  originFallback?: string;
}) => {
  const baseUrl = getBadgeScanBaseUrl(originFallback);
  const safeBadgeId = encodeURIComponent(badgeId.trim());
  return `${baseUrl}/scan/${safeBadgeId}`;
};
