import { describe, it, expect } from "vitest";
import { generateHarmony, HARMONIES } from "@/lib/color/harmony";
import {
  compareColors,
  contrastRatio,
  describeBalance,
} from "@/lib/color/compatibility";
import { hslPixel } from "@/lib/color/picker";
import { normalizeColor, colorFromHex } from "@/lib/color/conversion";
describe("exploration science", () => {
  it("uses known WCAG reference ratios and rejects unsupported inputs", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBe(21);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.478089, 5);
    expect(contrastRatio("rgba(0,0,0,0.5)", "#FFFFFF")).toBeNull();
    expect(compareColors("bad", "#000000")).toBeNull();
    expect(compareColors("#123456", "#123456")?.distance).toBe(0);
    expect(compareColors("#000000", "#FFFFFF")?.distance).toBeCloseTo(1, 6);
    expect(compareColors("#808080", "#FF0000")?.hueDifference).toBeNull();
  });
  it("generates six deterministic hue relationships, wraps and removes duplicates", () => {
    for (const kind of HARMONIES) {
      const a = generateHarmony("#5479B8", kind);
      expect(a).toEqual(generateHarmony("#5479B8", kind));
      expect(a.candidates.length).toBeGreaterThan(0);
      expect(new Set(a.candidates.map((c) => c.hex)).size).toBe(
        a.candidates.length,
      );
      for (const c of a.candidates) expect(normalizeColor(c.hex).ok).toBe(true);
    }
    const result = generateHarmony(
      { mode: "oklch", l: 0.65, c: 0.08, h: 350 },
      "Analogous",
    );
    expect(result.candidates.map((c) => Math.round(c.requested.h!))).toEqual([
      320, 20,
    ]);
    expect(generateHarmony("#808080", "Complementary").candidates).toHaveLength(
      0,
    );
    expect(
      generateHarmony("#000000", "Monochromatic").candidates.length,
    ).toBeGreaterThan(0);
    expect(
      generateHarmony("#FFFFFF", "Monochromatic").candidates.length,
    ).toBeGreaterThan(0);
    expect(generateHarmony("invalid", "Triadic").candidates).toHaveLength(0);
    const vivid = generateHarmony("#FF0000", "Tetradic");
    expect(vivid.candidates.some((c) => c.gamutAdjusted)).toBe(true);
    expect(describeBalance(["#000000", "#FFFFFF", "#808080"])).toMatchObject({
      light: 1,
      midtone: 1,
      dark: 1,
      muted: 3,
    });
  });
  it("renders HSL pixel coordinates consistently at edges and interiors", () => {
    expect(hslPixel(0, 1, 0.5)).toEqual([255, 0, 0]);
    expect(hslPixel(120, 1, 0.5)).toEqual([0, 255, 0]);
    expect(hslPixel(240, 0, 0.5)).toEqual([128, 128, 128]);
    expect(hslPixel(218, 0.4, 1)).toEqual([255, 255, 255]);
    expect(hslPixel(218, 0.4, 0)).toEqual([0, 0, 0]);
    for (const [h, s, l] of [
      [218, 0.4, 0.53],
      [30, 0.8, 0.2],
      [330, 0.2, 0.8],
    ]) {
      const result = normalizeColor({ mode: "hsl", h, s, l });
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(hslPixel(h, s, l)).toEqual(
          Object.values(colorFromHex(result.value.hex).rgb)
            .slice(1)
            .map((v) => Math.round(Number(v) * 255)),
        );
    }
  });
});
