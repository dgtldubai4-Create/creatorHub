"use client";

import { useState } from "react";
import Image from "next/image";
import type { Brand } from "@/lib/constants";
import { PRODUCT_ASSETS } from "@/lib/assets";
import { ProductArt } from "@/components/product-art";

/**
 * Renders the real packshot when a URL is configured in src/lib/assets.ts and
 * loads successfully; otherwise falls back to the brand illustration. This
 * keeps the sandbox demo intact while real imagery lights up automatically
 * anywhere the network can reach the CDN.
 */
export function ProductImage({
  brand,
  height = 84,
  className,
}: {
  brand: Brand;
  height?: number;
  className?: string;
}) {
  const asset = PRODUCT_ASSETS[brand];
  const [failed, setFailed] = useState(false);

  if (!asset.imageUrl || failed) {
    return <ProductArt brand={brand} height={height} className={className} />;
  }

  return (
    <Image
      src={asset.imageUrl}
      alt={asset.alt}
      height={height}
      width={Math.round(height * 0.75)}
      className={className}
      style={{ height, width: "auto", objectFit: "contain" }}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
