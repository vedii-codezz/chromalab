import { converter } from "culori";
import type {
  EngineResult,
  GamutMappedColor,
  OklchColor,
  RgbColor,
} from "@/types/color";
import { diagnostic, failure, success } from "./diagnostics";
import { validateColorInput } from "./validation";

const toRgb = converter("rgb");
const RGB_EPSILON = 1e-7;
const bounded = (x: number) => Math.max(0, Math.min(1, x));

function withinGamut(rgb: RgbColor): boolean {
  return [rgb.r, rgb.g, rgb.b].every(
    (v) => Number.isFinite(v) && v >= -RGB_EPSILON && v <= 1 + RGB_EPSILON,
  );
}

/** Fixed-L/H chroma bisection, with only floating-point channel excursions bounded. */
export function mapToSrgb(color: OklchColor): EngineResult<GamutMappedColor> {
  const valid = validateColorInput(color);
  if (!valid.ok) return failure(valid.errors);
  if (valid.value.mode !== "oklch")
    return failure([
      diagnostic(
        "INVALID_COLOR_INPUT",
        "error",
        "Gamut mapping requires an OKLCH color.",
      ),
    ]);
  const requested: OklchColor = {
    ...valid.value,
    h: valid.value.c === 0 ? null : valid.value.h,
  };
  const convert = (c: OklchColor): RgbColor => toRgb({ ...c, h: c.h ?? 0 });
  let mapped = requested;
  let rgb: RgbColor;
  let adjusted = false;
  if (requested.l === 0 || requested.l === 1) {
    mapped = { ...requested, c: 0, h: null };
    rgb = { mode: "rgb", r: requested.l, g: requested.l, b: requested.l };
    adjusted = requested.c > 0;
  } else {
    rgb = convert(requested);
    if (!withinGamut(rgb)) {
      let low = 0;
      let high = requested.c;
      for (let iteration = 0; iteration < 32; iteration++) {
        const c = (low + high) / 2;
        if (withinGamut(convert({ ...requested, c }))) low = c;
        else high = c;
      }
      mapped = { ...requested, c: low };
      rgb = convert(mapped);
      adjusted = true;
    }
    rgb = {
      mode: "rgb",
      r: bounded(rgb.r),
      g: bounded(rgb.g),
      b: bounded(rgb.b),
    };
  }
  const warnings = adjusted
    ? [
        diagnostic(
          "GAMUT_ADJUSTED",
          "warning",
          "Reduced OKLCH chroma to fit sRGB while retaining lightness and hue (powerless at black/white).",
          {
            details: {
              lightness: requested.l,
              originalChroma: requested.c,
              mappedChroma: mapped.c,
            },
          },
        ),
      ]
    : [];
  return success({ requested, mapped, rgb, adjusted }, warnings);
}
