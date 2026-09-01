import type { Metadata } from "next";
import { Baloo_2, IBM_Plex_Mono, Special_Elite, Spectral } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const spectral = Spectral({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const baloo = Baloo_2({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-game",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-stamp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DaburStars · Creator Hub",
    template: "%s · DaburStars",
  },
  description:
    "DaburStars — Dabur's Middle East creator program. Earn miles and stamps on real campaigns, level from Scout to Ambassador, spend in the shop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${baloo.variable} ${plexMono.variable} ${specialElite.variable}`}
    >
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
