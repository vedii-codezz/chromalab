import { normalizeColor } from "./conversion";
import { wrapHue } from "./validation";
import type { HexColor, OklchColor } from "@/types/color";
export const HARMONIES = [
  "Complementary",
  "Analogous",
  "Triadic",
  "Split-complementary",
  "Tetradic",
  "Monochromatic",
] as const;
export type HarmonyKind = (typeof HARMONIES)[number];
export type HarmonyCandidate = {
  hex: HexColor;
  requested: OklchColor;
  gamutAdjusted: boolean;
};
/** OKLCH hue relationships: an exploration convention, never an aesthetic verdict. */
export function generateHarmony(
  input: unknown,
  kind: HarmonyKind,
): { candidates: HarmonyCandidate[]; note: string } {
  const base = normalizeColor(input);
  if (!base.ok) return { candidates: [], note: "Choose a valid opaque color." };
  const source = base.value.oklch;
  if (kind !== "Monochromatic" && (source.h === null || source.c < 0.01))
    return {
      candidates: [],
      note: "Hue is not meaningful at this chroma. Try monochromatic lightness variations.",
    };
  const offsets: Record<HarmonyKind, number[]> = {
    Complementary: [180],
    Analogous: [-30, 30],
    Triadic: [120, 240],
    "Split-complementary": [150, 210],
    Tetradic: [90, 180, 270],
    Monochromatic: [-0.22, -0.11, 0.11, 0.22],
  };
  const seen = new Set([base.value.hex]);
  const candidates: HarmonyCandidate[] = [];
  for (const offset of offsets[kind] ?? []) {
    const requested: OklchColor = {
      ...source,
      l:
        kind === "Monochromatic"
          ? Math.max(0.04, Math.min(0.96, source.l + offset))
          : source.l,
      h:
        source.h === null
          ? null
          : wrapHue(source.h + (kind === "Monochromatic" ? 0 : offset)),
    };
    const result = normalizeColor(requested);
    if (!result.ok || seen.has(result.value.hex)) continue;
    seen.add(result.value.hex);
    candidates.push({
      hex: result.value.hex,
      requested,
      gamutAdjusted: result.warnings.some((w) => w.code === "GAMUT_ADJUSTED"),
    });
  }
  return {
    candidates,
    note: "OKLCH hue relationships with fixed lightness/chroma; monochromatic varies lightness. Chroma reduces where needed to fit sRGB. Mathematical relationships do not guarantee visual quality.",
  };
}
