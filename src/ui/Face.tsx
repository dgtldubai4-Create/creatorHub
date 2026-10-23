/**
 * Illustrated faces drawn in code. Every creator gets a deterministic look from
 * their name: skin, hair or hijab, colours, glasses, expression. Bold ink
 * outlines so they sit with the rest of the candy system. No images.
 */
import { useId } from "react";
import { cn } from "./cn";

export type HairStyle = "long" | "bob" | "curly" | "short" | "crop" | "bun" | "hijab";
export type Mouth = "smile" | "grin" | "smirk";
export interface Look {
  skin: number;
  hair: HairStyle;
  hairColor: number;
  wrap: number;
  bg: number;
  shirt: number;
  glasses: boolean;
  earrings: boolean;
  mouth: Mouth;
}

const SKIN = ["#f7dcc2", "#edc3a0", "#d9a07a", "#b97a52", "#8e5a3c", "#5e3a27"];
const HAIR = ["#2f2254", "#3b2314", "#6b3a1f", "#3a2240", "#8a4b2a"];
const CANDY = ["#c9f24a", "#ff7a3d", "#ff7bc8", "#3fa9ff", "#ffd43b", "#7b5bff", "#5ee6b0"];
const WRAP = ["#ff7a3d", "#3fa9ff", "#7b5bff", "#5ee6b0", "#ffd43b", "#ff7bc8", "#3a2d6b", "#ffffff"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Hand-set looks for the seed cast. Anyone else gets a hashed look. */
const CAST: Record<string, Partial<Look>> = {
  Layla: { hair: "long", hairColor: 0, glasses: false, earrings: true, mouth: "grin" },
  Noor: { hair: "bob", hairColor: 1, earrings: true },
  Reem: { hair: "hijab", wrap: 1, mouth: "smile" },
  Hessa: { hair: "hijab", wrap: 3, mouth: "grin" },
  Dana: { hair: "bun", hairColor: 2, glasses: true, mouth: "grin" },
  Yara: { hair: "long", hairColor: 3, mouth: "smirk", earrings: true },
  Omar: { hair: "crop", hairColor: 0, mouth: "grin" },
  Tariq: { hair: "short", hairColor: 1, glasses: true },
  Nadine: { hair: "bun", hairColor: 0, mouth: "smile" },
  Aisha: { hair: "curly", hairColor: 1, mouth: "grin", earrings: true },
  Sara: { hair: "hijab", wrap: 6, mouth: "smirk" },
  Mariam: { hair: "hijab", wrap: 5, mouth: "grin" },
  Fatima: { hair: "hijab", wrap: 7, mouth: "smile" },
  Lina: { hair: "long", hairColor: 2, earrings: true },
  Salma: { hair: "hijab", wrap: 0, mouth: "grin" },
  Khalid: { hair: "crop", hairColor: 0, mouth: "smirk" },
  Youssef: { hair: "short", hairColor: 1, mouth: "grin" },
  Maha: { hair: "hijab", wrap: 2, glasses: true },
  Ghada: { hair: "hijab", wrap: 4, mouth: "grin" },
  Amal: { hair: "bob", hairColor: 0, mouth: "grin", earrings: true },
  Maryam: { hair: "bun", hairColor: 3, mouth: "smirk" },
  Alya: { hair: "hijab", wrap: 6, mouth: "smile", earrings: false },
  Zahra: { hair: "curly", hairColor: 0, mouth: "grin" },
  Hamad: { hair: "crop", hairColor: 0, glasses: true, mouth: "grin" },
  Noura: { hair: "hijab", wrap: 1, mouth: "grin" },
  Rania: { hair: "bob", hairColor: 2, glasses: true, mouth: "smile" },
  Faisal: { hair: "short", hairColor: 0, mouth: "smile" },
  Dina: { hair: "long", hairColor: 1, mouth: "grin" },
  Karim: { hair: "crop", hairColor: 1, glasses: true },
  Hana: { hair: "hijab", wrap: 3, mouth: "smile" },
};

const STYLES: HairStyle[] = ["long", "bob", "curly", "short", "crop", "bun", "hijab"];
const MOUTHS: Mouth[] = ["smile", "grin", "smirk"];

export function lookFor(name: string, hue = 0): Look {
  const h = hash(name + hue);
  const base: Look = {
    skin: h % SKIN.length,
    hair: STYLES[(h >> 3) % STYLES.length],
    hairColor: (h >> 6) % HAIR.length,
    wrap: (h >> 9) % WRAP.length,
    bg: (h >> 12) % CANDY.length,
    shirt: (h >> 15) % CANDY.length,
    glasses: ((h >> 18) & 7) === 0,
    earrings: ((h >> 21) & 3) === 0,
    mouth: MOUTHS[(h >> 24) % MOUTHS.length],
  };
  const first = name.split(" ")[0];
  const cast = CAST[first];
  const look = { ...base, ...cast };
  if (look.shirt === look.bg) look.shirt = (look.bg + 3) % CANDY.length;
  return look;
}

export function Face({ name, hue = 0, size = 40, className, look: override, style }: { name: string; hue?: number; size?: number | string; className?: string; look?: Partial<Look>; style?: React.CSSProperties }) {
  const id = useId();
  const look = { ...lookFor(name, hue), ...override };
  const skin = SKIN[look.skin];
  const hair = HAIR[look.hairColor];
  const wrap = WRAP[look.wrap];
  const bg = CANDY[look.bg];
  const shirt = CANDY[look.shirt];
  const ink = "#1f1740";
  const sw = 3;
  const hijab = look.hair === "hijab";
  return (
    <span className={cn("inline-block shrink-0 select-none leading-none", className)} style={{ width: size, height: size, borderRadius: "50%", ...style }} aria-hidden>
    <svg viewBox="0 0 120 120" width="100%" height="100%" className="block">
      <defs>
        <clipPath id={id}><circle cx="60" cy="60" r="57" /></clipPath>
      </defs>
      <circle cx="60" cy="60" r="57" fill={bg} stroke={ink} strokeWidth={sw} />
      <g clipPath={`url(#${id})`}>
        {/* hair or wrap behind the head */}
        {look.hair === "long" && <path d="M31 62 C28 28 42 18 60 18 C78 18 92 28 89 62 L93 104 L27 104 Z" fill={hair} stroke={ink} strokeWidth={sw} />}
        {look.hair === "bob" && <path d="M30 64 C27 32 42 20 60 20 C78 20 93 32 90 64 L91 86 L29 86 Z" fill={hair} stroke={ink} strokeWidth={sw} />}
        {look.hair === "curly" && [[36, 36], [48, 26], [60, 22], [72, 26], [84, 36], [90, 50], [30, 50], [30, 66], [90, 66]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="13" fill={hair} stroke={ink} strokeWidth={sw} />)}
        {look.hair === "bun" && <circle cx="60" cy="22" r="12" fill={hair} stroke={ink} strokeWidth={sw} />}
        {hijab && <path d="M20 72 C18 26 40 14 60 14 C80 14 102 26 100 72 L108 120 L12 120 Z" fill={wrap} stroke={ink} strokeWidth={sw} />}
        {/* shoulders */}
        <path d="M8 132 C8 98 30 92 60 92 C90 92 112 98 112 132 Z" fill={shirt} stroke={ink} strokeWidth={sw} />
        {/* neck */}
        <rect x="49" y="74" width="22" height="22" rx="7" fill={skin} stroke={ink} strokeWidth={sw} />
        {/* hijab drape under the chin */}
        {hijab && <path d="M30 70 C34 100 86 100 90 70 C92 104 28 104 30 70 Z" fill={wrap} stroke={ink} strokeWidth={sw} />}
        {/* ears */}
        {!hijab && <>
          <circle cx="33" cy="60" r="6" fill={skin} stroke={ink} strokeWidth={sw} />
          <circle cx="87" cy="60" r="6" fill={skin} stroke={ink} strokeWidth={sw} />
        </>}
        {/* head */}
        <ellipse cx="60" cy="58" rx="27" ry="30" fill={skin} stroke={ink} strokeWidth={sw} />
        {/* fringe */}
        {(look.hair === "long" || look.hair === "bob" || look.hair === "bun") && <path d="M33 52 C33 30 45 24 60 24 C75 24 87 30 87 52 C82 40 73 36 60 36 C47 36 38 40 33 52 Z" fill={hair} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />}
        {look.hair === "short" && <path d="M33 50 C33 26 45 22 60 22 C75 22 87 26 87 50 C84 36 72 33 60 33 C48 33 36 36 33 50 Z" fill={hair} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />}
        {look.hair === "crop" && <path d="M34 46 C35 30 46 26 60 26 C74 26 85 30 86 46 C82 37 72 35 60 35 C48 35 38 37 34 46 Z" fill={hair} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />}
        {look.hair === "curly" && [[40, 38], [50, 30], [60, 27], [70, 30], [80, 38]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="10" fill={hair} stroke={ink} strokeWidth={sw} />)}
        {hijab && <path d="M31 60 C30 30 44 20 60 20 C76 20 90 30 89 60 C86 44 76 38 60 38 C44 38 34 44 31 60 Z" fill={wrap} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />}
        {/* brows */}
        <path d="M42 51 Q49 47 55 51" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M65 51 Q71 47 78 51" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* eyes */}
        <circle cx="49" cy="60" r="3.4" fill={ink} />
        <circle cx="71" cy="60" r="3.4" fill={ink} />
        <circle cx="50.2" cy="58.8" r="1.1" fill="#fff" />
        <circle cx="72.2" cy="58.8" r="1.1" fill="#fff" />
        {/* blush */}
        <circle cx="41" cy="68" r="4.5" fill="#ff7bc8" opacity="0.55" />
        <circle cx="79" cy="68" r="4.5" fill="#ff7bc8" opacity="0.55" />
        {/* mouth */}
        {look.mouth === "smile" && <path d="M51 72 Q60 80 69 72" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />}
        {look.mouth === "grin" && <path d="M50 70 Q60 84 70 70 Z" fill="#fff" stroke={ink} strokeWidth="3" strokeLinejoin="round" />}
        {look.mouth === "smirk" && <path d="M52 73 Q62 79 69 70" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />}
        {/* glasses */}
        {look.glasses && <g fill="none" stroke={ink} strokeWidth="2.6">
          <rect x="40" y="53" width="17" height="13" rx="6" />
          <rect x="63" y="53" width="17" height="13" rx="6" />
          <path d="M57 59 L63 59" />
        </g>}
        {/* earrings */}
        {look.earrings && !hijab && <>
          <circle cx="33" cy="68" r="3" fill="#ffd43b" stroke={ink} strokeWidth="2" />
          <circle cx="87" cy="68" r="3" fill="#ffd43b" stroke={ink} strokeWidth="2" />
        </>}
      </g>
    </svg>
    </span>
  );
}

/** A pile of faces, overlapping. */
export function FacePile({ people, size = 32, max = 5, className }: { people: { name: string; hue: number }[]; size?: number; max?: number; className?: string }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className={cn("inline-flex items-center", className)} dir="ltr">
      {shown.map((p, i) => <Face key={p.name + i} name={p.name} hue={p.hue} size={size} className="rounded-full ring-[3px] ring-surface" style={{ marginLeft: i ? -size * 0.3 : 0 }} />)}
      {rest > 0 && <span className="ms-1 inline-flex h-7 items-center rounded-full bg-ink px-2 text-[12px] font-bold text-canvas">+{rest}</span>}
    </span>
  );
}
