/**
 * Vivid colour for each brand, for the interface only. The catalogue keeps its
 * own print colours; these are the screen versions: a lit gradient and the text
 * colour that sits on it.
 */
export interface Vivid { from: string; to: string; on: string; solid: string }

const WHITE = "#ffffff";
const V: Record<string, Vivid> = {
  squad: { from: "#1ec46a", to: "#006d34", on: WHITE, solid: "#0a9a4d" },
  vatika: { from: "#22c55e", to: "#067a3a", on: WHITE, solid: "#12a150" },
  "dabur-amla": { from: "#10b981", to: "#065f46", on: WHITE, solid: "#0b8f66" },
  "dabur-herbl": { from: "#19c3b0", to: "#0b6e66", on: WHITE, solid: "#0f9a8c" },
  meswak: { from: "#d99a3d", to: "#8a5518", on: WHITE, solid: "#b67a26" },
  "dabur-red": { from: "#ff5a4a", to: "#b01e17", on: WHITE, solid: "#e2372b" },
  real: { from: "#ffa826", to: "#f2600a", on: WHITE, solid: "#f58212" },
  hajmola: { from: "#ff7a3a", to: "#bf3a08", on: WHITE, solid: "#e85a1a" },
  fem: { from: "#f25aa6", to: "#a81f66", on: WHITE, solid: "#d83a8a" },
  "dabur-honey": { from: "#ffc533", to: "#e08a00", on: "#2a1800", solid: "#f2a40c" },
  chyawanprash: { from: "#c9303a", to: "#741217", on: WHITE, solid: "#a51f27" },
  odonil: { from: "#56b4f2", to: "#1f63ad", on: WHITE, solid: "#2f86d3" },
  dermoviva: { from: "#f79ab9", to: "#c24f80", on: WHITE, solid: "#e0709c" },
  saffron: { from: "#ffc24a", to: "#f08a00", on: "#2a1800", solid: "#ffa81f" },
  night: { from: "#3a3a44", to: "#0e0e11", on: WHITE, solid: "#1c1c21" },
  mist: { from: "#f4f4f6", to: "#d9d9e0", on: "#111114", solid: "#e6e6ea" },
};

export function vivid(id: string | null | undefined): Vivid {
  return (id && V[id]) || V.squad;
}

export function vividGradient(id: string | null | undefined, angle = 135): string {
  const v = vivid(id);
  return `linear-gradient(${angle}deg, ${v.from} 0%, ${v.to} 100%)`;
}
