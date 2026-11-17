import { Package, CalendarCheck, SunHorizon, UsersThree, Star, Ticket as TicketIcon, GraduationCap, PaperPlaneTilt, VideoCamera, ChartLineUp, Briefcase, Stamp as StampIcon, HeartHalf, ChatsCircle, Leaf, Plant, Flower, Tree, Sun, Snowflake, Trophy, type Icon } from "@phosphor-icons/react";
import { cn } from "./cn";
import { vivid } from "./brandColor";

/**
 * The lit panel a card carries when there is no photograph for it yet: one icon
 * on a brand-coloured gradient that drifts slowly. A brand's missions take the
 * brand's colour; everything else takes a colour from the Dabur family. Real
 * imagery replaces it through ArtSlot.
 */
const ICON: Record<string, Icon> = {
  "mission-starter": Package, "mission-routine": CalendarCheck, "mission-monthly": SunHorizon, "mission-team": UsersThree, "mission-review": Star, "mission-event": TicketIcon, "mission-academy": GraduationCap, "mission-referral": PaperPlaneTilt,
  "track-craft": VideoCamera, "track-growth": ChartLineUp, "track-business": Briefcase, "track-licensing": StampIcon, "track-wellbeing": HeartHalf, "track-mentorship": ChatsCircle,
  "level-member": Leaf, "level-insider": Plant, "level-pro": Flower, "level-ambassador": Tree,
  "season-summer-hair-rescue": Sun, "season-golden-hour": SunHorizon, "season-winter-glow": Snowflake, "season-finale": Trophy,
};
const TONE: Record<string, string> = {
  "mission-starter": "squad", "mission-routine": "dabur-herbl", "mission-monthly": "saffron", "mission-team": "fem", "mission-review": "odonil", "mission-event": "dabur-red", "mission-academy": "dabur-amla", "mission-referral": "real",
  "track-craft": "dabur-red", "track-growth": "squad", "track-business": "saffron", "track-licensing": "odonil", "track-wellbeing": "fem", "track-mentorship": "dabur-herbl",
  "level-member": "mist", "level-insider": "squad", "level-pro": "night", "level-ambassador": "saffron",
  "season-summer-hair-rescue": "real", "season-golden-hour": "saffron", "season-winter-glow": "odonil", "season-finale": "squad",
};
const WORD: Record<string, string> = {
  "mission-starter": "Starter", "mission-routine": "Routine", "mission-monthly": "Monthly", "mission-team": "Team", "mission-review": "Review", "mission-event": "Event", "mission-academy": "Academy", "mission-referral": "Referral",
};

export function Graphic({ id, className, compact, tone = "paper", brandId }: { id: string; className?: string; compact?: boolean; tone?: "paper" | "forest" | "marigold"; brandId?: string | null }) {
  const I = ICON[id] ?? Leaf;
  const word = WORD[id];
  const v = vivid(tone === "forest" ? "night" : tone === "marigold" ? "saffron" : brandId ?? TONE[id] ?? "squad");
  return (
    <div className={cn("pan group/g relative flex h-full w-full items-center justify-center overflow-hidden", className)} style={{ backgroundImage: `linear-gradient(135deg, ${v.from} 0%, ${v.to} 60%, ${v.from} 120%)`, color: v.on }}>
      <span aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 20% 0%, rgb(255 255 255 / 0.28), transparent 55%)" }} />
      <I weight="regular" className={cn("relative transition-transform duration-500 ease-out group-hover/g:scale-110 group-hover:scale-110", compact ? "h-[44%] w-[44%]" : "h-[36%] w-[36%]")} />
      {word && !compact && <span className="absolute bottom-3 start-4 text-[11px] font-medium uppercase tracking-[0.1em] opacity-80">{word}</span>}
    </div>
  );
}
