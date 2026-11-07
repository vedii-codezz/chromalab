// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeColor } from "@/lib/color/conversion";

describe("strict color normalization", () => {
  it.each([
    ["#abc", "#AABBCC"],
    [" #aBcDeF ", "#ABCDEF"],
    ["rgb(255, 0, 0)", "#FF0000"],
    ["RGB(100% 0% 0%)", "#FF0000"],
    ["rgb(0 128 255)", "#0080FF"],
    ["hsl(120, 100%, 50%)", "#00FF00"],
    ["hsl(-240deg 100% 50%)", "#00FF00"],
    ["oklch(100% 0 0)", "#FFFFFF"],
    ["oklch(0 0 180)", "#000000"],
    [{ mode: "rgb", r: 1, g: 0, b: 0 }, "#FF0000"],
    [{ mode: "rgb", r: 0, g: 0, b: 0.5 }, "#000080"],
    ["rgb(0 0 127.5)", "#000080"],
    ["hsl(240 100% 25%)", "#000080"],
    [{ mode: "hsl", h: 480, s: 1, l: 0.5 }, "#00FF00"],
    [{ mode: "oklch", l: 0, c: 0, h: 90 }, "#000000"],
    [{ mode: "oklch", l: 0, c: 0, h: null }, "#000000"],
    [{ mode: "hsl", h: null, s: 0, l: 0.5 }, "#808080"],
  ])("normalizes %j to %s", (input, hex) => {
    const result = normalizeColor(input);
    expect(result.ok).toBe(true);
    expect(result.value?.hex).toBe(hex);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    "",
    "red",
    "#12",
    "#abcd",
    "#12345678",
    "#12GG00",
    "#123456 trailing",
    "rgb(256 0 0)",
    "rgb(-1 0 0)",
    "rgb(0, 0 0)",
    "rgb(0,,0)",
    "rgb(0 0)",
    "rgb(1 0% 0)",
    "rgb(101% 0% 0%)",
    "rgba(0,0,0,1)",
    "rgb(0 0 0 / 1)",
    "hsl(120 50 50)",
    "hsl(120 101% 50%)",
    "hsl(120 50% -1%)",
    "hsl(1turn 50% 50%)",
    "oklch(1.1 0 0)",
    "oklch(0.5 -0.2 100)",
    "oklch(0.5 1.1 100)",
    "oklch(50% 0.2)",
    "oklch(NaN 0 0)",
    "rgb(1e999 0 0)",
    null,
    undefined,
    42,
    [],
    {},
    { mode: "rgb", r: 255, g: 0, b: 0 },
    { mode: "rgb", r: NaN, g: 0, b: 0 },
    { mode: "rgb", r: 0, g: 0 },
    { mode: "hsl", h: 0, s: 1, l: Infinity },
    { mode: "oklch", l: 0.5, c: 0.2 },
    { mode: "rgb", r: 0, g: 0, b: 0, alpha: 1 },
    { mode: "oklch", l: 0.5, c: 0.2, h: null },
    { mode: "hsl", h: null, s: 0.5, l: 0.5 },
  ])("rejects malformed or unsupported input %j", (input) => {
    const result = normalizeColor(input);
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors[0]).toMatchObject({
      code: "INVALID_COLOR_INPUT",
      severity: "error",
    });
    expect(result.errors[0]?.message.length).toBeGreaterThan(15);
  });

  it("makes achromatic hue explicit and exposes actual display representations", () => {
    const result = normalizeColor("#808080");
    expect(result.ok).toBe(true);
    expect(result.value?.oklch.h).toBeNull();
    expect(result.value?.oklch.c).toBe(0);
    expect(result.value?.hsl.h).toBeNull();
    expect(result.value?.rgb.r).toBeCloseTo(128 / 255, 12);
    expect(result.value?.oklch.l).toBeCloseTo(0.59987, 4);
  });

  it("accepts its own normalized representations without changing color identity", () => {
    for (const hex of ["#000000", "#FFFFFF", "#808080", "#0000FF", "#ABCDEF"]) {
      const normalized = normalizeColor(hex).value!;
      for (const representation of [
        normalized.rgb,
        normalized.hsl,
        normalized.oklch,
      ]) {
        expect(normalizeColor(representation).value?.hex).toBe(hex);
      }
    }
  });
});
