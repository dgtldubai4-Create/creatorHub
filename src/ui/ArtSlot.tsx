import { ImageSquare } from "@phosphor-icons/react";
import { slotById } from "../art/manifest";
import { cn } from "./cn";

// Files written by scripts/generate-art.ts. Vite inlines or hashes them at build time.
const FILES = import.meta.glob("../art/generated/*.{png,webp,jpg,jpeg,svg}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

function fileFor(id: string): string | undefined {
  const key = Object.keys(FILES).find((k) => /\/([^/]+)\.(png|webp|jpe?g|svg)$/.exec(k)?.[1] === id);
  return key ? FILES[key] : undefined;
}

export function hasArt(id: string): boolean {
  return !!fileFor(id);
}

/**
 * Renders a generated asset when it exists, otherwise a quiet labelled tile in the slot's hue.
 * The label stays visible on purpose: nothing in the UI pretends to be art that is not there.
 */
export function ArtSlot({ id, className, alt, cover = true, showLabel = true }: { id: string; className?: string; alt?: string; cover?: boolean; showLabel?: boolean }) {
  const slot = slotById(id);
  const src = fileFor(id);
  if (src) return <img src={src} alt={alt ?? slot?.label ?? ""} className={cn(cover ? "object-cover" : "object-contain", "h-full w-full", className)} loading="lazy" />;
  const hue = slot?.hue ?? 150;
  return (
    <div
      role="img"
      aria-label={alt ?? slot?.label ?? id}
      title={slot ? `${slot.label}. ${slot.placement}. Generate with: npm run art -- --only ${slot.id}` : id}
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, oklch(0.93 0.05 ${hue}) 0%, oklch(0.86 0.07 ${(hue + 30) % 360}) 55%, oklch(0.78 0.09 ${(hue + 60) % 360}) 100%)` }}
    >
      <span className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-white/25" />
      <span className="pointer-events-none absolute -bottom-10 start-6 h-28 w-28 rounded-full bg-white/15" />
      <ImageSquare size={28} weight="duotone" className="text-black/25" />
      {showLabel && slot && (
        <span className="absolute bottom-1.5 end-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-black/60 backdrop-blur-sm">
          {slot.tool === "recraft" ? "Recraft" : "Hugging Face"} slot
        </span>
      )}
    </div>
  );
}
