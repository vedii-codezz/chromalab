import type {
  ColorDiagnostic,
  DiagnosticCode,
  EngineResult,
  HexColor,
  ShadeId,
  TonalShade,
} from "@/types/color";

export const LIGHTNESS_EPSILON = 1e-6;

export function diagnostic(
  code: DiagnosticCode,
  severity: ColorDiagnostic["severity"],
  message: string,
  context: Omit<ColorDiagnostic, "code" | "severity" | "message"> = {},
): ColorDiagnostic {
  return { code, severity, message, ...context };
}

export function success<T>(
  value: T,
  warnings: ColorDiagnostic[] = [],
): EngineResult<T> {
  return { ok: true, value, errors: [], warnings };
}

export function failure<T>(
  errors: ColorDiagnostic[],
  warnings: ColorDiagnostic[] = [],
  value: T | null = null,
): EngineResult<T> {
  return { ok: false, value, errors, warnings };
}

/** Examine serialized display colors, not only their pre-mapping targets. */
export function diagnoseShades(
  shades: readonly TonalShade[],
): ColorDiagnostic[] {
  const warnings: ColorDiagnostic[] = [];
  const groups = new Map<HexColor, ShadeId[]>();
  for (const [index, shade] of shades.entries()) {
    const group = groups.get(shade.hex) ?? [];
    group.push(shade.id);
    groups.set(shade.hex, group);
    const previous = shades[index - 1];
    if (previous && shade.oklch.l > previous.oklch.l + LIGHTNESS_EPSILON)
      warnings.push(
        diagnostic(
          "LIGHTNESS_ORDER_CONFLICT",
          "warning",
          "Display lightness increases toward a darker shade; constraints or HEX quantization prevent the requested ordering.",
          {
            shades: [previous.id, shade.id],
            details: {
              previousLightness: previous.oklch.l,
              nextLightness: shade.oklch.l,
            },
          },
        ),
      );
  }
  for (const [hex, ids] of groups)
    if (ids.length > 1)
      warnings.push(
        diagnostic(
          "DUPLICATE_SHADE",
          "warning",
          `Shades ${ids.join(", ")} share ${hex}; endpoint constraints or 8-bit quantization can collapse distinct targets.`,
          { shades: ids, details: { hex } },
        ),
      );
  return warnings;
}
