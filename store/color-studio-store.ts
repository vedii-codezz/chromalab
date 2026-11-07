import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { normalizeColor } from "@/lib/color/conversion";
import {
  generateFamily,
  restoreProject,
  serializeProject,
  starterProject,
  createColor,
} from "@/lib/studio-project";
import type { ColorDiagnostic, ShadeId } from "@/types/color";
import type {
  ColorProject,
  GenerationSettings,
  PaletteFamily,
  ColorRole,
} from "@/types/project";
export const STORAGE_KEY = "chroma-lab.project.v2";
export const LEGACY_STORAGE_KEY = "chroma-lab.project.v1";
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export type StudioState = {
  project: ColorProject;
  activeFamilyId: string;
  selectedShade: ShadeId;
  past: ColorProject[];
  future: ColorProject[];
  gesture: ColorProject | null;
  diagnostics: ColorDiagnostic[];
  hydrated: boolean;
  storageMessage: string;
  selectFamily: (id: string) => void;
  selectShade: (id: ShadeId) => void;
  addColor: (input?: unknown) => string | null;
  removeColor: (id: string) => void;
  duplicateColor: (id: string) => string | null;
  renameColor: (id: string, name: string) => void;
  reorderColor: (id: string, index: number) => void;
  setTags: (id: string, tags: string[]) => void;
  assignRole: (role: ColorRole, id?: string) => void;
  updateBaseColor: (input: unknown) => boolean;
  updateSettings: (
    settings: Partial<GenerationSettings>,
    anchor?: ShadeId,
  ) => boolean;
  lockShade: (id: ShadeId) => boolean;
  unlockShade: (id: ShadeId) => boolean;
  beginGesture: () => void;
  endGesture: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  hydrate: (storage: StoragePort) => void;
};
export function createStudioStore() {
  let storage: StoragePort | null = null;
  return createStore<StudioState>()((set, get) => {
    function persist() {
      const s = get();
      if (!storage || !s.hydrated || s.gesture) return;
      try {
        storage.setItem(STORAGE_KEY, serializeProject(s.project));
        set({ storageMessage: "Saved on this device" });
      } catch {
        set({
          storageMessage: "Storage unavailable. Edits remain in this session.",
        });
      }
    }
    function commit(project: ColorProject) {
      const s = get();
      if (serializeProject(project) === serializeProject(s.project)) {
        set({ diagnostics: [] });
        return;
      }
      set({
        project,
        activeFamilyId: project.colors.some((c) => c.id === s.activeFamilyId)
          ? s.activeFamilyId
          : (project.colors[0]?.id ?? ""),
        diagnostics: [],
        past: s.gesture ? s.past : [...s.past, s.project].slice(-50),
        future: [],
      });
      persist();
    }
    function edit(change: (f: PaletteFamily) => PaletteFamily) {
      const s = get();
      const family = s.project.colors.find((f) => f.id === s.activeFamilyId)!;
      if (!family) return false;
      const next = change(family);
      const result = generateFamily(next);
      if (!result.ok) {
        set({ diagnostics: result.errors });
        return false;
      }
      commit({
        ...s.project,
        colors: s.project.colors.map((f) =>
          f === family
            ? { ...next, scale: result.value, warnings: result.warnings }
            : f,
        ),
      });
      return true;
    }
    return {
      project: starterProject(),
      activeFamilyId: "primary",
      selectedShade: 500,
      past: [],
      future: [],
      gesture: null,
      diagnostics: [],
      hydrated: false,
      storageMessage: "Loading local project…",
      selectFamily(id) {
        get().endGesture();
        if (get().project.colors.some((f) => f.id === id))
          set({ activeFamilyId: id, diagnostics: [] });
      },
      selectShade(id) {
        set({ selectedShade: id });
      },
      addColor(input = "#5479B8") {
        get().endGesture();
        if (get().project.colors.length >= 200) return null;
        const result = normalizeColor(input);
        if (!result.ok) {
          set({ diagnostics: result.errors });
          return null;
        }
        const id = `color-${crypto.randomUUID()}`;
        const color = createColor(
          id,
          result.value.hex,
          `Color ${get().project.colors.length + 1}`,
        );
        if (!color) return null;
        commit({ ...get().project, colors: [...get().project.colors, color] });
        set({ activeFamilyId: id });
        return id;
      },
      removeColor(id) {
        get().endGesture();
        const p = get().project;
        const roleAssignments = { ...p.roleAssignments };
        for (const role of Object.keys(roleAssignments) as ColorRole[])
          if (roleAssignments[role] === id) delete roleAssignments[role];
        commit({
          ...p,
          colors: p.colors.filter((c) => c.id !== id),
          roleAssignments,
        });
      },
      duplicateColor(id) {
        get().endGesture();
        const p = get().project;
        const color = p.colors.find((c) => c.id === id);
        if (!color || p.colors.length >= 200) return null;
        const copy = {
          ...color,
          id: `color-${crypto.randomUUID()}`,
          name: `${color.name.slice(0, 73)} copy`,
          tags: color.tags ? [...color.tags] : undefined,
          locks: { ...color.locks },
        };
        const colors = [...p.colors];
        colors.splice(colors.indexOf(color) + 1, 0, copy);
        commit({ ...p, colors });
        set({ activeFamilyId: copy.id });
        return copy.id;
      },
      renameColor(id, name) {
        get().endGesture();
        if (!name.trim() || name.length > 80) return;
        const p = get().project;
        commit({
          ...p,
          colors: p.colors.map((c) =>
            c.id === id ? { ...c, name: name.trim() } : c,
          ),
        });
      },
      setTags(id, tags) {
        get().endGesture();
        if (tags.length > 20 || tags.some((t) => !t.trim() || t.length > 40))
          return;
        const p = get().project;
        commit({
          ...p,
          colors: p.colors.map((c) =>
            c.id === id
              ? { ...c, tags: [...new Set(tags.map((t) => t.trim()))] }
              : c,
          ),
        });
      },
      reorderColor(id, index) {
        get().endGesture();
        const p = get().project;
        const color = p.colors.find((c) => c.id === id);
        if (
          !color ||
          !Number.isInteger(index) ||
          index < 0 ||
          index >= p.colors.length
        )
          return;
        const colors = p.colors.filter((c) => c.id !== id);
        colors.splice(index, 0, color);
        commit({ ...p, colors });
      },
      assignRole(role, id) {
        get().endGesture();
        const p = get().project;
        if (id && !p.colors.some((c) => c.id === id)) return;
        const roleAssignments = { ...p.roleAssignments };
        if (id) roleAssignments[role] = id;
        else delete roleAssignments[role];
        commit({ ...p, roleAssignments });
      },
      updateBaseColor(input) {
        const result = normalizeColor(input);
        if (!result.ok) {
          set({ diagnostics: result.errors });
          return false;
        }
        return edit((f) => ({ ...f, baseColor: result.value.hex }));
      },
      updateSettings(settings, anchor) {
        return edit((f) => ({
          ...f,
          settings: { ...f.settings, ...settings },
          anchor: anchor ?? f.anchor,
        }));
      },
      lockShade(id) {
        return edit((f) => ({
          ...f,
          locks: {
            ...f.locks,
            [id]: f.scale.shades.find((s) => s.id === id)!.hex,
          },
        }));
      },
      unlockShade(id) {
        return edit((f) => {
          const locks = { ...f.locks };
          delete locks[id];
          return { ...f, locks };
        });
      },
      beginGesture() {
        if (!get().gesture) set({ gesture: get().project });
      },
      endGesture() {
        const s = get();
        if (!s.gesture) return;
        const changed =
          serializeProject(s.gesture) !== serializeProject(s.project);
        set({
          gesture: null,
          past: changed ? [...s.past, s.gesture].slice(-50) : s.past,
        });
        persist();
      },
      undo() {
        get().endGesture();
        const s = get();
        if (!s.past.length) return;
        set({
          project: s.past.at(-1)!,
          activeFamilyId: s.past
            .at(-1)!
            .colors.some((c) => c.id === s.activeFamilyId)
            ? s.activeFamilyId
            : (s.past.at(-1)!.colors[0]?.id ?? ""),
          past: s.past.slice(0, -1),
          future: [s.project, ...s.future].slice(0, 50),
          diagnostics: [],
        });
        persist();
      },
      redo() {
        get().endGesture();
        const s = get();
        if (!s.future.length) return;
        set({
          project: s.future[0],
          activeFamilyId: s.future[0].colors.some(
            (c) => c.id === s.activeFamilyId,
          )
            ? s.activeFamilyId
            : (s.future[0].colors[0]?.id ?? ""),
          past: [...s.past, s.project].slice(-50),
          future: s.future.slice(1),
          diagnostics: [],
        });
        persist();
      },
      reset() {
        get().endGesture();
        commit(starterProject());
        set({ activeFamilyId: "primary", selectedShade: 500 });
      },
      hydrate(port) {
        if (get().hydrated) return;
        storage = port;
        try {
          const raw = port.getItem(STORAGE_KEY);
          let project = raw ? restoreProject(raw) : null;
          let migrated = false;
          let hadStoredData = raw !== null;
          if (!project) {
            const legacy = port.getItem(LEGACY_STORAGE_KEY);
            hadStoredData ||= legacy !== null;
            project = legacy ? restoreProject(legacy) : null;
            migrated = !!project;
          }
          set({
            project: project ?? get().project,
            activeFamilyId: (project ?? get().project).colors[0]?.id ?? "",
            hydrated: true,
            storageMessage: migrated
              ? "Migrated local project; legacy backup preserved."
              : hadStoredData && !project
                ? "Recovered starter project from invalid storage."
                : "Saved on this device",
          });
          if (migrated && project) {
            try {
              port.setItem(STORAGE_KEY, serializeProject(project));
            } catch {
              set({
                storageMessage:
                  "Migration loaded. Storage unavailable; legacy backup preserved.",
              });
            }
          }
        } catch {
          set({
            hydrated: true,
            storageMessage:
              "Storage unavailable. Edits remain in this session.",
          });
        }
      },
    };
  });
}
export const studioStore = createStudioStore();
export function useStudio<T>(selector: (state: StudioState) => T): T {
  return useStore(studioStore, selector);
}
