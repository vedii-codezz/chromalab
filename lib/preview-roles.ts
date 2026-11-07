import type { HexColor } from "@/types/color";
import type { ColorProject, ColorRole } from "@/types/project";
export const PREVIEW_ROLES = [
  "background",
  "surface",
  "heading",
  "body",
  "primaryAction",
  "secondaryAction",
  "accent",
] as const;
export type PreviewRole = (typeof PREVIEW_ROLES)[number];
export const PREVIEW_ROLE_LABELS: Record<PreviewRole, string> = {
  background: "background",
  surface: "surface",
  heading: "heading text",
  body: "body text",
  primaryAction: "primary action",
  secondaryAction: "secondary action",
  accent: "accent",
};
export type PreviewAssignments = Partial<Record<PreviewRole, string>>;
const defaults: Record<PreviewRole, HexColor> = {
  background: "#FAFAF7",
  surface: "#FFFFFF",
  heading: "#222222",
  body: "#555555",
  primaryAction: "#5479B8",
  secondaryAction: "#E8E8E3",
  accent: "#D7B66D",
};
const semantic: Record<PreviewRole, ColorRole> = {
  background: "background",
  surface: "surface",
  heading: "text",
  body: "text",
  primaryAction: "primary",
  secondaryAction: "secondary",
  accent: "accent",
};
/** Temporary preview mapping, separate from the future light/dark semantic token system. */
export function resolvePreviewRoles(
  project: ColorProject,
  overrides: PreviewAssignments,
) {
  const values = { ...defaults };
  const fallbacks: PreviewRole[] = [];
  for (const role of PREVIEW_ROLES) {
    const explicit = project.colors.find((c) => c.id === overrides[role]);
    const assigned = project.colors.find(
      (c) => c.id === project.roleAssignments[semantic[role]],
    );
    const color = explicit ?? assigned;
    if (color) values[role] = color.baseColor;
    else fallbacks.push(role);
  }
  return { values, fallbacks };
}
