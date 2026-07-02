import { test, expect, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Automated mobile dashboard screenshots for regression review.
 *
 * Auth strategy (CI):
 *   Set E2E_SUPABASE_SESSION_JSON  → raw Supabase session JSON
 *   Set E2E_SUPABASE_STORAGE_KEY   → sb-<project>-auth-token
 *   (Optional) E2E_BASE_URL        → defaults to http://localhost:8080
 *
 * Locally without a session the test still runs against /dashboard and captures
 * whatever route the app renders (usually the login redirect), which is still
 * useful to verify the layout doesn't crash.
 */

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:8080";
const SESSION_JSON = process.env.E2E_SUPABASE_SESSION_JSON;
const STORAGE_KEY = process.env.E2E_SUPABASE_STORAGE_KEY;

const VIEWPORTS: { name: string; width: number; height: number }[] = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "iphone-pro-max", width: 430, height: 932 },
  { name: "android-360", width: 360, height: 800 },
  { name: "android-412", width: 412, height: 915 },
];

const OUT_DIR = path.resolve(__dirname, "../.artifacts/dashboard-mobile");
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const vp of VIEWPORTS) {
  test(`dashboard @ ${vp.name} (${vp.width}x${vp.height})`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: devices["iPhone 13"].userAgent,
    });
    const page = await context.newPage();

    // Restore Supabase session if provided
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    if (STORAGE_KEY && SESSION_JSON) {
      await page.evaluate(
        ([k, v]) => window.localStorage.setItem(k, v),
        [STORAGE_KEY, SESSION_JSON],
      );
    }

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600); // let framer-motion settle

    const shotPath = path.join(OUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    // Density sanity check: any rendered link cards must respect the max-height cap.
    const overTall = await page.$$eval(
      '[data-testid="sortable-link-item"]',
      (els) => els.filter((el) => (el as HTMLElement).offsetHeight > 240).length,
    );
    expect(overTall, `Link cards exceeding 240px on ${vp.name}`).toBe(0);

    await context.close();
  });
}
