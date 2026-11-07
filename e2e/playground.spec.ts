import { test, expect } from "@playwright/test";
async function openTools(page: import("@playwright/test").Page) {
  const tools = page.getByTestId("tools-panel");
  if (!(await tools.evaluate((e) => (e as HTMLDetailsElement).open)))
    await tools.locator("summary").click();
}
test("collect, explore, compare, assign, preview and restore", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/studio");
  await expect(
    page.getByRole("status", { name: "Project storage" }),
  ).toContainText("Saved on this device");
  await page.getByRole("button", { name: "Add color", exact: true }).click();
  await openTools(page);
  await page.getByLabel("Color name", { exact: true }).fill("Ocean");
  await page.getByLabel("Color name", { exact: true }).press("Enter");
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  await hue.focus();
  await hue.press("ArrowRight");
  const hex = page.getByLabel("HEX", { exact: true });
  await hex.fill("#123456");
  await hex.press("Enter");
  await page.getByLabel("Harmony relationship").selectOption("Triadic");
  const suggestions = page.getByRole("region", {
    name: "Harmony Explorer",
    exact: true,
  });
  await suggestions
    .getByRole("button", { name: /^Preview suggestion/ })
    .first()
    .click();
  await suggestions
    .getByRole("button", { name: /^Add suggestion/ })
    .first()
    .click();
  await expect(page.locator(".collection-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Move Ocean earlier" }).click();
  await expect(page.locator(".collection-card").nth(2)).toContainText("Ocean");
  const oceanId = await page
    .getByLabel("Primary role", { exact: true })
    .locator("option", { hasText: /^Ocean$/ })
    .getAttribute("value");
  await page.getByLabel("Primary role", { exact: true }).selectOption(oceanId!);
  const inspector = page.locator(".inspector-panel");
  if (!(await inspector.evaluate((e) => (e as HTMLDetailsElement).open)))
    await inspector.locator("summary").first().click();
  await page
    .getByRole("combobox", { name: "Foreground color", exact: true })
    .selectOption(oceanId!);
  await page
    .getByRole("combobox", { name: "Background color", exact: true })
    .selectOption("secondary");
  await expect(page.getByTestId("contrast-ratio")).toContainText(":1");
  const snapshot = await page.evaluate(() =>
    localStorage.getItem("chroma-lab.project.v2"),
  );
  for (const template of ["Dashboard", "Component library", "Landing page"]) {
    await page.getByLabel("Preview template").selectOption(template);
    await expect(page.getByTestId("design-preview")).toHaveAttribute(
      "aria-label",
      `${template} design preview`,
    );
  }
  expect(
    await page.evaluate(() => localStorage.getItem("chroma-lab.project.v2")),
  ).toBe(snapshot);
  await page.getByRole("button", { name: "Select Ocean palette" }).click();
  await openTools(page);
  await hex.fill("#223456");
  await hex.press("Enter");
  await expect(page.getByTestId("design-preview")).toHaveCSS(
    "--pv-primaryAction",
    "#223456",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByTestId("design-preview")).toHaveCSS(
    "--pv-primaryAction",
    "#123456",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.reload();
  await expect(page.locator(".collection-card")).toHaveCount(5);
  await expect(page.getByLabel("Primary role", { exact: true })).toHaveValue(
    oceanId!,
  );
  await expect(page.getByTestId("design-preview")).toHaveCSS(
    "--pv-primaryAction",
    "#223456",
  );
  await page.screenshot({
    path: `test-results/playground-${info.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("migrates a legacy project and keeps its backup", async ({ page }) => {
  const legacy = {
    version: 1,
    project: {
      families: [
        ["primary", "Ink", "#123456"],
        ["secondary", "Paper", "#EEEEEE"],
        ["accent", "Signal", "#BB3311"],
      ].map(([id, name, baseColor]) => ({
        id,
        name,
        baseColor,
        anchor: 500,
        settings: {
          lightnessSpread: { lighter: 0.9, darker: 0.85 },
          chromaIntensity: 1,
          hueDrift: 0,
        },
        locks: id === "primary" ? { 500: baseColor } : {},
      })),
    },
  };
  await page.addInitScript((raw) => {
    if (!localStorage.getItem("chroma-lab.project.v2"))
      localStorage.setItem("chroma-lab.project.v1", raw);
  }, JSON.stringify(legacy));
  await page.goto("/studio");
  await expect(
    page.getByRole("status", { name: "Project storage" }),
  ).toContainText("Migrated");
  await expect(page.getByLabel("Primary role", { exact: true })).toHaveValue(
    "primary",
  );
  await expect(
    page.getByRole("button", { name: "Select Ink palette" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unlock shade 500" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chroma-lab.project.v1")!).version,
    ),
  ).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("status", { name: "Project storage" }),
  ).toContainText("Saved on this device");
  await expect(
    page.getByRole("button", { name: "Select Ink palette" }),
  ).toBeVisible();
});

test("picker canvas matches HSL samples and keyboard reorder is available", async ({
  page,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("status", { name: "Project storage" }),
  ).toContainText("Saved on this device");
  await openTools(page);
  await page.getByLabel("HSL", { exact: true }).fill("hsl(0 100% 50%)");
  await page.getByLabel("HSL", { exact: true }).press("Enter");
  await expect(page.getByLabel("HEX", { exact: true })).toHaveValue("#FF0000");
  const samples = await page
    .locator(".picker-canvas")
    .evaluate((el: HTMLCanvasElement) => {
      const c = el.getContext("2d")!;
      return [
        [159, 0],
        [159, 159],
        [159, 80],
        [0, 80],
      ].map(([x, y]) =>
        Array.from(c.getImageData(x, y, 1, 1).data).slice(0, 3),
      );
    });
  expect(samples).toEqual([
    [255, 255, 255],
    [0, 0, 0],
    [253, 0, 0],
    [127, 127, 127],
  ]);
  const earlier = page.getByRole("button", { name: "Move Secondary earlier" });
  await earlier.focus();
  await earlier.press("Enter");
  await expect(page.locator(".collection-card").first()).toContainText(
    "Secondary",
  );
  await page.getByRole("slider", { name: "Saturation", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("HEX", { exact: true })).not.toHaveValue(
    "#FF0000",
  );
});

test("desktop drag reorders stable color cards", async ({ page }, info) => {
  test.skip(
    info.project.name === "mobile",
    "Touch uses the accessible earlier/later controls tested above.",
  );
  await page.goto("/studio");
  await expect(
    page.getByRole("status", { name: "Project storage" }),
  ).toContainText("Saved on this device");
  await page
    .locator(".collection-card")
    .nth(0)
    .dragTo(page.locator(".collection-card").nth(2));
  await expect(page.locator(".collection-card").nth(2)).toContainText(
    "Primary",
  );
  await page.reload();
  await expect(page.locator(".collection-card").nth(2)).toContainText(
    "Primary",
  );
});
