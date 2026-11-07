import { demoFamilies } from "./color/demo-palettes";
import { generateTonalScale } from "./color/tonal-scale";
import { SHADE_IDS, type HexColor } from "@/types/color";
import type { ColorProject, PaletteFamily } from "@/types/project";

export function generateFamily(
  family: Omit<PaletteFamily, "scale" | "warnings">,
) {
  return generateTonalScale(family.baseColor, {
    ...family.settings,
    anchor: family.anchor,
    locks: family.locks,
  });
}
export function starterProject(): ColorProject {
  return {
    families: demoFamilies.map((seed) => {
      const family = {
        id: seed.role.toLowerCase(),
        name: seed.role,
        baseColor: seed.hex,
        anchor: 500 as const,
        settings: {
          lightnessSpread: { lighter: 0.9, darker: 0.85 },
          chromaIntensity: 1,
          hueDrift: 0,
        },
        locks: {},
      };
      const result = generateFamily(family);
      if (!result.ok) throw new Error("Invalid starter palette");
      return { ...family, scale: result.value, warnings: result.warnings };
    }),
  };
}
/** Only canonical data crosses the storage boundary; generated scales are rebuilt. */
export function serializeProject(project: ColorProject) {
  return JSON.stringify({
    version: 1,
    project: {
      families: project.families.map(
        ({ id, name, baseColor, anchor, settings, locks }) => ({
          id,
          name,
          baseColor,
          anchor,
          settings,
          locks,
        }),
      ),
    },
  });
}
export function restoreProject(raw: string): ColorProject | null {
  try {
    const data = JSON.parse(raw);
    if (
      data?.version !== 1 ||
      !Array.isArray(data.project?.families) ||
      data.project.families.length !== 3
    )
      return null;
    const ids = new Set<string>();
    const families: PaletteFamily[] = [];
    for (const f of data.project.families) {
      if (
        !f ||
        !["primary", "secondary", "accent"].includes(f.id) ||
        ids.has(f.id) ||
        typeof f.name !== "string" ||
        !f.name.trim() ||
        f.name.length > 80 ||
        !/^#[A-F0-9]{6}$/.test(f.baseColor) ||
        !SHADE_IDS.includes(f.anchor) ||
        !f.settings ||
        !f.locks ||
        Array.isArray(f.locks)
      )
        return null;
      if (
        Object.keys(f.settings).sort().join() !==
          "chromaIntensity,hueDrift,lightnessSpread" ||
        Object.keys(f.settings.lightnessSpread ?? {})
          .sort()
          .join() !== "darker,lighter"
      )
        return null;
      for (const [id, hex] of Object.entries(f.locks))
        if (
          !SHADE_IDS.some((x) => String(x) === id) ||
          typeof hex !== "string" ||
          !/^#[A-F0-9]{6}$/.test(hex)
        )
          return null;
      const canonical = {
        id: f.id as string,
        name: f.name as string,
        baseColor: f.baseColor as HexColor,
        anchor: f.anchor,
        settings: f.settings,
        locks: f.locks,
      };
      const result = generateFamily(canonical);
      if (!result.ok) return null;
      ids.add(f.id);
      families.push({
        ...canonical,
        scale: result.value,
        warnings: result.warnings,
      });
    }
    return { families };
  } catch {
    return null;
  }
}
