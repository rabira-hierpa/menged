import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the Dandii public map + console. Points at a running app
 * (PLAYWRIGHT_BASE_URL, default localhost:3000). Specs assume the database is
 * seeded. Run the app + `npx playwright install chromium` first, then
 * `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
