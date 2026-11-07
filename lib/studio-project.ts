import { demoFamilies } from "./color/demo-palettes";
import { generateTonalScale } from "./color/tonal-scale";
import { SHADE_IDS } from "@/types/color";
import {
  COLOR_ROLES,
  type ColorEntry,
  type ColorProject,
  type PaletteFamily,
  type RoleAssignments,
} from "@/types/project";

export function generateFamily(color: ColorEntry) {
  return generateTonalScale(color.baseColor, {
    ...color.settings,
    anchor: color.anchor,
    locks: color.locks,
  });
}
export function createColor(
  id: string,
  baseColor: ColorEntry["baseColor"],
  name = "Untitled color",
): PaletteFamily | null {
  const color: ColorEntry = {
    id,
    name,
    baseColor,
    anchor: 500,
    settings: {
      lightnessSpread: { lighter: 0.9, darker: 0.85 },
      chromaIntensity: 1,
      hueDrift: 0,
    },
    locks: {},
  };
  const result = generateFamily(color);
  return result.ok
    ? { ...color, scale: result.value, warnings: result.warnings }
    : null;
}
export function starterProject(): ColorProject {
  return {
    version: 2,
    colors: demoFamilies.map((seed) =>
      createColor(seed.role.toLowerCase(), seed.hex, seed.role)!,
    ),
    roleAssignments: {},
  };
}
/** Canonical fields only: generated data and UI selections are never serialized. */
export function serializeProject(project: ColorProject) {
  return JSON.stringify({
    version: 2,
    project: {
      colors: project.colors.map(
        ({ id, name, baseColor, anchor, settings, locks, tags }) => ({
          id,
          name,
          baseColor,
          anchor,
          settings,
          locks,
          ...(tags ? { tags } : {}),
        }),
      ),
      roleAssignments: project.roleAssignments,
    },
  });
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const hex = (v: unknown) => typeof v === "string" && /^#[A-F0-9]{6}$/.test(v);

/** Deterministic migration and validation. A failed entry rejects the whole candidate. */
export function restoreProject(raw: string): ColorProject | null {
  try {
    const data = JSON.parse(raw);
    if (!record(data) || !record(data.project)) return null;
    const legacy = data.version === 1;
    if (!legacy && data.version !== 2) return null;
    const entries = legacy ? data.project.families : data.project.colors;
    if (
      !Array.isArray(entries) ||
      entries.length > 200 ||
      (legacy && entries.length !== 3)
    )
      return null;
    const ids = new Set<string>();
    const colors: PaletteFamily[] = [];
    for (const f of entries) {
      if (
        !record(f) ||
        typeof f.id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(f.id) ||
        ids.has(f.id) ||
        (legacy && !["primary", "secondary", "accent"].includes(f.id)) ||
        typeof f.name !== "string" ||
        !f.name.trim() ||
        f.name.length > 80 ||
        !hex(f.baseColor) ||
        !SHADE_IDS.includes(f.anchor as never) ||
        !record(f.settings) ||
        !record(f.locks)
      )
        return null;
      if (
        Object.keys(f.settings).sort().join() !==
          "chromaIntensity,hueDrift,lightnessSpread" ||
        !record(f.settings.lightnessSpread) ||
        Object.keys(f.settings.lightnessSpread).sort().join() !==
          "darker,lighter"
      )
        return null;
      if (
        Object.entries(f.locks).some(
          ([id, value]) =>
            !SHADE_IDS.some((x) => String(x) === id) || !hex(value),
        )
      )
        return null;
      if (
        f.tags !== undefined &&
        (!Array.isArray(f.tags) ||
          f.tags.length > 20 ||
          f.tags.some(
            (t) => typeof t !== "string" || !t.trim() || t.length > 40,
          ))
      )
        return null;
      const canonical = {
        id: f.id,
        name: f.name,
        baseColor: f.baseColor,
        anchor: f.anchor,
        settings: f.settings,
        locks: f.locks,
        ...(f.tags ? { tags: [...new Set(f.tags)] } : {}),
      } as ColorEntry;
      const result = generateFamily(canonical);
      if (!result.ok) return null;
      ids.add(f.id);
      colors.push({
        ...canonical,
        scale: result.value,
        warnings: result.warnings,
      });
    }
    const roles: RoleAssignments = {};
    if (legacy) {
      for (const role of ["primary", "secondary", "accent"] as const)
        roles[role] = role;
    } else {
      if (!record(data.project.roleAssignments)) return null;
      for (const [role, id] of Object.entries(data.project.roleAssignments)) {
        if (
          !COLOR_ROLES.includes(role as never) ||
          typeof id !== "string" ||
          !ids.has(id)
        )
          return null;
        roles[role as keyof RoleAssignments] = id;
      }
    }
    return { version: 2, colors, roleAssignments: roles };
  } catch {
    return null;
  }
}
