import { Package, CalendarCheck, SunHorizon, UsersThree, Star, Ticket as TicketIcon, GraduationCap, PaperPlaneTilt, VideoCamera, ChartLineUp, Briefcase, Stamp as StampIcon, HeartHalf, ChatsCircle, Leaf, Plant, Flower, Tree, Sun, Snowflake, Trophy, type Icon } from "@phosphor-icons/react";
import { cn } from "./cn";

/**
 * The quiet panel a card carries when there is no photograph for it yet: one
 * light-weight icon on a neutral field. Real imagery replaces it through ArtSlot.
 */
const ICON: Record<string, Icon> = {
  "mission-starter": Package, "mission-routine": CalendarCheck, "mission-monthly": SunHorizon, "mission-team": UsersThree, "mission-review": Star, "mission-event": TicketIcon, "mission-academy": GraduationCap, "mission-referral": PaperPlaneTilt,
  "track-craft": VideoCamera, "track-growth": ChartLineUp, "track-business": Briefcase, "track-licensing": StampIcon, "track-wellbeing": HeartHalf, "track-mentorship": ChatsCircle,
  "level-member": Leaf, "level-insider": Plant, "level-pro": Flower, "level-ambassador": Tree,
  "season-summer-hair-rescue": Sun, "season-golden-hour": SunHorizon, "season-winter-glow": Snowflake, "season-finale": Trophy,
};
const WORD: Record<string, string> = {
  "mission-starter": "Starter", "mission-routine": "Routine", "mission-monthly": "Monthly", "mission-team": "Team", "mission-review": "Review", "mission-event": "Event", "mission-academy": "Academy", "mission-referral": "Referral",
};

export function Graphic({ id, className, compact, tone = "paper" }: { id: string; className?: string; compact?: boolean; tone?: "paper" | "forest" | "marigold" }) {
  const I = ICON[id] ?? Leaf;
  const word = WORD[id];
  const bg = tone === "forest" ? "inverse-fill" : tone === "marigold" ? "accent-fill" : "bg-surface-2 text-ink-2";
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", bg, className)}>
      <I weight="light" className={cn(compact ? "h-[46%] w-[46%]" : "h-[38%] w-[38%]")} />
      {word && !compact && <span className="meta absolute bottom-3 start-4 !text-current opacity-60">{word}</span>}
    </div>
  );
}
