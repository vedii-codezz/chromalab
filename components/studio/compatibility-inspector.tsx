import { useMemo, useState } from "react";
import { useStudio } from "@/store/color-studio-store";
import { compareColors, describeBalance } from "@/lib/color/compatibility";
export function CompatibilityInspector() {
  const colors = useStudio((s) => s.project.colors);
  const [foreground, setForeground] = useState("");
  const [background, setBackground] = useState("");
  const [size, setSize] = useState("normal");
  const first = colors.find((c) => c.id === foreground) ?? colors[0];
  const second =
    colors.find((c) => c.id === background) ?? colors[1] ?? colors[0];
  const pair = useMemo(
    () => compareColors(first?.baseColor, second?.baseColor),
    [first?.baseColor, second?.baseColor],
  );
  const balance = useMemo(
    () => describeBalance(colors.map((c) => c.baseColor)),
    [colors],
  );
  return (
    <section
      className="tool-section compatibility"
      aria-label="Compatibility Inspector"
    >
      <h2 className="eyebrow">Compatibility Inspector</h2>
      {[
        ["Foreground color", first?.id ?? "", setForeground],
        ["Background color", second?.id ?? "", setBackground],
      ].map(([label, value, update]) => (
        <label key={String(label)} className="studio-field">
          {String(label)}
          <select
            aria-label={String(label)}
            value={String(value)}
            onChange={(e) => (update as (v: string) => void)(e.target.value)}
          >
            {!colors.length && <option value="">No colors</option>}
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="studio-field">
        Text size
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="normal">Normal text</option>
          <option value="large">Large text (24px or 18.67px bold)</option>
        </select>
      </label>
      {pair && first && second ? (
        <>
          <div
            className="pair-sample"
            style={{
              background: second.baseColor,
              color: first.baseColor,
              fontSize: size === "large" ? 24 : 14,
            }}
          >
            Foreground on background
          </div>
          <div
            className="pair-sample"
            style={{
              background: first.baseColor,
              color: second.baseColor,
              fontSize: size === "large" ? 24 : 14,
            }}
          >
            Background on foreground
          </div>
          <p data-testid="contrast-ratio" className="contrast-number">
            {pair.ratio.toFixed(4)}:1
          </p>
          <p className="micro">
            Calculated ratio: {pair.ratio.toPrecision(15)}:1
          </p>
          <p>
            {pair.ratio >= (size === "large" ? 3 : 4.5)
              ? "Strong text contrast"
              : "Contrast needs improvement"}{" "}
            for this pairing and text size.
          </p>
          <ul className="contrast-checks">
            {[
              ["Normal AA", 4.5],
              ["Large AA", 3],
              ["Normal AAA", 7],
              ["Large AAA", 4.5],
            ].map(([label, threshold]) => (
              <li key={label}>
                {label} ({threshold}:1):{" "}
                <strong>
                  {pair.ratio >= Number(threshold) ? "Pass" : "Fail"}
                </strong>
              </li>
            ))}
          </ul>
          <dl className="pair-metrics">
            <dt>Hue relationship</dt>
            <dd>
              {pair.relationship}
              {pair.hueDifference !== null &&
                ` · ${pair.hueDifference.toFixed(1)}°`}
            </dd>
            <dt>OKLCH lightness</dt>
            <dd>
              {pair.first.l.toFixed(3)} / {pair.second.l.toFixed(3)} · Δ{" "}
              {pair.lightnessDifference.toFixed(3)}
            </dd>
            <dt>Chroma difference</dt>
            <dd>{pair.chromaDifference.toFixed(3)}</dd>
            <dt>OKLab Euclidean distance</dt>
            <dd>
              {pair.distance.toFixed(4)} · {pair.separation}
            </dd>
          </dl>
          <p>{pair.lightness}</p>
        </>
      ) : (
        <p>Add colors to compare a text and background pairing.</p>
      )}
      <details>
        <summary>Collection balance & methods</summary>
        <ul>
          {Object.entries(balance).map(([key, count]) => (
            <li key={key}>
              {key}: {count}
            </li>
          ))}
        </ul>
        <p>
          Descriptive OKLCH bins: light L ≥ .75, dark L &lt; .40, midtone
          between. High chroma C ≥ .15; muted C &lt; .06.
        </p>
        <p>
          Studio heuristics: similar lightness ΔL &lt; .10; low separation OKLab
          distance &lt; .08; complementary hue 180° ±15°; similar hue ≤30°. Hue
          is undefined below C .01. These are exploration guides, not universal
          standards of quality.
        </p>
        <p>
          WCAG 2.2 contrast uses opaque sRGB relative luminance. Distance is raw
          Euclidean OKLab (L 0–1), not ΔE2000. A passing pair does not make the
          whole palette accessible.
        </p>
      </details>
    </section>
  );
}
