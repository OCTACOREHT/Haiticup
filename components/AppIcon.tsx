import { cn } from "@/lib/utils";

type AppIconName =
  | "account_tree"
  | "assistant"
  | "calendar_month"
  | "calendar_today"
  | "call"
  | "chevron_right"
  | "close"
  | "confirmation_number"
  | "delete"
  | "emoji_events"
  | "gavel"
  | "groups"
  | "location_on"
  | "menu"
  | "military_tech"
  | "pending_actions"
  | "person_add"
  | "sports"
  | "sports_soccer"
  | "star"
  | "verified";

type AppIconProps = {
  name: AppIconName | string;
  className?: string;
};

export default function AppIcon({ name, className }: AppIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "material-symbols-outlined inline-block shrink-0 leading-none select-none align-middle",
        className
      )}
    >
      {name}
    </span>
  );
}
