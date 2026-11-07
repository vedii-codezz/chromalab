import { describe, it, expect } from "vitest";
import { createStudioStore, STORAGE_KEY } from "@/store/color-studio-store";

function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
}
describe("interactive project", () => {
  it("selects independent families and generates an exact live anchor", () => {
    const s = createStudioStore();
    const before = s.getState().project.colors[1];
    expect(s.getState().updateBaseColor("#123456")).toBe(true);
    expect(
      s.getState().project.colors[0].scale.shades.find((x) => x.id === 500)
        ?.hex,
    ).toBe("#123456");
    expect(s.getState().project.colors[1]).toBe(before);
    s.getState().selectFamily("secondary");
    expect(s.getState().activeFamilyId).toBe("secondary");
  });
  it("rejects invalid colors without history and preserves locks on anchor conflict", () => {
    const s = createStudioStore();
    const p = s.getState().project;
    expect(s.getState().updateBaseColor("rgb(999 0 0)")).toBe(false);
    expect(s.getState().project).toBe(p);
    expect(s.getState().past).toHaveLength(0);
    s.getState().lockShade(500);
    const locked = s.getState().project;
    expect(s.getState().updateBaseColor("#FF0000")).toBe(false);
    expect(s.getState().project).toBe(locked);
    expect(s.getState().diagnostics[0].code).toBe("ANCHOR_CONFLICT");
    s.getState().unlockShade(500);
    expect(s.getState().updateBaseColor("#FF0000")).toBe(true);
  });
  it("keeps non-anchor locks and reports ordering conflicts without accepting candidates", () => {
    const s = createStudioStore();
    s.getState().lockShade(100);
    const hex = s.getState().project.colors[0].locks[100];
    s.getState().updateBaseColor("#5278B7");
    expect(s.getState().project.colors[0].scale.shades[1].hex).toBe(hex);
    const p = s.getState().project;
    expect(s.getState().updateBaseColor("#FFFFFF")).toBe(false);
    expect(s.getState().project).toBe(p);
    expect(s.getState().diagnostics.length).toBeGreaterThan(0);
  });
  it("coalesces dragging, restores valid states and clears redo on new edits", () => {
    const s = createStudioStore();
    const p = s.getState().project;
    s.getState().beginGesture();
    for (let i = 10; i < 30; i++) s.getState().updateBaseColor(`#${i}3456`);
    expect(s.getState().past).toHaveLength(0);
    s.getState().endGesture();
    expect(s.getState().past).toHaveLength(1);
    const edited = s.getState().project;
    s.getState().undo();
    expect(s.getState().project).toBe(p);
    s.getState().redo();
    expect(s.getState().project).toBe(edited);
    s.getState().undo();
    s.getState().selectShade(100);
    expect(s.getState().future).toHaveLength(1);
    s.getState().updateBaseColor("#ABCDEF");
    expect(s.getState().future).toHaveLength(0);
  });
  it("bounds history and resets with undo support", () => {
    const s = createStudioStore();
    for (let i = 10; i < 80; i++) s.getState().updateBaseColor(`#${i}3456`);
    expect(s.getState().past).toHaveLength(50);
    const p = s.getState().project;
    s.getState().reset();
    expect(s.getState().project.colors[0].baseColor).toBe("#5479B8");
    s.getState().undo();
    expect(s.getState().project).toBe(p);
  });
  it("reads before writing, persists only committed gestures and validates corrupted storage", () => {
    const storage = memory();
    const s = createStudioStore();
    s.getState().hydrate(storage);
    s.getState().updateBaseColor("#123456");
    const saved = storage.getItem(STORAGE_KEY)!;
    s.getState().beginGesture();
    s.getState().updateBaseColor("#ABCDEF");
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
    s.getState().endGesture();
    const restored = createStudioStore();
    restored.getState().hydrate(storage);
    expect(restored.getState().project.colors[0].baseColor).toBe("#ABCDEF");
    expect(restored.getState().past).toHaveLength(0);
    for (const bad of [
      "{",
      '{"version":99}',
      JSON.stringify({ version: 1, project: { families: [] } }),
    ]) {
      storage.setItem(STORAGE_KEY, bad);
      const fresh = createStudioStore();
      fresh.getState().hydrate(storage);
      expect(fresh.getState().project.colors).toHaveLength(3);
      expect(fresh.getState().storageMessage).toMatch(/recover/i);
    }
  });
});
