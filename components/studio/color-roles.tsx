import { COLOR_ROLES } from "@/types/project";
import { studioStore, useStudio } from "@/store/color-studio-store";
const descriptions = {
  primary: "Main brand or action color.",
  secondary: "Supporting visual color.",
  accent: "Highlight or emphasis color.",
  background: "Page backdrop.",
  surface: "Cards and contained areas.",
  text: "Reading and headings.",
};
export function ColorRoles() {
  const colors = useStudio((s) => s.project.colors);
  const roles = useStudio((s) => s.project.roleAssignments);
  return (
    <details id="color-roles" className="exploration-panel" open>
      <summary>Optional design roles</summary>
      <p className="micro muted">
        Colors can stand alone. Clearing a role keeps its color. One color may
        have several roles.
      </p>
      <div className="role-grid">
        {COLOR_ROLES.map((role) => (
          <label key={role} className="studio-field">
            <span>{role[0].toUpperCase() + role.slice(1)} role</span>
            <select
              aria-label={`${role[0].toUpperCase() + role.slice(1)} role`}
              value={roles[role] ?? ""}
              onChange={(e) =>
                studioStore
                  .getState()
                  .assignRole(role, e.target.value || undefined)
              }
            >
              <option value="">Unassigned</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <small>{descriptions[role]}</small>
          </label>
        ))}
      </div>
    </details>
  );
}
