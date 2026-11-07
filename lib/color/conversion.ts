import { converter, formatHex } from "culori";
import type {
  EngineResult,
  HexColor,
  NormalizedColor,
  OklchColor,
} from "@/types/color";
import { failure, success } from "./diagnostics";
import { mapToSrgb } from "./gamut";
import { validateColorInput, wrapHue } from "./validation";

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toOklch = converter("oklch");
const NEUTRAL_EPSILON = 1e-7;

function explicitOklch(color: ReturnType<typeof toOklch>): OklchColor {
  const neutral = color!.c < NEUTRAL_EPSILON;
  return {
    mode: "oklch",
    l: Math.max(0, Math.min(1, color!.l)),
    c: neutral ? 0 : color!.c,
    h: neutral || color!.h === undefined ? null : wrapHue(color!.h),
  };
}

/** Internal trusted path: hex has already been validated or produced by Culori. */
export function colorFromHex(
  hex: HexColor,
  requested?: OklchColor,
): NormalizedColor {
  const rgb = toRgb(hex)!;
  const hsl = toHsl(rgb);
  const oklch = explicitOklch(toOklch(rgb));
  return {
    hex,
    rgb: { mode: "rgb", r: rgb.r, g: rgb.g, b: rgb.b },
    hsl: {
      mode: "hsl",
      h: hsl.s < NEUTRAL_EPSILON || hsl.h === undefined ? null : wrapHue(hsl.h),
      s: hsl.s,
      l: hsl.l,
    },
    oklch,
    requested: requested ?? oklch,
  };
}

/** Canonical identity is the mapped, rounded six-digit sRGB HEX, not CSS spelling. */
export function normalizeColor(input: unknown): EngineResult<NormalizedColor> {
  const validated = validateColorInput(input);
  if (!validated.ok) return failure(validated.errors);
  const parsed = validated.value;
  const source = parsed.mode === "hex" ? parsed.hex : parsed;
  const requested = explicitOklch(toOklch(source));
  // RGB/HSL are already sRGB. A perceptual round trip can flip exact half-byte ties.
  if (parsed.mode !== "oklch") {
    const hex = (
      parsed.mode === "hex"
        ? parsed.hex
        : formatHex(toRgb(source))!.toUpperCase()
    ) as HexColor;
    return success(colorFromHex(hex, requested));
  }
  const mapped = mapToSrgb(requested);
  if (!mapped.ok) return failure(mapped.errors);
  const hex = formatHex(mapped.value.rgb)!.toUpperCase() as HexColor;
  return success(colorFromHex(hex, requested), mapped.warnings);
}
