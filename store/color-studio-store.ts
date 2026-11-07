import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { normalizeColor } from "@/lib/color/conversion";
import {
  generateFamily,
  restoreProject,
  serializeProject,
  starterProject,
} from "@/lib/studio-project";
import type { ColorDiagnostic, ShadeId } from "@/types/color";
import type {
  ColorProject,
  GenerationSettings,
  PaletteFamily,
} from "@/types/project";
export const STORAGE_KEY = "chroma-lab.project.v1";
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
        diagnostics: [],
        past: s.gesture ? s.past : [...s.past, s.project].slice(-50),
        future: [],
      });
      persist();
    }
    function edit(change: (f: PaletteFamily) => PaletteFamily) {
      const s = get();
      const family = s.project.families.find((f) => f.id === s.activeFamilyId)!;
      const next = change(family);
      const result = generateFamily(next);
      if (!result.ok) {
        set({ diagnostics: result.errors });
        return false;
      }
      commit({
        families: s.project.families.map((f) =>
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
        if (get().project.families.some((f) => f.id === id))
          set({ activeFamilyId: id, diagnostics: [] });
      },
      selectShade(id) {
        set({ selectedShade: id });
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
          const project = raw ? restoreProject(raw) : null;
          set({
            project: project ?? get().project,
            hydrated: true,
            storageMessage:
              raw && !project
                ? "Recovered starter project from invalid storage."
                : "Saved on this device",
          });
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
