import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import { ColorInputs } from "@/components/studio/color-inputs";
import { studioStore } from "@/store/color-studio-store";
import { starterProject } from "@/lib/studio-project";
beforeEach(() =>
  studioStore.setState({
    project: starterProject(),
    activeFamilyId: "primary",
    past: [],
    future: [],
    diagnostics: [],
    gesture: null,
  }),
);
it("keeps partial drafts, rejects invalid input and synchronizes representations on commit", () => {
  render(<ColorInputs />);
  const hex = screen.getByLabelText("HEX");
  fireEvent.change(hex, { target: { value: "#12" } });
  expect(hex).toHaveValue("#12");
  fireEvent.keyDown(hex, { key: "Enter" });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(studioStore.getState().project.colors[0].baseColor).toBe("#5479B8");
  fireEvent.keyDown(hex, { key: "Escape" });
  expect(hex).toHaveValue("#5479B8");
  fireEvent.change(hex, { target: { value: "#FF0000" } });
  fireEvent.keyDown(hex, { key: "Enter" });
  expect(screen.getByLabelText("RGB")).toHaveValue("rgb(255 0 0)");
  expect(screen.getByLabelText("HSL")).toHaveValue("hsl(0 100% 50%)");
  const rgb = screen.getByLabelText("RGB");
  fireEvent.change(rgb, { target: { value: "rgb(0 255 0)" } });
  fireEvent.blur(rgb);
  expect(hex).toHaveValue("#00FF00");
  const hsl = screen.getByLabelText("HSL");
  fireEvent.change(hsl, { target: { value: "hsl(240 100% 50%)" } });
  fireEvent.keyDown(hsl, { key: "Enter" });
  expect(hex).toHaveValue("#0000FF");
});
