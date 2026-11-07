import { test, expect } from "@playwright/test";
test("manual editing, independent palettes, locks, history and reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/studio");
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const tools = page.getByTestId("tools-panel");
  if (!(await tools.evaluate((e) => (e as HTMLDetailsElement).open)))
    await tools.locator("summary").click();
  const hex = page.getByLabel("HEX", { exact: true });
  await hex.fill("#123456");
  await hex.press("Enter");
  await expect(page.getByTestId("shade-500")).toContainText("#123456");
  await page
    .getByRole("button", { name: "Lock shade 100", exact: true })
    .click();
  const locked = await page
    .getByTestId("shade-100")
    .locator("code")
    .textContent();
  await hex.fill("#223456");
  await hex.press("Enter");
  await expect(page.getByTestId("shade-100")).toContainText(locked!);
  await page.getByRole("button", { name: "Select Secondary palette" }).click();
  await expect(hex).toHaveValue("#D7B66D");
  await hex.fill("#445566");
  await hex.press("Enter");
  await page.getByRole("button", { name: "Select Primary palette" }).click();
  await expect(hex).toHaveValue("#223456");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Select Secondary palette" }).click();
  await expect(hex).toHaveValue("#D7B66D");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(hex).toHaveValue("#445566");
  await page.reload();
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  if (!(await tools.evaluate((e) => (e as HTMLDetailsElement).open)))
    await tools.locator("summary").click();
  await expect(hex).toHaveValue("#223456");
  await expect(
    page.getByRole("button", { name: "Unlock shade 100", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Reset project", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(hex).toHaveValue("#223456");
  await page
    .getByRole("button", { name: "Reset project", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm reset", exact: true })
    .click();
  await expect(hex).toHaveValue("#5479B8");
  expect(errors).toEqual([]);
});
test("keyboard and pointer color picker, draft errors and text undo exemption", async ({
  page,
}, testInfo) => {
  await page.goto("/studio");
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const tools = page.getByTestId("tools-panel");
  if (!(await tools.evaluate((e) => (e as HTMLDetailsElement).open)))
    await tools.locator("summary").click();
  const hex = page.getByLabel("HEX", { exact: true });
  const initial = await hex.inputValue();
  await hex.fill("#12");
  await hex.press("Enter");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await hex.press("Escape");
  await expect(hex).toHaveValue(initial!);
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  await hue.focus();
  await hue.press("ArrowRight");
  await expect(hex).not.toHaveValue(initial!);
  await hue.press("Control+z");
  await expect(hex).toHaveValue(initial!);
  await hue.press("Control+Shift+z");
  await expect(hex).not.toHaveValue(initial!);
  const square = page.getByRole("group", {
    name: "Saturation and lightness",
    exact: true,
  });
  const box = (await square.boundingBox())!;
  if (testInfo.project.name === "mobile") {
    await page.touchscreen.tap(
      box.x + box.width * 0.8,
      box.y + box.height * 0.4,
    );
  } else {
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, {
      steps: 12,
    });
    await page.mouse.up();
  }
  await expect(page.getByTestId("shade-500").locator("code")).toHaveText(
    await hex.inputValue(),
  );
  await square.focus();
  await square.press("ArrowUp");
  await expect(page.getByLabel("Lightness", { exact: true })).toBeVisible();
  await hex.fill("#ABC");
  const before = await page
    .getByTestId("shade-500")
    .locator("code")
    .textContent();
  await hex.press("Control+z");
  await expect(page.getByTestId("shade-500")).toContainText(before!);
  await page.screenshot({
    path: `test-results/studio-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("interrupted drag saves its valid result and remains one undo edit", async ({
  page,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  const tools = page.getByTestId("tools-panel");
  if (!(await tools.evaluate((e) => (e as HTMLDetailsElement).open)))
    await tools.locator("summary").click();
  const square = page.getByRole("group", {
    name: "Saturation and lightness",
    exact: true,
  });
  const rect = (await square.boundingBox())!;
  const initial = await page.getByLabel("HEX", { exact: true }).inputValue();
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.9, rect.y + rect.height * 0.6, {
    steps: 10,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const value = await page.getByLabel("HEX", { exact: true }).inputValue();
  expect(value).not.toBe(initial);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("chroma-lab.project.v1")!).project
          .families[0].baseColor,
    ),
  ).toBe(value);
  await page.mouse.up();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("HEX", { exact: true })).toHaveValue(initial);
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled();
});
