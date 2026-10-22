import type { Brand, Product } from "../domain/types";
import { cn } from "./cn";
import { useL } from "../i18n";

/**
 * Product render built in code: a pack silhouette in the brand colour with a printed
 * label carrying the brand mark and product name, a gloss highlight and a soft shadow.
 * Real pack shots replace it the moment the catalogue sync fills `product.image`.
 */
export function ProductArt({ product, brand, className, size = "md" }: { product: Product; brand?: Brand; className?: string; size?: "sm" | "md" | "lg" }) {
  const L = useL();
  const hue = brand?.hue ?? "#17994f";
  const dims = size === "sm" ? "h-16 w-16" : size === "lg" ? "aspect-[4/5] w-full" : "h-28 w-28";
  if (product.image) {
    return <img src={product.image} alt={L(product.names)} className={cn("rounded-2xl object-cover", dims, className)} loading="lazy" />;
  }
  const short = product.names.en.replace(/^(Vatika Naturals|Dabur|Real Fruit Power|Fem|Hajmola|Odonil|Dermoviva Skin Naturals)\s*/i, "").split(" ").slice(0, 3).join(" ");
  return (
    <div
      className={cn("group relative flex items-end justify-center overflow-hidden rounded-2xl", dims, className)}
      style={{ background: `radial-gradient(120% 80% at 30% 0%, color-mix(in oklab, ${hue} 14%, white), color-mix(in oklab, ${hue} 36%, var(--surface-2)) 70%)` }}
      aria-label={L(product.names)}
      role="img"
    >
      <span className="pointer-events-none absolute inset-x-[18%] bottom-[7%] h-[6%] rounded-[50%] bg-black/25 blur-[3px]" />
      <Pack type={product.packType} hue={hue} brand={brand?.name ?? "Dabur"} name={short} small={size === "sm"} />
    </div>
  );
}

function Label({ brand, name, hue, small }: { brand: string; name: string; hue: string; small?: boolean }) {
  return (
    <span className="absolute inset-x-[12%] top-[32%] flex h-[36%] flex-col items-center justify-center overflow-hidden rounded-[8%] bg-white/92 px-[6%] text-center shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]">
      <span className={cn("w-full truncate font-extrabold uppercase leading-none tracking-tight", small ? "text-[6px]" : "text-[9px]")} style={{ color: hue }}>{brand}</span>
      {!small && <span className="mt-[3px] line-clamp-2 w-full text-[7.5px] font-semibold leading-[1.05] text-black/70">{name}</span>}
      <span className="mt-[4px] h-[2px] w-[40%] rounded-full" style={{ background: hue }} />
    </span>
  );
}

function Pack({ type, hue, brand, name, small }: { type: Product["packType"]; hue: string; brand: string; name: string; small?: boolean }) {
  const body = `linear-gradient(90deg, color-mix(in oklab, ${hue} 70%, white) 0%, ${hue} 38%, color-mix(in oklab, ${hue} 72%, black) 100%)`;
  const base = "relative mb-[12%] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-2deg]";
  const gloss = <span className="pointer-events-none absolute inset-y-[6%] start-[14%] w-[12%] rounded-full bg-white/45 blur-[1px]" />;
  const style = { background: body, boxShadow: "inset -6px 0 12px rgb(0 0 0 / 0.18), inset 5px 0 10px rgb(255 255 255 / 0.22), 0 10px 18px -10px rgb(0 0 0 / 0.5)" };
  switch (type) {
    case "tube":
      return <div className={cn(base, "h-[64%] w-[32%] rounded-t-[14%] rounded-b-[46%]")} style={style}><span className="absolute -top-[10%] start-1/2 h-[12%] w-[52%] -translate-x-1/2 rounded-[20%] bg-white/85 shadow-sm" />{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
    case "jar":
      return <div className={cn(base, "h-[50%] w-[54%] rounded-[16%]")} style={style}><span className="absolute -top-[14%] start-[4%] h-[18%] w-[92%] rounded-[12%] bg-black/35" />{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
    case "carton":
      return <div className={cn(base, "h-[72%] w-[42%] rounded-[6%]")} style={style}><span className="absolute -top-[6%] inset-x-0 h-[10%] rounded-t-[8%] bg-white/55" />{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
    case "sachet":
    case "pouch":
      return <div className={cn(base, "h-[60%] w-[48%] rounded-[8%] [clip-path:polygon(6%_0,94%_0,100%_100%,0_100%)]")} style={style}>{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
    case "box":
      return <div className={cn(base, "h-[54%] w-[58%] rounded-[8%]")} style={style}>{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
    case "spray":
      return <div className={cn(base, "h-[62%] w-[28%] rounded-t-[18%] rounded-b-[10%]")} style={style}><span className="absolute -top-[16%] start-1/2 h-[16%] w-[48%] -translate-x-1/2 rounded-t-[30%] bg-black/40" />{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
    default:
      return <div className={cn(base, "h-[68%] w-[36%] rounded-t-[42%] rounded-b-[18%]")} style={style}><span className="absolute -top-[8%] start-1/2 h-[10%] w-[40%] -translate-x-1/2 rounded-[20%] bg-black/40" />{gloss}<Label brand={brand} name={name} hue={hue} small={small} /></div>;
  }
}
