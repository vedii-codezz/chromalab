import { test, expect } from "@playwright/test";

test("panels collapse on mobile and reopen when desktop space returns", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  const tools = page.getByTestId("tools-panel");
  await expect(tools).toHaveJSProperty("open", false);
  await tools.locator("summary").click();
  await expect(
    page.getByText("Color selection", { exact: true }),
  ).toBeVisible();
  await tools.locator("summary").click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(tools).toHaveJSProperty("open", true);
  await expect(
    page.getByText("Color selection", { exact: true }),
  ).toBeVisible();
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`routes fit a ${width}px viewport`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/studio"]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  });
}

test("small swatch labels meet AA text contrast", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [route, selector] of [
    ["/", ".paper-color span:last-child"],
    ["/studio", ".inspector-swatch span:last-child"],
  ]) {
    await page.goto(route);
    const ratio = await page.locator(selector).evaluate((el) => {
      function luminance(color: string) {
        const rgb = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const channel = value / 255;
            return channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      }
      const style = getComputedStyle(el);
      let node: Element | null = el;
      let background = style.backgroundColor;
      while (node && background === "rgba(0, 0, 0, 0)") {
        node = node.parentElement;
        if (node) background = getComputedStyle(node).backgroundColor;
      }
      const values = [luminance(style.color), luminance(background)].sort(
        (a, b) => b - a,
      );
      return (values[0] + 0.05) / (values[1] + 0.05);
    });
    expect(ratio, selector).toBeGreaterThanOrEqual(4.5);
  }
});

test("navigate the foundation without overflow or browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "One color.",
  );
  await expect(
    page.getByRole("link", { name: /Enter the Studio/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /Enter the Studio/i }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The color workspace",
  );
  await expect(page.getByRole("button", { name: /Export/i })).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const tools = page.getByTestId("tools-panel");
  if (await page.getByText("Color selection", { exact: true }).isHidden())
    await tools.locator("summary").click();
  await expect(
    page.getByText("Color selection", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /CHROMA LAB home/i }).click();
  await expect(page).toHaveURL("/");
  expect(errors).toEqual([]);
});

test("reduced motion keeps content visible and keyboard navigation usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((el) => getComputedStyle(el).opacity)).toBe(
    "1",
  );
  expect(
    await page
      .locator("[data-reveal]")
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
  await page.getByRole("link", { name: /Enter the Studio/i }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
