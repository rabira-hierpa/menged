import { expect, test } from "@playwright/test";

/**
 * Public-map smoke test — the anonymous rider entry point. Assumes a seeded
 * database (447 routes). Covers the load + search path; the authenticated
 * submit → approve → export wedge is exercised by the integration tests and
 * the manual QA pass, since it needs signed session cookies.
 */
test("public map loads with brand and search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Dandii").first()).toBeVisible();
  await expect(
    page.getByPlaceholder(/Search/i).first(),
  ).toBeVisible();
});

test("searching a route surfaces a result", async ({ page }) => {
  await page.goto("/");
  const search = page.getByPlaceholder(/Search/i).first();
  await search.click();
  await search.fill("AB001");
  // The route list is fetched as-you-type; the AB001 chip should appear.
  await expect(page.getByText("AB001").first()).toBeVisible({ timeout: 10_000 });
});

test("signed-out user sees a sign-in affordance", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
});
