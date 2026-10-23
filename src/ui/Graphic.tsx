import { Package, CalendarCheck, SunHorizon, UsersThree, Star, Ticket as TicketIcon, GraduationCap, PaperPlaneTilt, VideoCamera, ChartLineUp, Briefcase, Stamp as StampIcon, HeartHalf, ChatsCircle, Leaf, Plant, Flower, Tree, Sun, Snowflake, Trophy, type Icon } from "@phosphor-icons/react";
import { cn } from "./cn";

/**
 * Printed artwork for the Kit's labels: a single large duotone icon on paper with a
 * ruled frame, the way a packaging panel carries one ingredient illustration.
 */
const ICON: Record<string, Icon> = {
  "mission-starter": Package, "mission-routine": CalendarCheck, "mission-monthly": SunHorizon, "mission-team": UsersThree, "mission-review": Star, "mission-event": TicketIcon, "mission-academy": GraduationCap, "mission-referral": PaperPlaneTilt,
  "track-craft": VideoCamera, "track-growth": ChartLineUp, "track-business": Briefcase, "track-licensing": StampIcon, "track-wellbeing": HeartHalf, "track-mentorship": ChatsCircle,
  "level-member": Leaf, "level-insider": Plant, "level-pro": Flower, "level-ambassador": Tree,
  "season-summer-hair-rescue": Sun, "season-golden-hour": SunHorizon, "season-winter-glow": Snowflake, "season-finale": Trophy,
};
const CANDY: Record<string, string> = {
  "mission-starter": "bg-lime text-plum", "mission-routine": "bg-sky text-plum", "mission-monthly": "bg-lemon text-plum", "mission-team": "bg-bubblegum text-plum", "mission-review": "bg-grape text-white", "mission-event": "bg-tangerine text-plum", "mission-academy": "bg-mint text-plum", "mission-referral": "bg-mint text-plum",
  "track-craft": "bg-tangerine text-plum", "track-growth": "bg-lime text-plum", "track-business": "bg-lemon text-plum", "track-licensing": "bg-sky text-plum", "track-wellbeing": "bg-bubblegum text-plum", "track-mentorship": "bg-mint text-plum",
  "level-member": "bg-sky text-plum", "level-insider": "bg-lime text-plum", "level-pro": "bg-grape text-white", "level-ambassador": "bg-tangerine text-plum",
  "season-summer-hair-rescue": "bg-lemon text-plum", "season-golden-hour": "bg-tangerine text-plum", "season-winter-glow": "bg-sky text-plum", "season-finale": "bg-lime text-plum",
};
const WORD: Record<string, string> = {
  "mission-starter": "Starter", "mission-routine": "Routine", "mission-monthly": "Monthly", "mission-team": "Team", "mission-review": "Review", "mission-event": "Event", "mission-academy": "Academy", "mission-referral": "Referral",
};

export function Graphic({ id, className, compact, tone = "paper" }: { id: string; className?: string; compact?: boolean; tone?: "paper" | "forest" | "marigold" }) {
  const I = ICON[id] ?? Leaf;
  const word = WORD[id];
  const candy = CANDY[id] ?? "bg-lime";
  const bg = tone === "forest" ? "bg-ink text-lime" : tone === "marigold" ? "bg-lemon text-plum" : candy;
  return (
    <div className={cn("group/g relative flex h-full w-full items-center justify-center overflow-hidden", bg, className)}>
      <span aria-hidden className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-white/30" />
      <I weight="duotone" className={cn("transition-transform duration-300 group-hover/g:-rotate-6 group-hover/g:scale-110", compact ? "h-[52%] w-[52%]" : "h-[48%] w-[48%]")} />
      {word && !compact && <span className="meta absolute bottom-3 start-4 !text-plum/70">{word}</span>}
    </div>
  );
}
