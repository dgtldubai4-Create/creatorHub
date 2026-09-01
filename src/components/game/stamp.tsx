import { cn } from "@/lib/utils";

/**
 * A rubber stamp. `tone` follows the system rule: green = official/approved,
 * red = returned, orange = bonus moments. `slam` plays the entrance animation.
 */
export function Stamp({
  children,
  tone = "green",
  rotate = -6,
  slam = false,
  shape = "box",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "orange";
  rotate?: number;
  slam?: boolean;
  shape?: "box" | "round";
  className?: string;
}) {
  const tones = {
    green: "border-dabur-600 text-dabur-700",
    red: "border-stampred text-stampred",
    orange: "border-tang text-tang-deep",
  };
  return (
    <span
      className={cn(
        "stamped inline-grid place-items-center border-[2.5px] text-center text-xs leading-tight opacity-85",
        shape === "round" ? "aspect-square rounded-full p-2" : "rounded px-2.5 py-1",
        tones[tone],
        slam && "animate-stamp-slam",
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)`, ["--stamp-rot" as string]: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}
