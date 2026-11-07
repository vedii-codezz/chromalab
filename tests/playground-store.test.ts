import { describe, it, expect } from "vitest";
import {
  createStudioStore,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from "@/store/color-studio-store";
import {
  restoreProject,
  serializeProject,
  starterProject,
} from "@/lib/studio-project";

const legacy = () =>
  JSON.stringify({
    version: 1,
    project: {
      families: starterProject().colors.map(
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
describe("flexible collections and migration", () => {
  it("migrates legacy names, settings, locks and IDs deterministically without deleting v1", () => {
    const data = JSON.parse(legacy());
    data.project.families[0].name = "Blue ink";
    data.project.families[0].anchor = 600;
    data.project.families[0].settings.hueDrift = 12;
    data.project.families[0].locks = { 600: "#5479B8" };
    const raw = JSON.stringify(data);
    const values = new Map([[LEGACY_STORAGE_KEY, raw]]);
    const s = createStudioStore();
    s.getState().hydrate({
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => {
        values.set(k, v);
      },
    });
    expect(s.getState().project.colors.map((c) => c.id)).toEqual([
      "primary",
      "secondary",
      "accent",
    ]);
    expect(s.getState().project.roleAssignments.primary).toBe("primary");
    expect(values.get(LEGACY_STORAGE_KEY)).toBe(raw);
    expect(JSON.parse(values.get(STORAGE_KEY)!).version).toBe(2);
    expect(restoreProject(raw)).toEqual(restoreProject(raw));
    expect(s.getState().project.colors[0]).toMatchObject({
      name: "Blue ink",
      anchor: 600,
      settings: { hueDrift: 12 },
      locks: { 600: "#5479B8" },
    });
  });
  it("reports corrupt legacy storage and failed migration writes while keeping backups", () => {
    const s = createStudioStore();
    s.getState().hydrate({
      getItem: (k) => (k === LEGACY_STORAGE_KEY ? "{" : null),
      setItem() {
        throw new Error("must not write");
      },
    });
    expect(s.getState().storageMessage).toMatch(/recover/i);
    const raw = legacy();
    const next = createStudioStore();
    next.getState().hydrate({
      getItem: (k) => (k === LEGACY_STORAGE_KEY ? raw : null),
      setItem() {
        throw new Error("quota");
      },
    });
    expect(next.getState().project.roleAssignments.primary).toBe("primary");
    expect(next.getState().storageMessage).toMatch(/backup preserved/i);
  });
  it("adds, duplicates, renames, reorders, removes and restores roles with history", () => {
    const s = createStudioStore();
    const untouched = s.getState().project.colors[0];
    const id = s.getState().addColor("#123456")!;
    expect(s.getState().activeFamilyId).toBe(id);
    s.getState().renameColor(id, "Ink");
    s.getState().setTags(id, ["brand", "brand", "quiet"]);
    s.getState().assignRole("text", id);
    const copy = s.getState().duplicateColor(id)!;
    expect(copy).not.toBe(id);
    expect(
      s.getState().project.colors.find((c) => c.id === copy)?.tags,
    ).toEqual(["brand", "quiet"]);
    s.getState().reorderColor(id, 0);
    expect(s.getState().project.colors[0].id).toBe(id);
    s.getState().removeColor(id);
    expect(s.getState().project.roleAssignments.text).toBeUndefined();
    s.getState().undo();
    expect(s.getState().project.roleAssignments.text).toBe(id);
    expect(s.getState().project.colors.find((c) => c.id === "primary")).toBe(
      untouched,
    );
    s.getState().redo();
    for (const c of s.getState().project.colors) s.getState().removeColor(c.id);
    expect(s.getState().project.colors).toHaveLength(0);
    expect(s.getState().updateBaseColor("#ABCDEF")).toBe(false);
    expect(
      restoreProject(serializeProject(s.getState().project))?.colors,
    ).toHaveLength(0);
    s.getState().undo();
    expect(
      s
        .getState()
        .project.colors.some((c) => c.id === s.getState().activeFamilyId),
    ).toBe(true);
  });
  it("rejects dangling roles, duplicate IDs and corrupt settings; recovers v1 from invalid v2", () => {
    const data = JSON.parse(serializeProject(starterProject()));
    data.project.roleAssignments.primary = "missing";
    expect(restoreProject(JSON.stringify(data))).toBeNull();
    delete data.project.roleAssignments.primary;
    data.project.colors.push(data.project.colors[0]);
    expect(restoreProject(JSON.stringify(data))).toBeNull();
    const s = createStudioStore();
    const raw = legacy();
    s.getState().hydrate({
      getItem: (k) => (k === STORAGE_KEY ? "{" : raw),
      setItem() {},
    });
    expect(s.getState().project.colors).toHaveLength(3);
    expect(s.getState().storageMessage).toMatch(/migrat/i);
    const p = s.getState().project;
    s.getState().assignRole("primary", "missing");
    s.getState().renameColor("primary", " ");
    expect(s.getState().project).toBe(p);
  });
});
