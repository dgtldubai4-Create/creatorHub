import type { Brand, Product } from "../domain/types";
import { cn } from "./cn";
import { useL } from "../i18n";

/**
 * Product tile. Real pack shots arrive with the catalogue sync (product.image);
 * until then a pack silhouette in the brand colour stands in, clearly labelled.
 */
export function ProductArt({ product, brand, className, size = "md" }: { product: Product; brand?: Brand; className?: string; size?: "sm" | "md" | "lg" }) {
  const L = useL();
  const hue = brand?.hue ?? "#178a47";
  const dims = size === "sm" ? "h-16 w-16" : size === "lg" ? "aspect-[4/5] w-full" : "h-28 w-28";
  if (product.image) {
    return <img src={product.image} alt={L(product.names)} className={cn("rounded-2xl object-cover", dims, className)} loading="lazy" />;
  }
  return (
    <div className={cn("relative flex items-end justify-center overflow-hidden rounded-2xl", dims, className)} style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${hue} 18%, var(--surface-2)), color-mix(in oklab, ${hue} 42%, var(--surface-3)))` }} aria-label={L(product.names)} role="img">
      <Pack type={product.packType} hue={hue} />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
    </div>
  );
}

function Pack({ type, hue }: { type: Product["packType"]; hue: string }) {
  const base = "relative mb-[12%] shadow-[inset_-6px_0_10px_rgb(0_0_0/0.12),inset_4px_0_8px_rgb(255_255_255/0.25)]";
  const style = { background: `linear-gradient(90deg, color-mix(in oklab, ${hue} 85%, white), ${hue} 55%, color-mix(in oklab, ${hue} 70%, black))` };
  switch (type) {
    case "tube":
      return <div className={cn(base, "h-[62%] w-[30%] rounded-t-md rounded-b-[40%]")} style={style}><span className="absolute -top-[10%] left-1/2 h-[12%] w-[55%] -translate-x-1/2 rounded-sm bg-white/70" /></div>;
    case "jar":
      return <div className={cn(base, "h-[48%] w-[52%] rounded-2xl")} style={style}><span className="absolute -top-[14%] left-[6%] h-[16%] w-[88%] rounded-md bg-black/25" /></div>;
    case "carton":
      return <div className={cn(base, "h-[70%] w-[40%] rounded-md")} style={style}><span className="absolute -top-[7%] left-0 h-[10%] w-full rounded-t-md bg-white/50" /></div>;
    case "sachet":
    case "pouch":
      return <div className={cn(base, "h-[58%] w-[46%] rounded-lg [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]")} style={style} />;
    case "box":
      return <div className={cn(base, "h-[52%] w-[56%] rounded-lg")} style={style}><span className="absolute inset-x-[10%] top-[14%] h-[26%] rounded bg-white/40" /></div>;
    case "spray":
      return <div className={cn(base, "h-[60%] w-[26%] rounded-t-lg rounded-b-md")} style={style}><span className="absolute -top-[16%] left-1/2 h-[16%] w-[50%] -translate-x-1/2 rounded-t-md bg-black/30" /></div>;
    default:
      return <div className={cn(base, "h-[66%] w-[34%] rounded-t-[45%] rounded-b-xl")} style={style}><span className="absolute -top-[8%] left-1/2 h-[10%] w-[40%] -translate-x-1/2 rounded-sm bg-black/30" /><span className="absolute inset-x-[12%] top-[34%] h-[30%] rounded-md bg-white/70" /></div>;
  }
}
