import { useMemo, useState } from "react";
import {
  HARMONIES,
  generateHarmony,
  type HarmonyKind,
} from "@/lib/color/harmony";
import { studioStore, useStudio } from "@/store/color-studio-store";
export function HarmonyExplorer() {
  const color = useStudio((s) =>
    s.project.colors.find((c) => c.id === s.activeFamilyId),
  );
  const [kind, setKind] = useState<HarmonyKind>("Complementary");
  const result = useMemo(
    () => generateHarmony(color?.baseColor, kind),
    [color?.baseColor, kind],
  );
  const [rejected, setRejected] = useState<string[]>([]);
  const [preview, setPreview] = useState("");
  const context = `${color?.baseColor}-${kind}`;
  return (
    <section className="exploration-panel" aria-label="Harmony Explorer">
      <div className="section-top">
        <h2>Harmony Explorer</h2>
        <span className="micro muted">A relationship, a possibility.</span>
      </div>
      <label className="studio-field">
        Harmony relationship
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as HarmonyKind)}
        >
          {HARMONIES.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <p className="micro muted">
        Base:{" "}
        {color ? `${color.name} ${color.baseColor}` : "Select or add a color"}.{" "}
        {result.note}
      </p>
      <div className="harmony-candidates">
        {result.candidates
          .filter((c) => !rejected.includes(`${context}-${c.hex}`))
          .map((c) => (
            <article key={c.hex}>
              <button
                className="harmony-swatch"
                style={{ background: c.hex }}
                aria-label={`Preview suggestion ${c.hex}`}
                aria-pressed={preview === `${context}-${c.hex}`}
                onClick={() => setPreview(`${context}-${c.hex}`)}
              />
              <code>{c.hex}</code>
              {c.gamutAdjusted && <span className="micro">Gamut mapped</span>}
              <div className="card-actions">
                <button
                  aria-label={`Add suggestion ${c.hex}`}
                  onClick={() => studioStore.getState().addColor(c.hex)}
                >
                  Add color
                </button>
                <button
                  aria-label={`Reject suggestion ${c.hex}`}
                  onClick={() =>
                    setRejected((v) => [...v, `${context}-${c.hex}`])
                  }
                >
                  Reject
                </button>
              </div>
              {preview === `${context}-${c.hex}` && (
                <div
                  className="harmony-pair"
                  style={{ background: color?.baseColor, color: c.hex }}
                >
                  Aa{" "}
                  <span style={{ background: c.hex, color: color?.baseColor }}>
                    Aa
                  </span>
                </div>
              )}
            </article>
          ))}
      </div>
      {!!result.candidates.length && (
        <button
          className="quiet-button"
          onClick={() => {
            setRejected([]);
            setPreview("");
          }}
        >
          Restore suggestions
        </button>
      )}
    </section>
  );
}
