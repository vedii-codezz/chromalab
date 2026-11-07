import { beforeEach, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { starterProject } from "@/lib/studio-project";
import { studioStore } from "@/store/color-studio-store";
beforeEach(() =>
  studioStore.setState({
    project: starterProject(),
    activeFamilyId: "primary",
    selectedShade: 500,
    past: [],
    future: [],
    gesture: null,
    diagnostics: [],
    hydrated: true,
  }),
);
it("adds, names, reorders, duplicates and removes a color; empty state remains usable", () => {
  render(<StudioWorkspace />);
  fireEvent.click(screen.getByRole("button", { name: "Add color" }));
  const name = screen.getByLabelText("Color name");
  fireEvent.change(name, { target: { value: "Ocean" } });
  fireEvent.blur(name);
  expect(
    screen.getByRole("button", { name: "Select Ocean palette" }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Move Ocean earlier" }));
  expect(studioStore.getState().project.colors[2].name).toBe("Ocean");
  fireEvent.click(screen.getByRole("button", { name: "Duplicate Ocean" }));
  expect(screen.getByLabelText("Color name")).toHaveValue("Ocean copy");
  for (const c of [...studioStore.getState().project.colors])
    fireEvent.click(screen.getByRole("button", { name: `Remove ${c.name}` }));
  expect(
    screen.getByText("Every palette starts somewhere."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add color" }));
  expect(screen.getByLabelText("HEX")).toBeInTheDocument();
});
it("explores harmony without auto-adding; compares and maps roles to live previews", () => {
  render(<StudioWorkspace />);
  fireEvent.change(screen.getByLabelText("Harmony relationship"), {
    target: { value: "Triadic" },
  });
  const explorer = screen.getByRole("region", { name: "Harmony Explorer" });
  const add = within(explorer).getAllByRole("button", {
    name: /^Add suggestion/,
  });
  expect(add).toHaveLength(2);
  expect(studioStore.getState().project.colors).toHaveLength(3);
  fireEvent.click(add[0]);
  expect(studioStore.getState().project.colors).toHaveLength(4);
  fireEvent.change(screen.getByLabelText("Primary role"), {
    target: { value: "primary" },
  });
  expect(studioStore.getState().project.roleAssignments.primary).toBe(
    "primary",
  );
  fireEvent.change(screen.getByLabelText("Foreground color"), {
    target: { value: "primary" },
  });
  fireEvent.change(screen.getByLabelText("Background color"), {
    target: { value: "secondary" },
  });
  expect(screen.getByTestId("contrast-ratio")).toHaveTextContent(":1");
  fireEvent.change(screen.getByLabelText("Preview template"), {
    target: { value: "Dashboard" },
  });
  expect(
    screen.getByRole("region", { name: "Dashboard design preview" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Preview primary action"), {
    target: { value: "primary" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Select Primary palette" }),
  );
  fireEvent.change(screen.getByLabelText("HEX"), {
    target: { value: "#123456" },
  });
  fireEvent.keyDown(screen.getByLabelText("HEX"), { key: "Enter" });
  expect(
    screen
      .getByTestId("design-preview")
      .style.getPropertyValue("--pv-primaryAction"),
  ).toBe("#123456");
});

it("opens collapsed role controls from a card action", () => {
  render(<StudioWorkspace />);
  const roles = document.getElementById("color-roles") as HTMLDetailsElement;
  roles.open = false;
  fireEvent.click(
    screen.getByRole("button", { name: "Assign role to Secondary" }),
  );
  expect(roles.open).toBe(true);
  expect(screen.getByLabelText("Primary role")).toHaveFocus();
});

it("warns when surface card headings have insufficient contrast", () => {
  const p = starterProject();
  studioStore.setState({ project: p });
  studioStore.getState().selectFamily("primary");
  studioStore.getState().updateBaseColor("#000000");
  studioStore.getState().selectFamily("secondary");
  studioStore.getState().updateBaseColor("#FFFFFF");
  studioStore.getState().selectFamily("accent");
  studioStore.getState().updateBaseColor("#767676");
  for (const role of ["primary", "secondary", "accent", "background"] as const)
    studioStore.getState().assignRole(role, "primary");
  studioStore.getState().assignRole("surface", "secondary");
  studioStore.getState().assignRole("text", "accent");
  render(<StudioWorkspace />);
  fireEvent.change(screen.getByLabelText("Preview heading text"), {
    target: { value: "secondary" },
  });
  expect(
    screen.getByText(/Card headings on surface: 1.0000:1/),
  ).toBeInTheDocument();
});
