import { colorFromHex } from "@/lib/color/conversion";
import { useState } from "react";
import { studioStore, useStudio } from "@/store/color-studio-store";
export function colorStrings(hex: Parameters<typeof colorFromHex>[0]) {
  const c = colorFromHex(hex);
  const n = (v: number) => Number(v.toFixed(2));
  return {
    HEX: hex,
    RGB: `rgb(${Math.round(c.rgb.r * 255)} ${Math.round(c.rgb.g * 255)} ${Math.round(c.rgb.b * 255)})`,
    HSL: `hsl(${n(c.hsl.h ?? 0)} ${n(c.hsl.s * 100)}% ${n(c.hsl.l * 100)}%)`,
  };
}
function DraftField({ format, value }: { format: string; value: string }) {
  const [draft, setDraft] = useState(value);
  const [source, setSource] = useState(value);
  const [error, setError] = useState("");
  if (source !== value) {
    setSource(value);
    setDraft(value);
    setError("");
  }
  function commit() {
    if (draft === value) return;
    const valid = studioStore.getState().updateBaseColor(draft);
    if (valid) {
      const state = studioStore.getState();
      const hex = state.project.colors.find(
        (f) => f.id === state.activeFamilyId,
      )!.baseColor;
      setDraft(
        colorStrings(hex)[format as keyof ReturnType<typeof colorStrings>],
      );
    }
    setError(
      valid
        ? ""
        : studioStore
            .getState()
            .diagnostics.map((d) => d.message)
            .join(" "),
    );
  }
  return (
    <div className="studio-field">
      <label htmlFor={`color-${format}`}>{format}</label>
      <input
        id={`color-${format}`}
        value={draft}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? `error-${format}` : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setError("");
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setError("");
          }
        }}
      />
      {error && (
        <p id={`error-${format}`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function ColorInputs() {
  const family = useStudio((s) =>
    s.project.colors.find((f) => f.id === s.activeFamilyId)!,
  );
  const strings = colorStrings(family.baseColor);
  return (
    <div className="color-inputs">
      {Object.entries(strings).map(([format, value]) => (
        <DraftField
          key={`${family.id}-${format}`}
          format={format}
          value={value}
        />
      ))}
    </div>
  );
}
