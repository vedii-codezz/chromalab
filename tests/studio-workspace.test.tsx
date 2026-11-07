import { render, screen, fireEvent, within } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { studioStore } from "@/store/color-studio-store";
import { starterProject } from "@/lib/studio-project";
beforeEach(() =>
  studioStore.setState({
    project: starterProject(),
    activeFamilyId: "primary",
    selectedShade: 500,
    past: [],
    future: [],
    diagnostics: [],
    gesture: null,
    hydrated: true,
  }),
);
it("selects families, updates only active generated scale, locks and confirms reset", () => {
  render(<StudioWorkspace />);
  const hex = screen.getByLabelText("HEX");
  fireEvent.change(hex, { target: { value: "#123456" } });
  fireEvent.keyDown(hex, { key: "Enter" });
  expect(
    within(screen.getByTestId("shade-500")).getByText("#123456"),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Select Secondary palette" }),
  );
  expect(screen.getByLabelText("HEX")).toHaveValue("#D7B66D");
  fireEvent.click(
    screen.getByRole("button", { name: "Select Primary palette" }),
  );
  expect(screen.getByLabelText("HEX")).toHaveValue("#123456");
  fireEvent.click(screen.getByRole("button", { name: "Lock shade 500" }));
  fireEvent.change(screen.getByLabelText("HEX"), {
    target: { value: "#ABCDEF" },
  });
  fireEvent.keyDown(screen.getByLabelText("HEX"), { key: "Enter" });
  expect(studioStore.getState().project.families[0].baseColor).toBe("#123456");
  expect(
    screen.getByRole("button", { name: "Unlock shade 500" }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Reset project" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(studioStore.getState().project.families[0].baseColor).toBe("#123456");
  fireEvent.click(screen.getByRole("button", { name: "Reset project" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));
  expect(screen.getByLabelText("HEX")).toHaveValue("#5479B8");
});

it("ends interrupted gestures on window blur and persists one history step", () => {
  render(<StudioWorkspace />);
  studioStore.getState().beginGesture();
  studioStore.getState().updateBaseColor("#123456");
  fireEvent.blur(window);
  expect(studioStore.getState().gesture).toBeNull();
  expect(studioStore.getState().past).toHaveLength(1);
});
