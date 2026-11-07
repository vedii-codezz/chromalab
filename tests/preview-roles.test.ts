import { it, expect } from "vitest";
import { resolvePreviewRoles } from "@/lib/preview-roles";
import { starterProject } from "@/lib/studio-project";
it("resolves shared preview values, reports fallbacks, handles removed references and leaves project intact", () => {
  const p = starterProject();
  const before = JSON.stringify(p);
  const empty = resolvePreviewRoles(p, {});
  expect(empty.values.background).toBe("#FAFAF7");
  expect(empty.fallbacks).toContain("primaryAction");
  p.roleAssignments.primary = "primary";
  p.roleAssignments.text = "accent";
  const result = resolvePreviewRoles(p, {
    primaryAction: "secondary",
    body: "missing",
  });
  expect(result.values.primaryAction).toBe("#D7B66D");
  expect(result.values.body).toBe(p.colors[2].baseColor);
  expect(result.values.heading).toBe(p.colors[2].baseColor);
  expect(resolvePreviewRoles({ ...p, colors: [] }, {}).fallbacks).toContain(
    "heading",
  );
  delete p.roleAssignments.primary;
  delete p.roleAssignments.text;
  expect(JSON.stringify(p)).toBe(before);
});
