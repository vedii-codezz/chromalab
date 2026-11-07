// @vitest-environment node
import { converter, displayable } from "culori";
import { describe, expect, it } from "vitest";
import { generateTonalScale } from "@/lib/color/tonal-scale";
import { normalizeColor } from "@/lib/color/conversion";
import {
  SHADE_IDS,
  type ColorInput,
  type TonalScaleOptions,
} from "@/types/color";

const lightness = (hex: string) => converter("oklch")(hex)!.l;
const examples = [
  "#FFFFFF",
  "#000000",
  "#808080",
  "#0000FF",
  "#FF0000",
  "#00FF00",
  "#FFFFFE",
  "#010102",
  "#8C8D8E",
  "#5479B8",
];

describe("ten-step tonal generation", () => {
  it.each(examples)(
    "generates valid ordered display colors from %s",
    (base) => {
      const result = generateTonalScale(base);
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
      const shades = result.value!.shades;
      expect(shades.map((s) => s.id)).toEqual([
        50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
      ]);
      expect(shades).toHaveLength(10);
      expect(shades.filter((s) => s.anchor)).toHaveLength(1);
      expect(shades.find((s) => s.id === 500)?.hex).toBe(base);
      for (const [index, shade] of shades.entries()) {
        expect(shade.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(displayable(shade.hex)).toBe(true);
        expect(Number.isFinite(shade.oklch.l)).toBe(true);
        expect(Number.isFinite(shade.oklch.c)).toBe(true);
        expect(shade.oklch.l).toBeGreaterThanOrEqual(0);
        expect(shade.oklch.l).toBeLessThanOrEqual(1);
        if (index)
          expect(lightness(shade.hex)).toBeLessThanOrEqual(
            lightness(shades[index - 1].hex) + 1e-6,
          );
      }
    },
  );

  it.each(SHADE_IDS)(
    "preserves the normalized anchor exactly at %s",
    (anchor) => {
      for (const base of [
        "#abc",
        "rgb(84, 121, 184)",
        "hsl(218 41% 53%)",
        "oklch(65% 0.6 250)",
      ]) {
        const result = generateTonalScale(base, {
          anchor,
          chromaIntensity: 2,
          hueDrift: 30,
        });
        expect(result.ok).toBe(true);
        expect(result.value!.shades.find((s) => s.id === anchor)?.hex).toBe(
          normalizeColor(base).value!.hex,
        );
      }
    },
  );

  it("keeps neutral families neutral even with hue drift", () => {
    const result = generateTonalScale("#808080", {
      hueDrift: 30,
      chromaIntensity: 2,
    });
    expect(result.ok).toBe(true);
    for (const shade of result.value!.shades) {
      const rgb = converter("rgb")(shade.hex)!;
      expect(rgb.r).toBe(rgb.g);
      expect(rgb.g).toBe(rgb.b);
      expect(shade.oklch.h).toBeNull();
    }
  });

  it("uses the documented smoothstep lightness curve and taper, not RGB interpolation", () => {
    const result = generateTonalScale("#5479B8");
    const shades = result.value!.shades;
    const baseL = result.value!.base.oklch.l;
    const lightL = baseL + (1 - baseL) * 0.9;
    expect(shades[0].requested.l).toBeCloseTo(lightL, 12);
    expect(shades[9].requested.l).toBeCloseTo(baseL * 0.15, 12);
    // Index 2 lies 2/5 of the way between shade 50 and anchor 500.
    expect(shades[2].requested.l).toBeCloseTo(
      lightL + (baseL - lightL) * 0.352,
      12,
    );
    expect(shades[0].requested.c).toBeLessThan(result.value!.base.oklch.c);
    expect(shades[9].requested.c).toBeLessThan(result.value!.base.oklch.c);
  });

  it("honors settings while bypassing the anchor", () => {
    const zero = generateTonalScale("#5479B8", {
      chromaIntensity: 0,
      lightnessSpread: { lighter: 0.5, darker: 0.5 },
    });
    const full = generateTonalScale("#5479B8", {
      chromaIntensity: 2,
      hueDrift: -30,
    });
    expect(zero.ok).toBe(true);
    expect(full.ok).toBe(true);
    expect(zero.value!.shades[0].requested.l).toBeLessThan(
      full.value!.shades[0].requested.l,
    );
    expect(zero.value!.shades[9].requested.l).toBeGreaterThan(
      full.value!.shades[9].requested.l,
    );
    for (const shade of zero.value!.shades.filter((s) => !s.anchor))
      expect(shade.requested.c).toBe(0);
    const baseHue = full.value!.base.oklch.h!;
    for (const shade of full.value!.shades) {
      const delta = ((shade.requested.h! - baseHue + 540) % 360) - 180;
      expect(Math.abs(delta)).toBeLessThanOrEqual(30.000001);
    }
    expect(full.value!.shades[0].requested.h).toBeCloseTo(baseHue + 30, 10);
    expect(full.value!.shades[5].hex).toBe("#5479B8");
  });

  it.each(["#FFFFFF", "#000000"])(
    "reports unavoidable duplicates at %s without nudging the anchor",
    (base) => {
      const result = generateTonalScale(base);
      expect(result.ok).toBe(true);
      const duplicate = result.warnings.find(
        (d) => d.code === "DUPLICATE_SHADE",
      );
      expect(duplicate?.shades).toContain(500);
      expect(duplicate?.shades!.length).toBeGreaterThan(1);
    },
  );

  it("reports duplicate colors when spread and chroma are zero", () => {
    const result = generateTonalScale("#808080", {
      lightnessSpread: { lighter: 0, darker: 0 },
    });
    expect(result.ok).toBe(true);
    expect(new Set(result.value!.shades.map((s) => s.hex)).size).toBe(1);
    expect(
      result.warnings.find((d) => d.code === "DUPLICATE_SHADE")?.shades,
    ).toEqual(SHADE_IDS);
  });

  it("reports gamut changes for saturated generated shades", () => {
    const result = generateTonalScale("#0000FF", { chromaIntensity: 2 });
    expect(result.ok).toBe(true);
    expect(
      result.warnings.some(
        (d) => d.code === "GAMUT_ADJUSTED" && d.shades?.length,
      ),
    ).toBe(true);
  });

  it("checks actual HEX lightness when ordered targets quantize into an inversion", () => {
    const result = generateTonalScale("#5479B8", {
      lightnessSpread: { lighter: 0, darker: 0 },
      chromaIntensity: 2,
    });
    expect(result.ok).toBe(true);
    const shades = result.value!.shades;
    expect(
      shades.every((shade) => shade.requested.l === result.value!.base.oklch.l),
    ).toBe(true);
    const inversion = shades.findIndex(
      (shade, i) =>
        i > 0 && lightness(shade.hex) > lightness(shades[i - 1].hex) + 1e-6,
    );
    expect(inversion).toBeGreaterThan(0);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: "LIGHTNESS_ORDER_CONFLICT",
        severity: "warning",
        shades: [shades[inversion - 1].id, shades[inversion].id],
      }),
    );
  });

  it("is deterministic and does not mutate input colors, locks, or settings", () => {
    const base = Object.freeze({
      mode: "rgb" as const,
      r: 0.2,
      g: 0.4,
      b: 0.7,
    });
    const options = Object.freeze({
      anchor: 400 as const,
      lightnessSpread: Object.freeze({ lighter: 0.8, darker: 0.9 }),
      locks: Object.freeze({ 100: "#EEEEEE", 800: "#222222" }),
      hueDrift: 12,
    });
    const first = generateTonalScale(base, options);
    expect(first.ok).toBe(true);
    expect(generateTonalScale(base, options)).toEqual(first);
    expect(options.locks[100]).toBe("#EEEEEE");
    expect(base.r).toBe(0.2);
  });

  it("maintains default ordering over a deterministic RGB grid", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 1])
      for (const g of [0, 0.5, 1])
        for (const b of [0, 0.5, 1]) {
          const result = generateTonalScale({ mode: "rgb", r, g, b });
          expect(result.ok).toBe(true);
          expect(
            result.warnings.filter(
              (d) => d.code === "LIGHTNESS_ORDER_CONFLICT",
            ),
          ).toEqual([]);
          const values = result.value!.shades.map((s) => lightness(s.hex));
          for (let i = 1; i < values.length; i++)
            expect(values[i]).toBeLessThanOrEqual(values[i - 1] + 1e-6);
        }
  });
});

describe("locked shades", () => {
  it("preserves normalized locks across base and setting changes and interpolates around them", () => {
    const locks = Object.freeze({ 100: "#eee", 700: "#343434" });
    for (const base of ["#5479B8", "#FF0000", "#808080"]) {
      const result = generateTonalScale(base, {
        locks,
        chromaIntensity: 1.5,
        hueDrift: 20,
      });
      expect(result.ok).toBe(true);
      expect(result.value!.shades.find((s) => s.id === 100)).toMatchObject({
        hex: "#EEEEEE",
        locked: true,
      });
      expect(result.value!.shades.find((s) => s.id === 700)).toMatchObject({
        hex: "#343434",
        locked: true,
      });
      expect(
        result.warnings.filter((d) => d.code === "LIGHTNESS_ORDER_CONFLICT"),
      ).toEqual([]);
    }
  });

  it("allows the anchor lock when it normalizes to the same color", () => {
    const result = generateTonalScale("#ABCDEF", {
      locks: { 500: "rgb(171 205 239)" },
    });
    expect(result.ok).toBe(true);
    expect(result.value!.shades[5]).toMatchObject({
      hex: "#ABCDEF",
      anchor: true,
      locked: true,
    });
  });

  it("rejects a different locked anchor without choosing base or lock", () => {
    const result = generateTonalScale("#5479B8", { locks: { 500: "#000000" } });
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors[0]).toMatchObject({
      code: "ANCHOR_CONFLICT",
      severity: "error",
      shades: [500],
    });
  });

  it("keeps contradictory locks exactly and reports both pinned and display order conflicts", () => {
    const result = generateTonalScale("#5479B8", {
      locks: { 100: "#111111", 200: "#FFFFFF" },
    });
    expect(result.ok).toBe(false);
    expect(result.value!.shades.find((s) => s.id === 100)?.hex).toBe("#111111");
    expect(result.value!.shades.find((s) => s.id === 200)?.hex).toBe("#FFFFFF");
    expect(
      result.errors.some(
        (d) => d.code === "LOCKED_SHADE_CONFLICT" && d.shades?.includes(100),
      ),
    ).toBe(true);
    expect(
      result.warnings.some((d) => d.code === "LIGHTNESS_ORDER_CONFLICT"),
    ).toBe(true);
  });

  it("detects a lock whose lightness contradicts the anchor", () => {
    const result = generateTonalScale("#808080", { locks: { 100: "#000000" } });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (d) => d.code === "LOCKED_SHADE_CONFLICT" && d.shades?.includes(500),
      ),
    ).toBe(true);
    expect(result.value!.shades[1].hex).toBe("#000000");
  });

  it("rejects an out-of-gamut lock rather than altering it", () => {
    const result = generateTonalScale("#5479B8", {
      locks: { 100: "oklch(80% 0.6 250)" },
    });
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors.some((d) => d.code === "LOCKED_SHADE_CONFLICT")).toBe(
      true,
    );
  });

  it("preserves all ten locked colors without regenerating any", () => {
    const locks = {
      50: "#FAFAFA",
      100: "#EEEEEE",
      200: "#DDDDDD",
      300: "#CCCCCC",
      400: "#AAAAAA",
      500: "#808080",
      600: "#666666",
      700: "#444444",
      800: "#222222",
      900: "#111111",
    };
    const result = generateTonalScale("#808080", { locks });
    expect(result.ok).toBe(true);
    expect(
      result.value!.shades.every((s) => s.locked && s.hex === locks[s.id]),
    ).toBe(true);
  });
});

describe("engine boundary validation", () => {
  it.each([null, 123, "#nothex", "rgb(999 0 0)"])(
    "rejects invalid base %j",
    (base) => {
      const result = generateTonalScale(base);
      expect(result.ok).toBe(false);
      expect(result.value).toBeNull();
      expect(result.errors[0]?.code).toBe("INVALID_COLOR_INPUT");
    },
  );

  it.each([
    null,
    [],
    { anchor: 550 },
    { anchor: "500" },
    { hueDrift: 31 },
    { hueDrift: NaN },
    { chromaIntensity: -1 },
    { chromaIntensity: Infinity },
    { chromaIntensity: 2.1 },
    { lightnessSpread: 0.5 },
    { lightnessSpread: { lighter: -1 } },
    { lightnessSpread: { darker: 1.01 } },
    { lightnessSpread: { lighter: null } },
    { lightnessSpread: { spread: 0.5 } },
    { locks: [] },
    { locks: { 550: "#FFFFFF" } },
    { unexpected: true },
  ])("rejects malformed options %j", (options) => {
    const result = generateTonalScale("#5479B8", options as TonalScaleOptions);
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors[0]?.code).toBe("INVALID_OPTIONS");
  });

  it("rejects an invalid lock with its shade identifier", () => {
    const result = generateTonalScale("#5479B8", {
      locks: { 100: "#badhex" as ColorInput },
    });
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(
      result.errors.some(
        (d) => d.code === "INVALID_COLOR_INPUT" && d.shades?.[0] === 100,
      ),
    ).toBe(true);
    expect(result.errors.some((d) => d.code === "LOCKED_SHADE_CONFLICT")).toBe(
      true,
    );
  });
});
