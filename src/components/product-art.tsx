import type { Brand } from "@/lib/constants";

/**
 * Original, simplified product illustrations — one recognizable silhouette per
 * brand, used wherever a real packshot URL hasn't been provided yet
 * (see src/lib/assets.ts). Server-safe SVGs.
 */
export function ProductArt({
  brand,
  className,
  height = 84,
}: {
  brand: Brand;
  className?: string;
  height?: number;
}) {
  const common = {
    height,
    className,
    viewBox: "0 0 72 96",
    role: "img" as const,
  };

  switch (brand) {
    case "DABUR_AMLA":
      return (
        <svg {...common} aria-label="Dabur Amla hair oil (illustration)">
          <path d="M28 4h16v11H28z" fill="#d8a018" />
          <path d="M26 15h20l6 13v54a9 9 0 0 1-9 9H29a9 9 0 0 1-9-9V28z" fill="#123a22" />
          <path d="M29 17l3-1v70l-3-2z" fill="#2c6b41" opacity="0.8" />
          <rect x="24" y="40" width="24" height="32" rx="3" fill="#f6efdc" />
          <rect x="24" y="40" width="24" height="9" rx="3" fill="#1c5a31" />
          <circle cx="36" cy="60" r="7" fill="#78a832" />
        </svg>
      );
    case "VATIKA_NATURALS":
      return (
        <svg {...common} aria-label="Vatika Naturals shampoo (illustration)">
          <path d="M33 4h6v8h8v6H33z" fill="#0c6e60" />
          <path d="M24 18h24c3 10 5 16 5 26v38a8 8 0 0 1-8 8H27a8 8 0 0 1-8-8V44c0-10 2-16 5-26z" fill="#16a08c" />
          <path d="M27 20l3-1v68l-3-2z" fill="#5cc7b8" opacity="0.7" />
          <rect x="24" y="46" width="24" height="28" rx="3" fill="#f2fbf7" />
          <path d="M36 52q6 5 0 12q-6-7 0-12" fill="#178a52" />
        </svg>
      );
    case "AMLA_KIDS":
      return (
        <svg {...common} aria-label="Amla Kids haircare (illustration)">
          <ellipse cx="36" cy="12" rx="9" ry="7" fill="#e0508f" />
          <path d="M22 22h28c4 8 6 14 6 24v34a12 12 0 0 1-12 12H28a12 12 0 0 1-12-12V46c0-10 2-16 6-24z" fill="#f27ab0" />
          <rect x="22" y="48" width="28" height="28" rx="6" fill="#fdf0f6" />
          <circle cx="30" cy="60" r="4.5" fill="#78a832" />
          <circle cx="42" cy="60" r="4.5" fill="#e0508f" />
          <path d="M28 68q8 6 16 0" stroke="#c22d6d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "VATIKA_MENZ":
      return (
        <svg {...common} viewBox="0 0 84 96" aria-label="Vatika Menz styling paste (illustration)">
          <path d="M14 30c0-5 56-5 56 0v6H14z" fill="#9aa0a6" />
          <path d="M12 36h60v40a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="#2b2f33" />
          <rect x="18" y="46" width="48" height="22" rx="4" fill="#41474d" />
          <path d="M24 57h20" stroke="#e8e0d0" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 57h10" stroke="#16a08c" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "HERBOLENE":
      return (
        <svg {...common} viewBox="0 0 84 96" aria-label="Herbolene aloe jelly (illustration)">
          <path d="M16 28c0-5 52-5 52 0v6H16z" fill="#d7e8b0" />
          <path d="M14 34h56v40a12 12 0 0 1-12 12H26a12 12 0 0 1-12-12z" fill="#4c9e3f" />
          <rect x="20" y="44" width="44" height="24" rx="4" fill="#f2f8e6" />
          <path d="M34 50c-5 6-5 10 0 14 5-4 5-8 0-14M46 50c-5 6-5 10 0 14 5-4 5-8 0-14" fill="#4c9e3f" />
        </svg>
      );
    case "DABUR_MISWAK":
      return (
        <svg {...common} viewBox="0 0 84 96" aria-label="Dabur Miswak toothpaste (illustration)">
          <rect x="36" y="6" width="12" height="10" rx="2" fill="#8a5a2b" />
          <path d="M30 16h24l6 60c0 6-4 10-9 10H33c-5 0-9-4-9-10z" fill="#f6efdc" />
          <path d="M30 16h24l1.5 15h-27z" fill="#b3392f" />
          <rect x="30" y="44" width="24" height="22" rx="3" fill="#8a5a2b" opacity="0.9" />
          <path d="M36 50l12 10M48 50L36 60" stroke="#f6efdc" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "DERMOVIVA":
      return (
        <svg {...common} aria-label="Dermoviva skin care (illustration)">
          <path d="M32 4h8l6 8-4 6H30l-4-6z" fill="#8fb6c9" />
          <path d="M24 18h24c3 9 5 15 5 24v40a8 8 0 0 1-8 8H27a8 8 0 0 1-8-8V42c0-9 2-15 5-24z" fill="#f4f8fa" stroke="#c9dbe4" strokeWidth="1.5" />
          <path d="M36 40c-7 9-7 15 0 20 7-5 7-11 0-20" fill="#3aa3d9" />
          <rect x="26" y="66" width="20" height="6" rx="3" fill="#3aa3d9" opacity="0.5" />
        </svg>
      );
  }
}
