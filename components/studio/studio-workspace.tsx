import {
  ChevronDown,
  CircleHelp,
  FlaskConical,
  Layers2,
  LockKeyhole,
  Maximize2,
  Pipette,
  SlidersHorizontal,
} from "lucide-react";
import { blueHour, demoFamilies } from "@/lib/color/demo-palettes";
import { ComponentPreview } from "@/components/preview/component-preview";
import { ResponsivePanel } from "@/components/shared/responsive-panel";
import { EngineDemo } from "@/components/studio/engine-demo";

function ToolsPanel() {
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
        <div className="panel-heading">
          <h2 className="eyebrow">Studio tools</h2>
          <SlidersHorizontal size={13} aria-hidden="true" />
        </div>
        <section className="tool-section">
          <h3>Color selection</h3>
          <span className="field-label">Example base color</span>
          <div className="color-field">
            <i aria-hidden="true" />
            <span>#5479B8</span>
            <LockKeyhole
              size={11}
              aria-hidden="true"
              style={{ marginLeft: "auto" }}
            />
          </div>
          <div
            className="color-wheel"
            role="img"
            aria-label="Decorative color wheel, selection coming soon"
          />
          <p>
            Every palette starts with a single color. Interactive inputs arrive
            in the next phase.
          </p>
          <span className="pill">Coming soon</span>
        </section>
        <section className="tool-section">
          <h3>Palette controls</h3>
          <span className="field-label">Harmony</span>
          <div className="control-placeholder">
            <span>Analogous · Example</span>
            <ChevronDown size={11} aria-hidden="true" />
          </div>
          <span className="field-label" style={{ marginTop: 15 }}>
            Tonal range
          </span>
          <div className="control-placeholder">
            <span>50 — 900 · 10 shades</span>
            <LockKeyhole size={10} aria-hidden="true" />
          </div>
          <p>Controls are a static layout preview.</p>
        </section>
        <div className="small-note">
          <CircleHelp size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>A small beginning for a bigger creative practice.</span>
        </div>
      </div>
    </ResponsivePanel>
  );
}

function InspectorPanel() {
  return (
    <ResponsivePanel className="side-panel inspector-panel" collapseAt={1200}>
      <summary>
        Color inspector <ChevronDown size={14} />
      </summary>
      <div className="panel-content">
        <section className="tool-section">
          <div className="panel-heading">
            <h2 className="eyebrow">Inspector</h2>
            <Pipette size={13} aria-hidden="true" />
          </div>
          <span className="field-label">Example color details</span>
          <div className="inspector-swatch">
            <span>Blue hour</span>
            <span>500</span>
          </div>
          <div className="inspector-name">
            <span>Primary / 500</span>
            <span className="pill">Static</span>
          </div>
          <dl>
            <div className="property-row">
              <dt>HEX</dt>
              <dd>#5479B8</dd>
            </div>
            <div className="property-row">
              <dt>RGB</dt>
              <dd>84, 121, 184</dd>
            </div>
            <div className="property-row">
              <dt>HSL</dt>
              <dd>218°, 41%, 53%</dd>
            </div>
          </dl>
        </section>
        <section className="tool-section">
          <h3>Token properties</h3>
          <span className="field-label">Illustrative mapping</span>
          <div className="token-example">
            <code>
              color.action.primary
              <br />↳ primary.600
            </code>
          </div>
          <p>
            Semantic tokens will connect palette colors to meaningful roles. No
            resolver is active yet.
          </p>
          <span className="pill">Coming soon</span>
        </section>
        <aside className="inspector-info">
          <h3>A foundation, by design.</h3>
          <p>
            The cards above are authored studies. The engine demo shows
            generated tones. Interactive editing, saving, and accessibility
            analysis are coming soon.
          </p>
        </aside>
      </div>
    </ResponsivePanel>
  );
}

export function StudioWorkspace() {
  return (
    <main id="main" tabIndex={-1} className="studio-main">
      <ToolsPanel />
      <section className="canvas" aria-labelledby="workspace-heading">
        <div className="canvas-heading" data-reveal>
          <div>
            <p className="eyebrow muted">Study 001 / A considered beginning</p>
            <h1 id="workspace-heading">The color workspace</h1>
          </div>
          <span className="pill">Static demonstration</span>
        </div>
        <p className="workspace-instruction" data-reveal>
          Static demonstration · Editing is coming soon. For now, take a look
          around. This is where your design language will take shape.
        </p>
        <div className="family-grid" data-reveal>
          {demoFamilies.map((family) => (
            <article className="family-card" key={family.name}>
              <div className="family-card-header">
                <span>{family.role.toUpperCase()}</span>
                <Layers2 size={12} aria-hidden="true" />
              </div>
              <div
                className="family-color"
                style={{ background: family.hex }}
              />
              <div className="family-strip" aria-hidden="true">
                {family.colors.map((hex) => (
                  <span key={hex} style={{ background: hex }} />
                ))}
              </div>
              <h2>{family.name}</h2>
              <code>{family.hex}</code>
            </article>
          ))}
        </div>
        <section
          className="shade-panel"
          aria-labelledby="shade-heading"
          data-reveal
        >
          <div className="section-top">
            <div className="shade-title">
              <h2 id="shade-heading">Blue hour</h2>
              <span>/ Tonal study</span>
            </div>
            <span className="micro muted">10 authored shades</span>
          </div>
          <ol className="shade-scale" aria-label="Blue hour shade scale">
            {blueHour.map((shade) => (
              <li key={shade.step}>
                <div
                  className="shade-block"
                  style={{ background: shade.hex }}
                />
                <b>{shade.step}</b>
                <code>{shade.hex}</code>
              </li>
            ))}
          </ol>
          <p className="scale-foot">
            <LockKeyhole size={10} aria-hidden="true" />
            500 is the example base · Authored values, not generated
          </p>
        </section>
        <EngineDemo />
        <div data-reveal>
          <ComponentPreview />
        </div>
        <footer className="canvas-footer">
          <span>
            <FlaskConical size={12} aria-hidden="true" />A space to experiment.
            A system to come.
          </span>
          <span>
            <Maximize2 size={11} aria-hidden="true" />
            FOUNDATION / 01
          </span>
        </footer>
      </section>
      <InspectorPanel />
    </main>
  );
}
