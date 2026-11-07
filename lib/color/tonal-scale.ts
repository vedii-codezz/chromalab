import { formatHex } from "culori";
import {
  SHADE_IDS,
  type ColorDiagnostic,
  type EngineResult,
  type HexColor,
  type NormalizedColor,
  type OklchColor,
  type ShadeId,
  type TonalScale,
  type TonalScaleOptions,
  type TonalShade,
} from "@/types/color";
import { colorFromHex, normalizeColor } from "./conversion";
import {
  diagnostic,
  diagnoseShades,
  failure,
  LIGHTNESS_EPSILON,
  success,
} from "./diagnostics";
import { mapToSrgb } from "./gamut";
import { validateTonalOptions, wrapHue } from "./validation";

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Pure generation. Exact normalized anchor/locks bypass all generation settings. */
export function generateTonalScale(
  base: unknown,
  options: TonalScaleOptions = {},
): EngineResult<TonalScale> {
  const normalized = normalizeColor(base);
  if (!normalized.ok) return failure(normalized.errors, normalized.warnings);
  const validated = validateTonalOptions(options);
  if (!validated.ok) return failure(validated.errors, normalized.warnings);
  const settings = validated.value;
  const errors: ColorDiagnostic[] = [];
  const warnings: ColorDiagnostic[] = normalized.warnings.map((d) => ({
    ...d,
    field: "base",
    shades: [settings.anchor],
  }));
  const anchorIndex = SHADE_IDS.indexOf(settings.anchor);
  const locks = new Map<ShadeId, NormalizedColor>();
  for (const id of SHADE_IDS) {
    if (!Object.hasOwn(settings.locks, id)) continue;
    const result = normalizeColor(settings.locks[id]);
    if (!result.ok) {
      errors.push(
        ...result.errors.map((d) => ({
          ...d,
          field: `locks.${id}`,
          shades: [id],
        })),
      );
      errors.push(
        diagnostic(
          "LOCKED_SHADE_CONFLICT",
          "error",
          "The locked shade is invalid and cannot be preserved.",
          { shades: [id] },
        ),
      );
    } else if (result.warnings.some((d) => d.code === "GAMUT_ADJUSTED")) {
      errors.push(
        diagnostic(
          "LOCKED_SHADE_CONFLICT",
          "error",
          "The locked color is outside sRGB; normalize it explicitly before locking to avoid silently changing it.",
          { shades: [id], field: `locks.${id}` },
        ),
      );
    } else locks.set(id, result.value);
  }
  if (errors.length) return failure(errors, warnings);
  const anchorLock = locks.get(settings.anchor);
  if (anchorLock && anchorLock.hex !== normalized.value.hex)
    return failure(
      [
        diagnostic(
          "ANCHOR_CONFLICT",
          "error",
          "The locked anchor differs from the requested base. Unlock it or use the locked color as the base.",
          {
            shades: [settings.anchor],
            details: {
              baseHex: normalized.value.hex,
              lockedHex: anchorLock.hex,
            },
          },
        ),
      ],
      warnings,
    );

  const pins = new Map<ShadeId, NormalizedColor>(locks);
  pins.set(settings.anchor, normalized.value);
  const fixed = SHADE_IDS.flatMap((id, index) =>
    pins.has(id) ? [{ id, index, l: pins.get(id)!.oklch.l }] : [],
  );
  for (let i = 1; i < fixed.length; i++) {
    if (fixed[i].l > fixed[i - 1].l + LIGHTNESS_EPSILON)
      errors.push(
        diagnostic(
          "LOCKED_SHADE_CONFLICT",
          "error",
          "Fixed shades contradict light-to-dark ordering. Their colors have been preserved; revise the locks or anchor.",
          {
            shades: [fixed[i - 1].id, fixed[i].id],
            details: {
              previousLightness: fixed[i - 1].l,
              nextLightness: fixed[i].l,
            },
          },
        ),
      );
  }

  // Expand free endpoints to accommodate valid locks; do not move any pinned L.
  const top = Math.max(...fixed.map((point) => point.l));
  const bottom = Math.min(...fixed.map((point) => point.l));
  const points = [...fixed];
  if (!pins.has(50))
    points.unshift({
      id: 50,
      index: 0,
      l: top + (1 - top) * settings.lightnessSpread.lighter,
    });
  if (!pins.has(900))
    points.push({
      id: 900,
      index: 9,
      l: bottom * (1 - settings.lightnessSpread.darker),
    });
  const baseColor = normalized.value.oklch;
  const shades: TonalShade[] = [];
  for (const [index, id] of SHADE_IDS.entries()) {
    const pin = pins.get(id);
    if (pin) {
      shades.push({
        id,
        hex: pin.hex,
        oklch: pin.oklch,
        requested: pin.oklch,
        locked: locks.has(id),
        anchor: id === settings.anchor,
      });
      continue;
    }
    // Neighboring fixed points give a bounded, explicitly monotonic segment.
    const right = points.find((point) => point.index >= index)!;
    const left = points.filter((point) => point.index <= index).at(-1)!;
    const t =
      left.index === right.index
        ? 0
        : (index - left.index) / (right.index - left.index);
    const l = left.l + (right.l - left.l) * smoothstep(t);
    const q =
      l >= baseColor.l
        ? baseColor.l === 1
          ? 0
          : (1 - l) / (1 - baseColor.l)
        : baseColor.l === 0
          ? 0
          : l / baseColor.l;
    const c =
      baseColor.c *
      settings.chromaIntensity *
      Math.pow(Math.max(0, Math.min(1, q)), 0.8);
    const h =
      c === 0 || baseColor.h === null
        ? null
        : wrapHue(
            baseColor.h +
              (settings.hueDrift * (index - anchorIndex)) /
                Math.max(anchorIndex, 9 - anchorIndex),
          );
    const requested: OklchColor = { mode: "oklch", l, c, h };
    const mapped = mapToSrgb(requested);
    if (!mapped.ok)
      return failure(
        mapped.errors.map((d) => ({ ...d, shades: [id] })),
        warnings,
      );
    warnings.push(...mapped.warnings.map((d) => ({ ...d, shades: [id] })));
    const hex = formatHex(mapped.value.rgb)!.toUpperCase() as HexColor;
    const actual = colorFromHex(hex);
    shades.push({
      id,
      hex,
      oklch: actual.oklch,
      requested,
      locked: false,
      anchor: false,
    });
  }
  warnings.push(...diagnoseShades(shades));
  const canonicalLocks = Object.fromEntries(
    [...locks].map(([id, color]) => [id, color.hex]),
  );
  const value: TonalScale = {
    base: normalized.value,
    options: { ...settings, locks: canonicalLocks },
    shades,
  };
  return errors.length
    ? failure(errors, warnings, value)
    : success(value, warnings);
}
