import type { Brand } from "@/lib/constants";

/**
 * Product/brand imagery manifest.
 *
 * `imageUrl`: paste a real remote image URL (amazon.ae CDN, dabur.com, or a
 * file committed under /public) and every surface upgrades from the built-in
 * illustration to the real packshot automatically. Remote hosts must be listed
 * in next.config.mjs `images.remotePatterns` (m.media-amazon.com, dabur.com
 * and images.unsplash.com are pre-wired).
 *
 * NOTE for this repo's dev sandbox: the sandbox's egress proxy blocks image
 * CDNs, so URLs render only when the app runs locally or deployed. The
 * illustrated fallback keeps every environment presentable.
 */
export const PRODUCT_ASSETS: Record<Brand, { alt: string; imageUrl: string | null }> = {
  VATIKA_NATURALS: { alt: "Vatika Naturals shampoo bottle", imageUrl: null },
  DABUR_AMLA: { alt: "Dabur Amla hair oil bottle", imageUrl: null },
  AMLA_KIDS: { alt: "Amla Kids haircare bottle", imageUrl: null },
  VATIKA_MENZ: { alt: "Vatika Menz styling paste tub", imageUrl: null },
  HERBOLENE: { alt: "Herbolene aloe jelly jar", imageUrl: null },
  DABUR_MISWAK: { alt: "Dabur Miswak toothpaste tube", imageUrl: null },
  DERMOVIVA: { alt: "Dermoviva skin care bottle", imageUrl: null },
};

/** Brand logo slots — same contract as PRODUCT_ASSETS. */
export const BRAND_LOGO_ASSETS: Record<Brand, { alt: string; imageUrl: string | null }> = {
  VATIKA_NATURALS: { alt: "Vatika Naturals logo", imageUrl: null },
  DABUR_AMLA: { alt: "Dabur Amla logo", imageUrl: null },
  AMLA_KIDS: { alt: "Amla Kids logo", imageUrl: null },
  VATIKA_MENZ: { alt: "Vatika Menz logo", imageUrl: null },
  HERBOLENE: { alt: "Herbolene logo", imageUrl: null },
  DABUR_MISWAK: { alt: "Dabur Miswak logo", imageUrl: null },
  DERMOVIVA: { alt: "Dermoviva logo", imageUrl: null },
};
