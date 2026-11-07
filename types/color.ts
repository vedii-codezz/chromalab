export const SHADE_IDS = Object.freeze([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
] as const);
export type ShadeId = (typeof SHADE_IDS)[number];
export type HexColor = `#${string}`;

/** Opaque, normalized numeric input channels. RGB and HSL fractions are 0–1. */
export type RgbColor = Readonly<{
  mode: "rgb";
  r: number;
  g: number;
  b: number;
}>;
export type HslInput = Readonly<{
  mode: "hsl";
  h: number | null;
  s: number;
  l: number;
}>;
export type OklchInput = Readonly<{
  mode: "oklch";
  l: number;
  c: number;
  h: number | null;
}>;
export type ColorInput = string | RgbColor | HslInput | OklchInput;
export type ParsedColor =
  | RgbColor
  | (HslInput & { readonly h: number })
  | (OklchInput & { readonly h: number })
  | Readonly<{ mode: "hex"; hex: HexColor }>;
/** Powerless hue is explicit, rather than NaN or an arbitrary hue. */
export type OklchColor = Readonly<{
  mode: "oklch";
  l: number;
  c: number;
  h: number | null;
}>;
export type HslColor = Readonly<{
  mode: "hsl";
  h: number | null;
  s: number;
  l: number;
}>;

export type DiagnosticCode =
  | "INVALID_COLOR_INPUT"
  | "INVALID_OPTIONS"
  | "GAMUT_ADJUSTED"
  | "DUPLICATE_SHADE"
  | "LIGHTNESS_ORDER_CONFLICT"
  | "ANCHOR_CONFLICT"
  | "LOCKED_SHADE_CONFLICT";
export type ColorDiagnostic = Readonly<{
  code: DiagnosticCode;
  severity: "error" | "warning";
  message: string;
  field?: string;
  shades?: readonly ShadeId[];
  details?: Readonly<Record<string, number | string>>;
}>;
/** Conflicting locks can return a candidate value with ok:false. Always check ok. */
export type EngineResult<T> =
  | { ok: true; value: T; errors: []; warnings: ColorDiagnostic[] }
  | {
      ok: false;
      value: T | null;
      errors: ColorDiagnostic[];
      warnings: ColorDiagnostic[];
    };

export type NormalizedColor = Readonly<{
  hex: HexColor;
  rgb: RgbColor;
  hsl: HslColor;
  oklch: OklchColor;
  requested: OklchColor;
}>;
export type GamutMappedColor = Readonly<{
  requested: OklchColor;
  mapped: OklchColor;
  rgb: RgbColor;
  adjusted: boolean;
}>;
export type TonalScaleOptions = Readonly<{
  anchor?: ShadeId;
  lightnessSpread?: Readonly<{ lighter?: number; darker?: number }>;
  chromaIntensity?: number;
  hueDrift?: number;
  locks?: Readonly<Partial<Record<ShadeId, ColorInput>>>;
}>;
export type ResolvedTonalOptions = Readonly<{
  anchor: ShadeId;
  lightnessSpread: Readonly<{ lighter: number; darker: number }>;
  chromaIntensity: number;
  hueDrift: number;
  locks: Readonly<Partial<Record<ShadeId, ColorInput>>>;
}>;
export type TonalShade = Readonly<{
  id: ShadeId;
  hex: HexColor;
  oklch: OklchColor;
  requested: OklchColor;
  locked: boolean;
  anchor: boolean;
}>;
export type TonalScale = Readonly<{
  base: NormalizedColor;
  options: ResolvedTonalOptions;
  shades: readonly TonalShade[];
}>;
