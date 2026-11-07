import { generateTonalScale } from "@/lib/color/tonal-scale";

/** Server-rendered development example. Inputs stay fixed; no editor state. */
export function EngineDemo() {
  const result = generateTonalScale("#0000FF", { chromaIntensity: 1.1 });
  return (
    <section
      className="shade-panel engine-demo"
      aria-label="OKLCH engine development demonstration"
      data-reveal
    >
      <div className="section-top">
        <div className="shade-title">
          <h2>OKLCH engine</h2>
          <span>/ Development demo</span>
        </div>
        <span className="pill">Phase 02</span>
      </div>
      <p className="engine-demo-note">Static input · Real engine output</p>
      <p className="engine-demo-note">
        Sample base <code>#0000FF</code> · Anchor 500 · Chroma ×1.1
      </p>
      {result.value && (
        <ol className="shade-scale" aria-label="Generated OKLCH shade scale">
          {result.value.shades.map((shade) => (
            <li key={shade.id}>
              <div className="shade-block" style={{ background: shade.hex }} />
              <b>{shade.id}</b>
              <code>{shade.hex}</code>
              {shade.anchor && <span className="engine-anchor">Anchor</span>}
            </li>
          ))}
        </ol>
      )}
      {result.errors.length > 0 && (
        <div className="engine-diagnostics">
          <h3>Engine errors</h3>
          <ul>
            {result.errors.map((error, index) => (
              <li key={index}>
                {error.code}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.warnings.length > 0 ? (
        <details className="engine-diagnostics">
          <summary>
            {result.warnings.length} engine warnings · View diagnostics
          </summary>
          <ul>
            {result.warnings.map((warning, index) => (
              <li key={index}>
                <strong>{warning.code}</strong>
                {warning.shades && (
                  <span> · Shade {warning.shades.join(", ")}</span>
                )}
                <p>{warning.message}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="engine-demo-note">No engine warnings.</p>
      )}
    </section>
  );
}
