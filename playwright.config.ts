import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for accessibility-scoping e2e tests.
 *
 * Run locally:
 *   npx playwright install chromium   # one-time
 *   bun run dev                       # in another terminal
 *   E2E_BIO_USERNAME=your-username npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
