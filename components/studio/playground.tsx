import { memo, useState } from "react";
import { studioStore, useStudio } from "@/store/color-studio-store";
import type { PaletteFamily } from "@/types/project";
const actions = studioStore.getState();
const ColorCard = memo(function ColorCard({
  color,
  selected,
  index,
  total,
  roles,
  onDrag,
}: {
  color: PaletteFamily;
  selected: boolean;
  index: number;
  total: number;
  roles: string;
  onDrag: (id: string) => void;
}) {
  return (
    <article
      className={`family-card collection-card ${selected ? "is-selected" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", color.id);
        e.dataTransfer.effectAllowed = "move";
        onDrag(color.id);
      }}
      onDragEnd={() => onDrag("")}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        actions.reorderColor(e.dataTransfer.getData("text/plain"), index);
        onDrag("");
      }}
    >
      <button
        className="color-card-select"
        aria-label={`Select ${color.name} palette`}
        aria-pressed={selected}
        onClick={() => actions.selectFamily(color.id)}
      >
        <div className="family-card-header">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{selected ? "Selected" : "Edit"}</span>
        </div>
        <div className="family-color" style={{ background: color.baseColor }} />
        <div className="family-strip" aria-hidden="true">
          {color.scale.shades.map((s) => (
            <span key={s.id} style={{ background: s.hex }} />
          ))}
        </div>
        <h2>{color.name}</h2>
        <code>{color.baseColor}</code>
      </button>
      {roles && <p className="micro color-role-indicator">{roles}</p>}
      {!!color.tags?.length && (
        <p className="micro muted">{color.tags.join(" · ")}</p>
      )}
      <div className="card-actions">
        <button
          aria-label={`Duplicate ${color.name}`}
          onClick={() => actions.duplicateColor(color.id)}
        >
          Duplicate
        </button>
        <button
          aria-label={`Remove ${color.name}`}
          onClick={() => actions.removeColor(color.id)}
        >
          Remove
        </button>
        <button
          aria-label={`Assign role to ${color.name}`}
          onClick={() => {
            actions.selectFamily(color.id);
            const roles = document.getElementById(
              "color-roles",
            ) as HTMLDetailsElement | null;
            if (roles) {
              roles.open = true;
              roles.scrollIntoView?.({ block: "nearest" });
            }
            document
              .querySelector<HTMLSelectElement>("#color-roles select")
              ?.focus();
          }}
        >
          Roles
        </button>
        <button
          disabled={index === 0}
          aria-label={`Move ${color.name} earlier`}
          onClick={() => actions.reorderColor(color.id, index - 1)}
        >
          ←
        </button>
        <button
          disabled={index === total - 1}
          aria-label={`Move ${color.name} later`}
          onClick={() => actions.reorderColor(color.id, index + 1)}
        >
          →
        </button>
      </div>
    </article>
  );
});
export function Playground() {
  const colors = useStudio((s) => s.project.colors);
  const roles = useStudio((s) => s.project.roleAssignments);
  const selected = useStudio((s) => s.activeFamilyId);
  const [dragging, setDragging] = useState("");
  return (
    <section
      aria-label="Color Playground"
      className={dragging ? "playground is-dragging" : "playground"}
    >
      <div className="section-top">
        <h2>Color Playground</h2>
        <button
          className="quiet-button"
          disabled={colors.length >= 200}
          onClick={() => actions.addColor()}
        >
          Add color
        </button>
      </div>
      <p className="micro muted">
        {colors.length} / 200 colors · Drag to reorder, or use each card’s arrow
        buttons.
      </p>
      {!colors.length && (
        <div className="empty-collection">
          <h2>Every palette starts somewhere.</h2>
          <p>Add a color to begin exploring.</p>
        </div>
      )}
      <div className="family-grid collection-grid">
        {colors.map((color, index) => (
          <ColorCard
            key={color.id}
            color={color}
            selected={color.id === selected}
            index={index}
            total={colors.length}
            roles={Object.entries(roles)
              .filter(([, id]) => id === color.id)
              .map(([role]) => role)
              .join(" · ")}
            onDrag={setDragging}
          />
        ))}
      </div>
    </section>
  );
}

export function ColorDetails({ color }: { color: PaletteFamily }) {
  const [name, setName] = useState(color.name);
  const [tags, setTags] = useState(color.tags?.join(", ") ?? "");
  return (
    <>
      <label className="studio-field">
        Color name
        <input
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            actions.renameColor(color.id, name);
            setName(name.trim() || color.name);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setName(color.name);
          }}
        />
      </label>
      <label className="studio-field">
        Tags
        <input
          value={tags}
          placeholder="brand, quiet"
          onChange={(e) => setTags(e.target.value)}
          onBlur={() =>
            actions.setTags(
              color.id,
              tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </label>
      <p className="micro muted">Up to 20 tags, 40 characters each.</p>
    </>
  );
}
