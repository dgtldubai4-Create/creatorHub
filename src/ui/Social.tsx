import { InstagramLogo, TiktokLogo, ArrowUpRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import manifest from "../art/social/posts.json";
import { cn } from "./cn";

/**
 * Posts from Dabur's own Instagram and TikTok, bundled at build time by
 * `npm run social`. Nothing is fetched at runtime. With no posts in the folder
 * the wall renders nothing, so pages lay out the same either way.
 */
export interface SocialPost { id: string; platform: "instagram" | "tiktok"; handle: string; caption: string; permalink: string; postedAt: string; file: string; brandId?: string }

const FILES = import.meta.glob("../art/social/*.{png,webp,jpg,jpeg}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const urlFor = (file: string) => FILES[`../art/social/${file}`];

export const SOCIAL_POSTS: (SocialPost & { src: string })[] = (manifest as SocialPost[]).map((p) => ({ ...p, src: urlFor(p.file) })).filter((p) => !!p.src);

export function hasSocial(): boolean {
  return SOCIAL_POSTS.length > 0;
}

export function socialFor(brandId: string | null | undefined): (SocialPost & { src: string }) | undefined {
  return brandId ? SOCIAL_POSTS.find((p) => p.brandId === brandId) : undefined;
}

export function SocialTile({ post, className }: { post: SocialPost & { src: string }; className?: string }) {
  const Logo = post.platform === "tiktok" ? TiktokLogo : InstagramLogo;
  return (
    <a href={post.permalink} target="_blank" rel="noreferrer" className={cn("group relative block overflow-hidden rounded-[18px] bg-surface-2", className)}>
      <img src={post.src} alt={post.caption || `@${post.handle}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-md"><Logo size={14} weight="fill" />@{post.handle}</span>
      <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
        <span className="line-clamp-2 text-[13px] leading-snug">{post.caption}</span>
        <ArrowUpRight size={16} className="shrink-0 opacity-0 transition-all duration-300 group-hover:opacity-100 rtl:-scale-x-100" />
      </span>
    </a>
  );
}

/** A staggered wall of posts. The first is large; the rest fill a grid around it. */
export function SocialWall({ max = 7, className }: { max?: number; className?: string }) {
  const posts = SOCIAL_POSTS.slice(0, max);
  if (!posts.length) return null;
  return (
    <div className={cn("grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4", className)}>
      {posts.map((p, i) => (
        <motion.div key={p.id} className={cn(i === 0 && "col-span-2 row-span-2")} initial={{ opacity: 0, y: 24, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}>
          <SocialTile post={p} className="h-full w-full" />
        </motion.div>
      ))}
    </div>
  );
}
