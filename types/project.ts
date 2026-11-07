import type {
  ColorDiagnostic,
  HexColor,
  ResolvedTonalOptions,
  ShadeId,
  TonalScale,
} from "./color";
export type GenerationSettings = Omit<ResolvedTonalOptions, "anchor" | "locks">;
export type PaletteFamily = {
  id: string;
  name: string;
  baseColor: HexColor;
  anchor: ShadeId;
  settings: GenerationSettings;
  locks: Partial<Record<ShadeId, HexColor>>;
  scale: TonalScale;
  warnings: ColorDiagnostic[];
};
export type ColorProject = { families: PaletteFamily[] };
