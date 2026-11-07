import { memo } from "react";
import { blueHour, demoFamilies } from "@/lib/color/demo-palettes";
import { EngineDemo } from "./engine-demo";
export const LegacyStudies = memo(function LegacyStudies() {
  return (
    <details className="legacy-studies">
      <summary>Legacy authored studies & engine reference</summary>
      <p className="engine-demo-note">
        Hand-authored demonstrations, separate from your generated workspace.
      </p>
      <div className="family-grid">
        {demoFamilies.map((f) => (
          <article className="family-card" key={f.role}>
            <div className="family-color" style={{ background: f.hex }} />
            <h2>{f.name}</h2>
            <code>{f.hex}</code>
          </article>
        ))}
      </div>
      <ol className="shade-scale" aria-label="Blue hour shade scale">
        {blueHour.map((s) => (
          <li key={s.step}>
            <div className="shade-block" style={{ background: s.hex }} />
            <b>{s.step}</b>
            <code>{s.hex}</code>
          </li>
        ))}
      </ol>
      <EngineDemo />
    </details>
  );
});
