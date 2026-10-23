import type { Brand, Product } from "../domain/types";
import { cn } from "./cn";
import { useL } from "../i18n";
import { brandGlyph } from "./kit";

/**
 * Pack shot built in code: the pack silhouette in the brand colour with a properly
 * laid-out printed label (ingredient glyph, brand, product line, variant band, net
 * contents). Real pack shots replace it when the catalogue sync fills `product.image`.
 */
export function ProductArt({ product, brand, className, size = "md" }: { product: Product; brand?: Brand; className?: string; size?: "sm" | "md" | "lg" }) {
  const L = useL();
  const hue = brand?.hue ?? "#1c8a4c";
  const dims = size === "sm" ? "h-16 w-16" : size === "lg" ? "aspect-[4/5] w-full" : "h-28 w-28";
  if (product.image) {
    return <img src={product.image} alt={L(product.names)} className={cn("rounded-[10px] object-cover", dims, className)} loading="lazy" />;
  }
  const brandName = brand?.name ?? "Dabur";
  const line = product.names.en.replace(new RegExp(`^(${brandName}|Vatika Naturals|Dabur|Real Fruit Power|Dermoviva Skin Naturals)\\s*`, "i"), "").replace(/\s*(Hair Oil|Toothpaste|Juice|Shampoo|Conditioner)$/i, "").trim();
  const kind = product.type;
  const Glyph = brandGlyph(brand?.id);
  return (
    <div className={cn("group relative flex items-end justify-center overflow-hidden rounded-[10px] bg-surface-2", dims, className)} aria-label={L(product.names)} role="img">
      <span className="pointer-events-none absolute inset-x-[16%] bottom-[6%] h-[7%] rounded-[50%] bg-black/20 blur-[4px]" />
      <Pack type={product.packType} hue={hue} small={size === "sm"}>
        <span className="absolute inset-x-[10%] top-[26%] flex h-[48%] flex-col overflow-hidden rounded-[6%] bg-[#fbfaf6] text-[#132419] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
          <span className="flex items-center gap-[4%] px-[8%] pt-[7%]">
            <Glyph weight="duotone" className="h-[14%] w-auto shrink-0" style={{ color: hue, fontSize: size === "sm" ? 7 : size === "md" ? 10 : 16 }} />
            <span className={cn("truncate font-bold uppercase leading-none tracking-[0.06em]", size === "sm" ? "text-[5px]" : size === "md" ? "text-[7.5px]" : "text-[11px]")} style={{ color: hue }}>{brandName}</span>
          </span>
          {size !== "sm" && <span className={cn("mt-[5%] px-[8%] font-semibold leading-[1.05] text-[#132419]", size === "md" ? "line-clamp-2 text-[7.5px]" : "line-clamp-2 text-[12px]")}>{line}</span>}
          <span className="mt-auto flex items-center justify-between px-[8%] pb-[6%]" style={{ borderTop: `2px solid ${hue}` }}>
            {size !== "sm" && <span className={cn("truncate pt-[4%] font-medium uppercase tracking-[0.1em] text-black/55", size === "md" ? "text-[5px]" : "text-[8px]")}>{kind}</span>}
          </span>
        </span>
      </Pack>
    </div>
  );
}

function Pack({ type, hue, children }: { type: Product["packType"]; hue: string; small?: boolean; children: React.ReactNode }) {
  const body = `linear-gradient(90deg, color-mix(in oklab, ${hue} 78%, white) 0%, ${hue} 42%, color-mix(in oklab, ${hue} 76%, black) 100%)`;
  const base = "relative mb-[11%] transition-transform duration-500 group-hover:-translate-y-1";
  const gloss = <span className="pointer-events-none absolute inset-y-[5%] start-[12%] w-[10%] rounded-full bg-white/40 blur-[1px]" />;
  const style = { background: body, boxShadow: "inset -5px 0 10px rgb(0 0 0 / 0.2), inset 4px 0 8px rgb(255 255 255 / 0.2)" };
  const cap = (cls: string) => <span className={cn("absolute start-1/2 -translate-x-1/2 bg-[#1b1b1b]/85", cls)} style={{ backgroundColor: `color-mix(in oklab, ${hue} 30%, #111)` }} />;
  switch (type) {
    case "tube":
      return <div className={cn(base, "h-[66%] w-[34%] rounded-t-[12%] rounded-b-[44%]")} style={style}>{cap("-top-[9%] h-[11%] w-[48%] rounded-[18%]")}{gloss}{children}</div>;
    case "jar":
      return <div className={cn(base, "h-[52%] w-[56%] rounded-[14%]")} style={style}>{cap("-top-[16%] h-[18%] w-[94%] rounded-[10%]")}{gloss}{children}</div>;
    case "carton":
      return <div className={cn(base, "h-[74%] w-[42%] rounded-[5%]")} style={style}><span className="absolute -top-[5%] inset-x-0 h-[9%] rounded-t-[8%] bg-white/50" />{gloss}{children}</div>;
    case "sachet":
    case "pouch":
      return <div className={cn(base, "h-[62%] w-[50%] rounded-[8%] [clip-path:polygon(6%_0,94%_0,100%_100%,0_100%)]")} style={style}>{gloss}{children}</div>;
    case "box":
      return <div className={cn(base, "h-[56%] w-[60%] rounded-[7%]")} style={style}>{gloss}{children}</div>;
    case "spray":
      return <div className={cn(base, "h-[64%] w-[30%] rounded-t-[16%] rounded-b-[10%]")} style={style}>{cap("-top-[16%] h-[16%] w-[46%] rounded-t-[30%]")}{gloss}{children}</div>;
    default:
      return <div className={cn(base, "h-[70%] w-[38%] rounded-t-[40%] rounded-b-[16%]")} style={style}>{cap("-top-[8%] h-[10%] w-[38%] rounded-[20%]")}{gloss}{children}</div>;
  }
}
