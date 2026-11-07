// @vitest-environment node
import { expect, it } from "vitest";
import { converter, displayable } from "culori";
import { mapToSrgb } from "@/lib/color/gamut";
import { normalizeColor } from "@/lib/color/conversion";
import type { OklchColor } from "@/types/color";

it.each([0, 45, 120, 180, 250, 300, 359])(
  "reduces chroma at hue %s without shifting L or H",
  (h) => {
    const requested = { mode: "oklch" as const, l: 0.65, c: 0.6, h };
    const result = mapToSrgb(requested);
    expect(result.ok).toBe(true);
    expect(result.value?.adjusted).toBe(true);
    expect(result.value?.mapped.l).toBe(requested.l);
    expect(result.value?.mapped.h).toBe(requested.h);
    expect(result.value!.mapped.c).toBeGreaterThan(0);
    expect(result.value!.mapped.c).toBeLessThan(requested.c);
    expect(displayable(result.value!.rgb)).toBe(true);
    const recovered = converter("oklch")(result.value!.rgb);
    expect(recovered.l).toBeCloseTo(0.65, 6);
    expect(Math.abs(((recovered.h! - h + 540) % 360) - 180)).toBeLessThan(
      0.001,
    );
    expect(result.warnings[0]).toMatchObject({
      code: "GAMUT_ADJUSTED",
      severity: "warning",
    });
    // The search should approach the boundary, rather than arbitrarily desaturating.
    const beyond = converter("rgb")({
      ...requested,
      c: result.value!.mapped.c + 0.00001,
    });
    expect(displayable(beyond)).toBe(false);
  },
);

it.each([0, 1])("maps L=%s to an exact display endpoint", (l) => {
  const result = mapToSrgb({ mode: "oklch", l, c: 0.8, h: 45 });
  expect(result.value?.rgb).toEqual({ mode: "rgb", r: l, g: l, b: l });
  expect(result.value?.mapped.c).toBe(0);
});

it("normalizes out-of-gamut base colors with a structured warning", () => {
  const result = normalizeColor("oklch(65% 0.6 250)");
  expect(result.ok).toBe(true);
  expect(result.value?.hex).toMatch(/^#[0-9A-F]{6}$/);
  expect(result.value!.requested.c).toBe(0.6);
  expect(result.value!.oklch.c).toBeLessThan(0.3);
  expect(result.warnings.some((d) => d.code === "GAMUT_ADJUSTED")).toBe(true);
});

it("does not treat floating point excursions at a valid RGB boundary as gamut changes", () => {
  for (const hex of ["#0000FF", "#FF0000", "#00FF00", "#FFFFFF"]) {
    const result = normalizeColor(hex);
    expect(result.value?.hex).toBe(hex);
    expect(result.warnings).toEqual([]);
  }
});

it("rejects invalid direct gamut inputs rather than producing NaN", () => {
  for (const color of [
    { mode: "oklch" as const, l: NaN, c: 0, h: 0 },
    { mode: "oklch" as const, l: -0.1, c: 0.2, h: 0 },
    { mode: "oklch" as const, l: 0.5, c: 0.2, h: null },
  ]) {
    const result = mapToSrgb(color);
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors[0]?.code).toBe("INVALID_COLOR_INPUT");
  }
});

it("does not invent missing hue channels at the direct gamut boundary", () => {
  const result = mapToSrgb({ mode: "oklch", l: 0.5, c: 0.2 } as OklchColor);
  expect(result.ok).toBe(false);
  expect(result.value).toBeNull();
  expect(result.errors[0]?.code).toBe("INVALID_COLOR_INPUT");
});
