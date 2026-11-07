import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Landing from "@/app/page";
import Studio from "@/app/studio/page";

describe("foundation routes", () => {
  it("shows the real color-engine development sample separately from authored palettes", () => {
    render(<Studio />);
    const demo = screen.getByRole("region", {
      name: "OKLCH engine development demonstration",
    });
    expect(
      within(demo).getByText(/Static input · Real engine output/i),
    ).toBeInTheDocument();
    const scale = within(demo).getByRole("list", {
      name: "Generated OKLCH shade scale",
    });
    expect(within(scale).getAllByRole("listitem")).toHaveLength(10);
    const anchor = within(scale)
      .getByText("500", { exact: true })
      .closest("li")!;
    expect(within(anchor).getByText("#0000FF")).toBeInTheDocument();
    expect(within(demo).getByText(/engine warnings/i)).toBeInTheDocument();
  });
  it("introduces the product and links to the studio", () => {
    render(<Landing />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "One color. An entire design language.",
    );
    expect(
      screen.getByRole("link", { name: /Enter the Studio/i }),
    ).toHaveAttribute("href", "/studio");
    expect(
      screen.getByLabelText(/static palette illustration/i),
    ).toBeInTheDocument();
  });
  it("labels demonstrations and keeps future controls unavailable", () => {
    render(<Studio />);
    expect(
      screen.getByRole("heading", { level: 1, name: /The color workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Static demonstration · Editing is coming soon/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Present/i })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /CHROMA LAB home/i }),
    ).toHaveAttribute("href", "/");
  });
  it("renders all ten authored shade labels with hex values", () => {
    render(<Studio />);
    const scale = screen.getByRole("list", { name: /Blue hour shade scale/i });
    const shades = within(scale).getAllByRole("listitem");
    expect(shades).toHaveLength(10);
    for (const label of [
      "50",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ]) {
      expect(
        within(scale).getByText(label, { exact: true }),
      ).toBeInTheDocument();
    }
    for (const shade of shades)
      expect(shade.textContent).toMatch(/#[A-F0-9]{6}/);
  });
});
