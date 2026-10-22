import { slotById } from "../art/manifest";
import { Graphic } from "./Graphic";
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
 * Renders a generated asset when one exists for the slot; otherwise the designed,
 * code-built graphic for that slot. Both fill their container.
 */
export function ArtSlot({ id, className, alt, cover = true, compact }: { id: string; className?: string; alt?: string; cover?: boolean; showLabel?: boolean; compact?: boolean }) {
  const slot = slotById(id);
  const src = fileFor(id);
  if (src) return <img src={src} alt={alt ?? slot?.label ?? ""} className={cn(cover ? "object-cover" : "object-contain", "h-full w-full", className)} loading="lazy" />;
  return (
    <div role="img" aria-label={alt ?? slot?.label ?? id} className={cn("h-full w-full", className)}>
      <Graphic id={id} compact={compact} />
    </div>
  );
}
