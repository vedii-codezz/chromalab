import {
  SHADE_IDS,
  type ColorInput,
  type EngineResult,
  type ParsedColor,
  type ResolvedTonalOptions,
  type ShadeId,
} from "@/types/color";
import { diagnostic, failure, success } from "./diagnostics";

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
export const wrapHue = (h: number) => ((h % 360) + 360) % 360;
export const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
export const inRange = (
  value: unknown,
  min: number,
  max: number,
): value is number => finite(value) && value >= min && value <= max;
const isRecord = (input: unknown): input is Record<string, unknown> =>
  !!input &&
  typeof input === "object" &&
  !Array.isArray(input) &&
  (Object.getPrototypeOf(input) === Object.prototype ||
    Object.getPrototypeOf(input) === null);

function invalid(message: string, field?: string): EngineResult<ParsedColor> {
  return failure([
    diagnostic("INVALID_COLOR_INPUT", "error", message, { field }),
  ]);
}

function numeric(token: string): number {
  return NUMBER.test(token) ? Number(token) : NaN;
}

/** Parse only the documented opaque subset; Culori/CSS parsers may clamp invalid values. */
export function validateColorInput(input: unknown): EngineResult<ParsedColor> {
  if (typeof input === "string") {
    const text = input.trim();
    if (/^#[\da-f]{3}$/i.test(text)) {
      return success({
        mode: "hex",
        hex: `#${text
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
          .toUpperCase()}`,
      });
    }
    if (/^#[\da-f]{6}$/i.test(text))
      return success({ mode: "hex", hex: text.toUpperCase() as `#${string}` });
    const match = /^(rgb|hsl|oklch)\(([^()]*)\)$/i.exec(text);
    if (!match)
      return invalid(
        "Use #RGB, #RRGGBB, rgb(), hsl(), or oklch() without alpha channels.",
      );
    const mode = match[1].toLowerCase();
    const body = match[2].trim();
    const comma = body.includes(",");
    if (comma && mode === "oklch")
      return invalid("OKLCH requires three space-separated channels.");
    const channels = comma
      ? body.split(",").map((s) => s.trim())
      : body.split(/\s+/);
    if (channels.length !== 3 || channels.some((s) => !s || /\s/.test(s)))
      return invalid(
        "Exactly three channels are required; do not mix commas and spaces.",
      );
    if (mode === "rgb") {
      const percentages = channels.map((c) => c.endsWith("%"));
      if (percentages.some(Boolean) && !percentages.every(Boolean))
        return invalid(
          "RGB channels must all use numbers or all use percentages.",
        );
      const max = percentages[0] ? 100 : 255;
      const values = channels.map((c) =>
        numeric(percentages[0] ? c.slice(0, -1) : c),
      );
      if (!values.every((v) => inRange(v, 0, max)))
        return invalid(
          `RGB channels must be finite numbers between 0 and ${max}.`,
          "rgb",
        );
      return success({
        mode: "rgb",
        r: values[0] / max,
        g: values[1] / max,
        b: values[2] / max,
      });
    }
    const hue = numeric(channels[mode === "hsl" ? 0 : 2].replace(/deg$/i, ""));
    if (mode === "hsl") {
      if (!channels[1].endsWith("%") || !channels[2].endsWith("%"))
        return invalid(
          "HSL saturation and lightness require percentages.",
          "hsl",
        );
      return validateColorInput({
        mode,
        h: hue,
        s: numeric(channels[1].slice(0, -1)) / 100,
        l: numeric(channels[2].slice(0, -1)) / 100,
      });
    }
    const percent = channels[0].endsWith("%");
    return validateColorInput({
      mode,
      l:
        numeric(percent ? channels[0].slice(0, -1) : channels[0]) /
        (percent ? 100 : 1),
      c: numeric(channels[1]),
      h: hue,
    });
  }
  if (!isRecord(input))
    return invalid(
      "Color must be a supported string or a typed rgb, hsl, or oklch object.",
    );
  const record = input as Record<string, unknown>;
  const keys =
    record.mode === "rgb"
      ? ["mode", "r", "g", "b"]
      : record.mode === "hsl"
        ? ["mode", "h", "s", "l"]
        : record.mode === "oklch"
          ? ["mode", "l", "c", "h"]
          : [];
  if (
    !keys.length ||
    Object.keys(record).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(record, k))
  )
    return invalid(
      "Color object must contain exactly mode and its three channels; alpha and unknown keys are unsupported.",
    );
  if (record.mode === "rgb") {
    if (![record.r, record.g, record.b].every((v) => inRange(v, 0, 1)))
      return invalid(
        "Typed RGB channels must be finite fractions between 0 and 1.",
        "rgb",
      );
    return success({
      mode: "rgb",
      r: record.r as number,
      g: record.g as number,
      b: record.b as number,
    });
  }
  const powerless =
    (record.mode === "hsl" && record.s === 0) ||
    (record.mode === "oklch" && record.c === 0);
  if (!finite(record.h) && !(record.h === null && powerless))
    return invalid(
      "Hue must be finite degrees, or null only for an achromatic color.",
      "h",
    );
  const h = record.h === null ? 0 : wrapHue(record.h as number);
  if (!inRange(record.l, 0, 1))
    return invalid("Lightness must be a finite fraction between 0 and 1.", "l");
  if (record.mode === "hsl") {
    if (!inRange(record.s, 0, 1))
      return invalid(
        "HSL saturation must be a finite fraction between 0 and 1.",
        "s",
      );
    return success({ mode: "hsl", h, s: record.s, l: record.l });
  }
  if (!inRange(record.c, 0, 1))
    return invalid(
      "Supported OKLCH chroma is a finite number between 0 and 1.",
      "c",
    );
  return success({ mode: "oklch", l: record.l, c: record.c, h });
}

export function validateTonalOptions(
  input: unknown,
): EngineResult<ResolvedTonalOptions> {
  const invalidOptions = (message: string, field: string) =>
    failure<ResolvedTonalOptions>([
      diagnostic("INVALID_OPTIONS", "error", message, { field }),
    ]);
  if (!isRecord(input))
    return invalidOptions(
      "Generation options must be a plain object.",
      "options",
    );
  if (
    Object.keys(input).some(
      (key) =>
        ![
          "anchor",
          "lightnessSpread",
          "chromaIntensity",
          "hueDrift",
          "locks",
        ].includes(key),
    )
  )
    return invalidOptions(
      "Generation options contain an unsupported property.",
      "options",
    );
  const anchor = input.anchor === undefined ? 500 : input.anchor;
  if (!SHADE_IDS.includes(anchor as ShadeId))
    return invalidOptions(
      "Anchor must be one of 50, 100, 200, 300, 400, 500, 600, 700, 800, 900.",
      "anchor",
    );
  const spread =
    input.lightnessSpread === undefined ? {} : input.lightnessSpread;
  if (
    !isRecord(spread) ||
    Object.keys(spread).some((key) => !["lighter", "darker"].includes(key))
  )
    return invalidOptions(
      "Lightness spread must contain only lighter/darker fractions.",
      "lightnessSpread",
    );
  const lighter = spread.lighter === undefined ? 0.9 : spread.lighter;
  const darker = spread.darker === undefined ? 0.85 : spread.darker;
  if (!inRange(lighter, 0, 1) || !inRange(darker, 0, 1))
    return invalidOptions(
      "Lightness spread fractions must be finite numbers between 0 and 1.",
      "lightnessSpread",
    );
  const intensity =
    input.chromaIntensity === undefined ? 1 : input.chromaIntensity;
  if (!inRange(intensity, 0, 2))
    return invalidOptions(
      "Chroma intensity must be a finite number between 0 and 2.",
      "chromaIntensity",
    );
  const drift = input.hueDrift === undefined ? 0 : input.hueDrift;
  if (!inRange(drift, -30, 30))
    return invalidOptions(
      "Hue drift must be a finite degree offset between -30 and 30.",
      "hueDrift",
    );
  const locks = input.locks === undefined ? {} : input.locks;
  if (
    !isRecord(locks) ||
    Object.keys(locks).some(
      (key) => !SHADE_IDS.some((id) => String(id) === key),
    )
  )
    return invalidOptions(
      "Locked shade keys must be valid shade identifiers.",
      "locks",
    );
  return success({
    anchor: anchor as ShadeId,
    lightnessSpread: { lighter, darker },
    chromaIntensity: intensity,
    hueDrift: drift,
    locks: { ...locks } as Partial<Record<ShadeId, ColorInput>>,
  });
}
