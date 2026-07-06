export type BadgeMemberSource = {
  badgeId: string | null;
  photoUrl: string | null;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const canRenderBadgeMember = (member: BadgeMemberSource) =>
  isNonEmptyString(member.badgeId);
