export type BadgeMemberType = "STAFF" | "PLAYER";
export const TOURNAMENT_YEAR = "2026";

export const toUpperAlphaNumeric = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const buildTeamCode = (rawTeamName: string, registrationId: string) => {
  const normalizedTeam = toUpperAlphaNumeric(rawTeamName).slice(0, 6).padEnd(6, "X");
  const registrationChunk = toUpperAlphaNumeric(registrationId).slice(-4).padStart(4, "0");
  return `${normalizedTeam}${registrationChunk}`;
};

export const buildBadgeId = (memberType: BadgeMemberType, teamCode: string, serial: number) => {
  const prefix = memberType === "STAFF" ? "STF" : "PLY";
  return `${prefix}-${TOURNAMENT_YEAR}-${teamCode}-${String(serial).padStart(2, "0")}`;
};
