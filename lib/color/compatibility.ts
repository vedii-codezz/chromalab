import { converter } from "culori";
import { normalizeColor } from "./conversion";
const toLab = converter("oklab");
function luminance(input: unknown): number | null {
  const c = normalizeColor(input);
  if (!c.ok) return null;
  const linear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const { r, g, b } = c.value.rgb;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}
/** WCAG 2.2 relative luminance for opaque, normalized 8-bit sRGB. */
export function contrastRatio(
  foreground: unknown,
  background: unknown,
): number | null {
  const a = luminance(foreground),
    b = luminance(background);
  return a === null || b === null
    ? null
    : (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function compareColors(a: unknown, b: unknown) {
  const first = normalizeColor(a),
    second = normalizeColor(b);
  if (!first.ok || !second.ok) return null;
  const x = first.value.oklch,
    y = second.value.oklch;
  const labA = toLab(first.value.hex)!,
    labB = toLab(second.value.hex)!;
  const angle =
    x.h === null || y.h === null || x.c < 0.01 || y.c < 0.01
      ? null
      : Math.abs(x.h - y.h);
  const hueDifference = angle === null ? null : Math.min(angle, 360 - angle);
  const distance = Math.hypot(
    labA.l - labB.l,
    labA.a - labB.a,
    labA.b - labB.b,
  );
  const lightnessDifference = Math.abs(x.l - y.l);
  const relationship =
    hueDifference === null
      ? "Hue undefined at low chroma"
      : Math.abs(hueDifference - 180) <= 15
        ? "Complementary hue relationship"
        : hueDifference <= 30
          ? "Similar hue relationship"
          : "Distinct hue relationship";
  return {
    ratio: contrastRatio(first.value.hex, second.value.hex)!,
    distance,
    hueDifference,
    lightnessDifference,
    chromaDifference: Math.abs(x.c - y.c),
    first: x,
    second: y,
    relationship,
    separation: distance < 0.08 ? "Low visual separation" : "Distinct colors",
    lightness:
      lightnessDifference < 0.1
        ? "Similar lightness values"
        : "Different lightness values",
  };
}
/** Descriptive Studio bins, not universal standards of palette quality. */
export function describeBalance(inputs: unknown[]) {
  const counts = { light: 0, midtone: 0, dark: 0, highChroma: 0, muted: 0 };
  for (const input of inputs) {
    const result = normalizeColor(input);
    if (!result.ok) continue;
    const { l, c } = result.value.oklch;
    counts[l >= 0.75 ? "light" : l < 0.4 ? "dark" : "midtone"]++;
    if (c >= 0.15) counts.highChroma++;
    if (c < 0.06) counts.muted++;
  }
  return counts;
}
