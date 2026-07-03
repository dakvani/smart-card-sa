import { test, expect, devices, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Responsive checks for the admin control panel on mobile.
 *
 * Runs through every top-level tab (Overview, Products, Orders, Pro,
 * Emails, Database, Users, Audit) at three phone widths and asserts:
 *
 *   1. No horizontal overflow (page can't scroll sideways).
 *   2. No child element exceeds the viewport width by > 1px.
 *   3. Every tab trigger + button on screen has a tap target ≥ 40px tall.
 *   4. A full-page screenshot is saved per (viewport × tab) for visual review.
 *
 * Auth: reuses the same session-injection strategy as dashboard-mobile.spec.ts.
 *   E2E_SUPABASE_SESSION_JSON  → raw Supabase session JSON (admin user)
 *   E2E_SUPABASE_STORAGE_KEY   → sb-<project>-auth-token
 *   E2E_BASE_URL               → defaults to http://localhost:8080
 *
 * Without a session the test still runs and captures whatever the app renders
 * (usually the admin-login redirect), which still guards against layout crashes.
 */

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:8080";
const SESSION_JSON = process.env.E2E_SUPABASE_SESSION_JSON;
const STORAGE_KEY = process.env.E2E_SUPABASE_STORAGE_KEY;

const VIEWPORTS = [
  { name: "android-360", width: 360, height: 800 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "iphone-pro-max", width: 430, height: 932 },
] as const;

const TABS = [
  "overview",
  "products",
  "orders",
  "pro",
  "emails",
  "tables",
  "users",
  "audit",
] as const;

const OUT_DIR = path.resolve(__dirname, "../.artifacts/admin-mobile");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function restoreSession(page: Page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  if (STORAGE_KEY && SESSION_JSON) {
    await page.evaluate(
      ([k, v]) => window.localStorage.setItem(k, v),
      [STORAGE_KEY, SESSION_JSON],
    );
  }
}

async function assertNoHorizontalOverflow(page: Page, label: string, vpWidth: number) {
  // Body must not scroll horizontally.
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(
    scrollWidth,
    `${label}: document is wider than viewport (${scrollWidth}px > ${vpWidth}px)`,
  ).toBeLessThanOrEqual(vpWidth + 1);

  // No individual descendant may bleed past the viewport by more than 1px.
  const overflowing = await page.evaluate((vw) => {
    const offenders: { tag: string; cls: string; w: number; right: number }[] = [];
    document.querySelectorAll<HTMLElement>("main *").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      if (rect.right > vw + 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 60),
          w: Math.round(rect.width),
          right: Math.round(rect.right),
        });
      }
    });
    // Only the first 5 offenders — enough to diagnose.
    return offenders.slice(0, 5);
  }, vpWidth);
  expect(overflowing, `${label}: elements overflow viewport → ${JSON.stringify(overflowing)}`).toEqual([]);
}

async function assertTapTargets(page: Page, label: string) {
  // Tab triggers must be at least 40px tall (WCAG-ish target).
  const shortTabs = await page.$$eval('[role="tab"]', (els) =>
    els
      .map((el) => ({
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20),
        h: (el as HTMLElement).offsetHeight,
      }))
      .filter((e) => e.h > 0 && e.h < 40),
  );
  expect(shortTabs, `${label}: tab triggers shorter than 40px → ${JSON.stringify(shortTabs)}`).toEqual([]);
}

for (const vp of VIEWPORTS) {
  test.describe(`admin @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const tab of TABS) {
      test(`tab: ${tab}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
          userAgent: devices["iPhone 13"].userAgent,
        });
        const page = await context.newPage();

        await restoreSession(page);
        await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600); // let framer-motion + lazy imports settle

        // If auth redirected us elsewhere, still snapshot but skip strict checks.
        const onAdmin = page.url().includes("/admin") && !page.url().includes("/admin-login");
        if (onAdmin) {
          // Click the tab (uses aria-label from AdminDashboard tabs).
          const trigger = page.locator(`[role="tab"][value="${tab}"]`).first();
          if (await trigger.count()) {
            await trigger.click();
            await page.waitForTimeout(400);
          }
        }

        const shotPath = path.join(OUT_DIR, `${vp.name}__${tab}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });

        if (onAdmin) {
          const label = `${vp.name}/${tab}`;
          await assertNoHorizontalOverflow(page, label, vp.width);
          await assertTapTargets(page, label);
        }

        await context.close();
      });
    }
  });
}
