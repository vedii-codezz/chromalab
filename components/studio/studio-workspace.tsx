"use client";
import { useEffect, useState } from "react";
import { ChevronDown, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { ResponsivePanel } from "@/components/shared/responsive-panel";
import { ComponentPreview } from "@/components/preview/component-preview";
import { LegacyStudies } from "./legacy-studies";
import { ColorInputs, colorStrings } from "./color-inputs";
import { ColorPicker } from "./color-picker";
import { studioStore, useStudio } from "@/store/color-studio-store";
import { SHADE_IDS, type ShadeId } from "@/types/color";
import type { CSSProperties } from "react";
const actions = studioStore.getState();
function active(s: ReturnType<typeof studioStore.getState>) {
  return s.project.families.find((f) => f.id === s.activeFamilyId)!;
}
function Tools() {
  const family = useStudio(active);
  const families = useStudio((s) => s.project.families);
  return (
    <ResponsivePanel
      className="side-panel tools-panel"
      collapseAt={640}
      testId="tools-panel"
    >
      <summary>
        Studio tools <ChevronDown size={14} />
      </summary>
      <div className="panel-content">
        <h2 className="eyebrow">Studio tools</h2>
        <section className="tool-section">
          <h3>Color selection</h3>
          <label className="studio-field">
            Palette family
            <select
              value={family.id}
              onChange={(e) => actions.selectFamily(e.target.value)}
            >
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <ColorPicker key={family.id} />
          <ColorInputs />
        </section>
        <section className="tool-section">
          <h3>Generation settings</h3>
          <label className="studio-field">
            Anchor shade
            <select
              value={family.anchor}
              onChange={(e) =>
                actions.updateSettings({}, Number(e.target.value) as ShadeId)
              }
            >
              {SHADE_IDS.map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
          </label>
          {(
            [
              [
                "Lighter spread",
                family.settings.lightnessSpread.lighter,
                0,
                1,
                0.05,
                (v: number) =>
                  actions.updateSettings({
                    lightnessSpread: {
                      ...family.settings.lightnessSpread,
                      lighter: v,
                    },
                  }),
              ],
              [
                "Darker spread",
                family.settings.lightnessSpread.darker,
                0,
                1,
                0.05,
                (v: number) =>
                  actions.updateSettings({
                    lightnessSpread: {
                      ...family.settings.lightnessSpread,
                      darker: v,
                    },
                  }),
              ],
              [
                "Chroma intensity",
                family.settings.chromaIntensity,
                0,
                2,
                0.05,
                (v: number) => actions.updateSettings({ chromaIntensity: v }),
              ],
              [
                "Hue drift",
                family.settings.hueDrift,
                -30,
                30,
                1,
                (v: number) => actions.updateSettings({ hueDrift: v }),
              ],
            ] as const
          ).map(([name, value, min, max, step, update]) => (
            <label className="setting-control" key={name}>
              {name}
              <output>{value}</output>
              <input
                aria-label={name}
                type="range"
                value={value}
                min={min}
                max={max}
                step={step}
                onPointerDown={actions.beginGesture}
                onPointerUp={actions.endGesture}
                onPointerCancel={actions.endGesture}
                onBlur={actions.endGesture}
                onChange={(e) => update(Number(e.target.value))}
              />
            </label>
          ))}
          <p>OKLCH generation · exact anchor and locks.</p>
        </section>
      </div>
    </ResponsivePanel>
  );
}
function Inspector() {
  const family = useStudio(active);
  const selected = useStudio((s) => s.selectedShade);
  const diagnostics = useStudio((s) => s.diagnostics);
  const shade = family.scale.shades.find((s) => s.id === selected)!;
  const strings = colorStrings(shade.hex);
  return (
    <ResponsivePanel className="side-panel inspector-panel" collapseAt={1200}>
      <summary>
        Color inspector <ChevronDown size={14} />
      </summary>
      <div className="panel-content">
        <section className="tool-section">
          <h2 className="eyebrow">Inspector</h2>
          <div className="inspector-swatch" style={{ background: shade.hex }}>
            <span>{family.name}</span>
            <span>{shade.id}</span>
          </div>
          <div className="inspector-name">
            <span>
              {family.name} / {shade.id}
            </span>
            <span className="pill">{shade.locked ? "Locked" : "Unlocked"}</span>
          </div>
          <dl>
            {Object.entries(strings).map(([name, value]) => (
              <div className="property-row" key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div className="property-row">
              <dt>OKLCH</dt>
              <dd>
                {shade.oklch.l.toFixed(3)} {shade.oklch.c.toFixed(3)}{" "}
                {shade.oklch.h?.toFixed(1) ?? "none"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="tool-section">
          <h3>Engine diagnostics</h3>
          <div aria-live="polite">
            {diagnostics.length > 0 && (
              <p role="alert">
                Last edit rejected. The last valid scale and all locks are
                retained.
              </p>
            )}
            {[...diagnostics, ...family.warnings].map((d, i) => (
              <p key={`${d.code}-${i}`}>
                <strong>{d.code}</strong> {d.message}
              </p>
            ))}
            {!diagnostics.length && !family.warnings.length && (
              <p>Valid generated scale.</p>
            )}
          </div>
        </section>
        <aside className="inspector-info">
          <h3>Explore with intention.</h3>
          <p>
            Select a shade to inspect it. Lock a shade to preserve its exact
            color across edits.
          </p>
        </aside>
      </div>
    </ResponsivePanel>
  );
}
function Canvas() {
  const family = useStudio(active);
  const families = useStudio((s) => s.project.families);
  const selected = useStudio((s) => s.selectedShade);
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const message = useStudio((s) => s.storageMessage);
  const diagnostics = useStudio((s) => s.diagnostics);
  const [confirmReset, setConfirmReset] = useState(false);
  const shades = family.scale.shades;
  const hex = (id: ShadeId) => shades.find((s) => s.id === id)!.hex;
  return (
    <section className="canvas" aria-labelledby="workspace-heading">
      <div className="canvas-heading" data-reveal>
        <div>
          <p className="eyebrow muted">
            Manual Studio / A considered beginning
          </p>
          <h1 id="workspace-heading">The color workspace</h1>
        </div>
        <span className="pill">Interactive / 03</span>
      </div>
      <div className="history-toolbar">
        <button
          className="quiet-button"
          disabled={!canUndo}
          onClick={actions.undo}
        >
          Undo
        </button>
        <button
          className="quiet-button"
          disabled={!canRedo}
          onClick={actions.redo}
        >
          Redo
        </button>
        <button className="quiet-button" onClick={() => setConfirmReset(true)}>
          Reset project
        </button>
        <span className="micro muted" role="status">
          {message}
        </span>
      </div>
      {confirmReset && (
        <div className="reset-confirm" role="group" aria-label="Confirm reset">
          <p>Reset all families and locks to the starter project?</p>
          <button
            className="quiet-button"
            onClick={() => {
              actions.reset();
              setConfirmReset(false);
            }}
          >
            Confirm reset
          </button>
          <button
            className="quiet-button"
            onClick={() => setConfirmReset(false)}
          >
            Cancel
          </button>
        </div>
      )}
      <p className="workspace-instruction">
        One color, a world of possibilities. Choose a family, shape its tones,
        and keep the shades you love.
      </p>
      <div className="family-grid" data-reveal>
        {families.map((f) => (
          <button
            className="family-card family-select"
            key={f.id}
            aria-label={`Select ${f.name} palette`}
            aria-pressed={f.id === family.id}
            onClick={() => actions.selectFamily(f.id)}
          >
            <div className="family-card-header">
              <span>{f.name.toUpperCase()}</span>
              <span>{f.id === family.id ? "Selected" : "Explore"}</span>
            </div>
            <div className="family-color" style={{ background: f.baseColor }} />
            <div className="family-strip" aria-hidden="true">
              {f.scale.shades.map((s) => (
                <span key={s.id} style={{ background: s.hex }} />
              ))}
            </div>
            <h2>{f.name}</h2>
            <code>{f.baseColor}</code>
          </button>
        ))}
      </div>
      <section
        className="shade-panel"
        aria-labelledby="shade-heading"
        data-reveal
      >
        <div className="section-top">
          <div className="shade-title">
            <h2 id="shade-heading">{family.name}</h2>
            <span>/ Generated tones</span>
          </div>
          <span className="micro muted">10 OKLCH shades</span>
        </div>
        <ol
          className="shade-scale live-scale"
          aria-label="Active generated shade scale"
        >
          {shades.map((s) => (
            <li key={s.id} data-testid={`shade-${s.id}`}>
              <button
                className="shade-select"
                aria-label={`Inspect shade ${s.id}`}
                aria-pressed={selected === s.id}
                onClick={() => actions.selectShade(s.id)}
              >
                <span className="shade-block" style={{ background: s.hex }} />
                <b>{s.id}</b>
                <code>{s.hex}</code>
                <span className="shade-caption">
                  {selected === s.id
                    ? "Selected"
                    : s.anchor
                      ? "Anchor"
                      : "Inspect"}
                </span>
              </button>
              <button
                className="shade-lock"
                aria-label={`${s.locked ? "Unlock" : "Lock"} shade ${s.id}`}
                aria-pressed={s.locked}
                onClick={() =>
                  s.locked ? actions.unlockShade(s.id) : actions.lockShade(s.id)
                }
              >
                {s.locked ? (
                  <LockKeyhole size={12} />
                ) : (
                  <UnlockKeyhole size={12} />
                )}
                <span>{s.locked ? "Locked" : "Unlocked"}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="scale-foot">
          {family.anchor} is the exact base anchor · Locks preserve your chosen
          tones
        </p>
        <div className="edit-diagnostics" aria-live="polite">
          {diagnostics.map((d, i) => (
            <p role="alert" key={i}>
              {d.code}: {d.message} Last valid scale retained.
            </p>
          ))}
        </div>
      </section>
      <div
        className="live-preview"
        data-reveal
        style={
          {
            "--preview-action": hex(600),
            "--preview-soft": hex(100),
            "--preview-mid": hex(400),
            "--preview-dark": hex(800),
          } as CSSProperties
        }
      >
        <ComponentPreview live />
      </div>
      <LegacyStudies />
      <footer className="canvas-footer">
        <span>A space to experiment.</span>
        <span>MANUAL STUDIO / 03</span>
      </footer>
    </section>
  );
}
export function StudioWorkspace() {
  useEffect(() => {
    // The read occurs after hydration, before any persistence write.
    try {
      actions.hydrate(window.localStorage);
    } catch {
      studioStore.setState({
        hydrated: true,
        storageMessage: "Storage unavailable. Edits remain in this session.",
      });
    }
    function shortcut(e: KeyboardEvent) {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, select") || target.isContentEditable)
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) actions.redo();
        else actions.undo();
      }
    }
    const interrupt = () => actions.endGesture();
    const visibility = () => {
      if (document.hidden) interrupt();
    };
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("keydown", shortcut);
    return () => {
      actions.endGesture();
      window.removeEventListener("keydown", shortcut);
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return (
    <main id="main" tabIndex={-1} className="studio-main">
      <Tools />
      <Canvas />
      <Inspector />
    </main>
  );
}
