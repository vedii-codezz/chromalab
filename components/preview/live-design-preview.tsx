import { useMemo, useState, type CSSProperties } from "react";
import { useStudio } from "@/store/color-studio-store";
import {
  PREVIEW_ROLES,
  PREVIEW_ROLE_LABELS,
  resolvePreviewRoles,
  type PreviewAssignments,
} from "@/lib/preview-roles";
import { contrastRatio } from "@/lib/color/compatibility";
export function LiveDesignPreview() {
  const project = useStudio((s) => s.project);
  const [assignments, setAssignments] = useState<PreviewAssignments>({});
  const [template, setTemplate] = useState("Landing page");
  const [tab, setTab] = useState("Overview");
  const [subscribed, setSubscribed] = useState(false);
  const resolved = useMemo(
    () => resolvePreviewRoles(project, assignments),
    [project, assignments],
  );
  const { values: v } = resolved;
  const checks = [
    ["Body on background", v.body, v.background, 4.5],
    ["Heading on background", v.heading, v.background, 3],
    ["Body on surface", v.body, v.surface, 4.5],
    ["Card headings on surface", v.heading, v.surface, 4.5],
    ["Navigation text on background", v.heading, v.background, 4.5],
    ["Primary action label", v.surface, v.primaryAction, 4.5],
    ["Secondary action label", v.heading, v.secondaryAction, 4.5],
    ["Text on accent", v.heading, v.accent, 4.5],
  ] as const;
  const warnings = checks.filter(
    ([, fg, bg, min]) => contrastRatio(fg, bg)! < min,
  );
  const style = Object.fromEntries(
    Object.entries(v).map(([key, value]) => [`--pv-${key}`, value]),
  ) as CSSProperties;
  return (
    <section
      className="exploration-panel design-preview-section"
      aria-label="Live Design Preview"
    >
      <div className="section-top">
        <h2>Live Design Preview</h2>
        <span className="micro muted">Your colors, in context.</span>
      </div>
      <label className="studio-field">
        Preview template
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          {["Landing page", "Dashboard", "Component library"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <details className="preview-mapping">
        <summary>Map preview colors</summary>
        <p className="micro muted">
          Temporary overrides apply to all templates. Default uses an optional
          project role, then a named fallback.
        </p>
        <div className="role-grid">
          {PREVIEW_ROLES.map((role) => (
            <label className="studio-field" key={role}>
              Preview {PREVIEW_ROLE_LABELS[role]}
              <select
                value={
                  project.colors.some((c) => c.id === assignments[role])
                    ? assignments[role]
                    : ""
                }
                onChange={(e) =>
                  setAssignments((a) => ({
                    ...a,
                    [role]: e.target.value || undefined,
                  }))
                }
              >
                <option value="">Project role / fallback</option>
                {project.colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </details>
      <p className="micro muted">
        Fallbacks:{" "}
        {resolved.fallbacks.length
          ? resolved.fallbacks
              .map((role) => `${PREVIEW_ROLE_LABELS[role]} ${v[role]}`)
              .join(" · ")
          : "None"}
        .
      </p>
      <div
        data-testid="design-preview"
        className="design-preview"
        style={style}
        role="region"
        aria-label={`${template} design preview`}
      >
        {template === "Landing page" ? (
          <>
            <div className="pv-nav">
              <strong>Forma / Studio</strong>
              <div>
                <button
                  onClick={() => setTab("Overview")}
                  aria-pressed={tab === "Overview"}
                >
                  Overview
                </button>
                <button
                  onClick={() => setTab("Journal")}
                  aria-pressed={tab === "Journal"}
                >
                  Journal
                </button>
              </div>
            </div>
            <div className="pv-hero">
              <span className="pv-badge">Made with intention</span>
              <h3>
                {tab === "Journal"
                  ? "Notes on a considered life."
                  : "Room for your next idea."}
              </h3>
              <p>
                Thoughtful tools for making something that feels like you. A
                little clarity, a new perspective.
              </p>
              <div className="pv-actions">
                <button
                  className="pv-primary"
                  onClick={() => setSubscribed(!subscribed)}
                >
                  {subscribed
                    ? "You’re on the list"
                    : "Find your starting point"}
                </button>
                <button
                  className="pv-secondary"
                  onClick={() => setTab("Journal")}
                >
                  Read the journal
                </button>
              </div>
            </div>
            <div className="pv-cards">
              {[
                "Find your rhythm",
                "Make space",
                "Build something lasting",
              ].map((s, i) => (
                <article key={s}>
                  <span className="pv-mark">0{i + 1}</span>
                  <h4>{s}</h4>
                  <p>Small decisions. Lasting possibilities.</p>
                </article>
              ))}
            </div>
          </>
        ) : template === "Dashboard" ? (
          <div className="pv-dashboard">
            <aside>
              <strong>Forma</strong>
              {["Overview", "Projects", "Activity"].map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </aside>
            <div>
              <header>
                <h3>{tab}</h3>
                <span className="pv-badge">● On track</span>
              </header>
              <div className="pv-cards">
                {["Projects", "Sessions", "Ideas"].map((s, i) => (
                  <article key={s}>
                    <small>{s}</small>
                    <h4>{[24, 186, 48][i]}</h4>
                    <span className="pv-status">↑ This month</span>
                  </article>
                ))}
              </div>
              <article className="pv-chart">
                <h4>Creative momentum</h4>
                <div
                  role="img"
                  aria-label="Sample activity chart"
                  className="pv-bars"
                >
                  {[35, 70, 48, 90, 62, 80, 100].map((h, i) => (
                    <span key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </article>
              <button
                className="pv-primary"
                onClick={() => setSubscribed(!subscribed)}
              >
                {subscribed ? "Report ready" : "Prepare report"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3>A small design language.</h3>
            <div className="pv-actions">
              <button
                className="pv-primary"
                onClick={() => setSubscribed(!subscribed)}
              >
                {subscribed ? "Saved" : "Save changes"}
              </button>
              <button
                className="pv-secondary"
                onClick={() => setSubscribed(false)}
              >
                Cancel
              </button>
              <span className="pv-badge">New collection</span>
            </div>
            <div className="pv-nav">
              {["Overview", "Details", "Settings"].map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="pv-cards">
              <article>
                <h4>{tab} card</h4>
                <p>A place for a little context.</p>
                <label>
                  Project name
                  <input placeholder="A considered beginning" />
                </label>
              </article>
              <article>
                <h4>Keep in the loop</h4>
                <p className="pv-alert">
                  Your latest changes are{" "}
                  {subscribed ? "saved" : "ready to review"}.
                </p>
                <label>
                  <input type="checkbox" /> Send occasional updates
                </label>
              </article>
            </div>
          </>
        )}
      </div>
      <div className="preview-warnings" aria-live="polite">
        <p>
          {warnings.length
            ? "Contrast needs attention in this preview:"
            : "The checked text pairings pass their specified AA thresholds."}
        </p>
        {warnings.map(([label, fg, bg, min]) => (
          <p key={label}>
            {label}: {contrastRatio(fg, bg)!.toFixed(4)}:1; needs {min}:1. Try a
            lighter background or darker text; colors stay under your control.
          </p>
        ))}
      </div>
      <p className="micro muted">
        Sample content and interactions. These checks cover named pairings, not
        complete UI accessibility. No automatic color correction. Final
        light/dark tokens remain planned.
      </p>
    </section>
  );
}
