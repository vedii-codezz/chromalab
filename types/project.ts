import type {
  ColorDiagnostic,
  HexColor,
  ResolvedTonalOptions,
  ShadeId,
  TonalScale,
} from "./color";
export type GenerationSettings = Omit<ResolvedTonalOptions, "anchor" | "locks">;
export type ColorEntry = {
  id: string;
  name: string;
  baseColor: HexColor;
  anchor: ShadeId;
  settings: GenerationSettings;
  locks: Partial<Record<ShadeId, HexColor>>;
  tags?: string[];
};
export type PaletteFamily = ColorEntry & {
  scale: TonalScale;
  warnings: ColorDiagnostic[];
};
export const COLOR_ROLES = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "text",
] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];
export type RoleAssignments = Partial<Record<ColorRole, string>>;
export type ColorProject = {
  version: 2;
  colors: PaletteFamily[];
  roleAssignments: RoleAssignments;
};
