import { test, expect } from "@playwright/test";

const routes = ["/", "/features", "/pricing", "/blog", "/faq", "/missing"];

test.describe("marketing smoke", () => {
  for (const route of routes) {
    test(`should render ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
