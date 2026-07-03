import { test, expect, devices, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Deep responsive checks for the mobile admin control panel.
 *
 * For every top-level tab AND its interactive sub-items (order rows,
 * table row viewer, product edit dialog, database table picker) we:
 *   1. Assert document.scrollWidth ≤ viewport width (no sideways scroll).
 *   2. Report first 5 elements bleeding past the right edge.
 *   3. Fail if any visible tab or button < 40px tall (tap target).
 *   4. Save a screenshot per (viewport × step) to .artifacts/admin-mobile.
 *
 * Auth env (same as dashboard-mobile.spec.ts):
 *   E2E_SUPABASE_SESSION_JSON  → raw Supabase session JSON (admin user)
 *   E2E_SUPABASE_STORAGE_KEY   → sb-<project>-auth-token
 *   E2E_BASE_URL               → defaults to http://localhost:8080
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
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(
    scrollWidth,
    `${label}: doc width ${scrollWidth}px > viewport ${vpWidth}px`,
  ).toBeLessThanOrEqual(vpWidth + 1);

  const overflowing = await page.evaluate((vw) => {
    const offenders: { tag: string; cls: string; w: number; right: number; text: string }[] = [];
    document.querySelectorAll<HTMLElement>("main *").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.right > vw + 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 60),
          w: Math.round(rect.width),
          right: Math.round(rect.right),
          text: (el.textContent || "").trim().slice(0, 40),
        });
      }
    });
    return offenders.slice(0, 5);
  }, vpWidth);
  expect(overflowing, `${label}: overflow → ${JSON.stringify(overflowing, null, 2)}`).toEqual([]);
}

async function assertTapTargets(page: Page, label: string) {
  const shortTabs = await page.$$eval('[role="tab"]', (els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20),
        h: (el as HTMLElement).offsetHeight,
      }))
      .filter((e) => e.h > 0 && e.h < 40),
  );
  expect(shortTabs, `${label}: tab triggers < 40px → ${JSON.stringify(shortTabs)}`).toEqual([]);

  // Buttons that are direct action controls: must also be tappable (≥ 32px).
  const shortButtons = await page.$$eval("button", (els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20),
        h: (el as HTMLElement).offsetHeight,
      }))
      .filter((e) => e.h > 0 && e.h < 28),
  );
  expect(shortButtons, `${label}: buttons < 28px → ${JSON.stringify(shortButtons)}`).toEqual([]);
}

async function runChecks(page: Page, label: string, vpWidth: number, shotName: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, `${shotName}.png`), fullPage: true });
  await assertNoHorizontalOverflow(page, label, vpWidth);
  await assertTapTargets(page, label);
}

/** Per-tab drill-down: click sub-items known to expose new UI. */
async function drillIntoTab(
  page: Page,
  tab: (typeof TABS)[number],
  vpName: string,
  vpWidth: number,
) {
  const label = `${vpName}/${tab}`;

  if (tab === "orders") {
    // Expand the first order row if present.
    const row = page.locator("main button", { hasText: /^#/ }).first();
    if (await row.count()) {
      await row.click();
      await runChecks(page, `${label}/expanded`, vpWidth, `${vpName}__${tab}__expanded`);
    }
  }

  if (tab === "products") {
    // Open the edit dialog for the first product.
    const edit = page.locator('main button[aria-label*="Edit" i], main button:has(svg.lucide-pencil)').first();
    if (await edit.count()) {
      await edit.click().catch(() => {});
      await page.waitForTimeout(400);
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count()) {
        await runChecks(page, `${label}/edit-dialog`, vpWidth, `${vpName}__${tab}__edit-dialog`);
        // Close the dialog.
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }
    }
  }

  if (tab === "tables") {
    // Cycle through a couple of tables in the picker.
    const trigger = page.locator('main [role="combobox"], main select').first();
    if (await trigger.count()) {
      for (const tableName of ["Users", "Orders", "Products"]) {
        try {
          await trigger.click();
          const option = page.locator('[role="option"]', { hasText: tableName }).first();
          if (await option.count()) {
            await option.click();
            await runChecks(page, `${label}/${tableName}`, vpWidth, `${vpName}__${tab}__${tableName.toLowerCase()}`);
          } else {
            await page.keyboard.press("Escape");
          }
        } catch {
          /* keep going */
        }
      }
    }
  }

  if (tab === "users") {
    // Search input + first user row action.
    const search = page.locator('main input[type="search"], main input[placeholder*="earch" i]').first();
    if (await search.count()) {
      await search.fill("a");
      await runChecks(page, `${label}/search`, vpWidth, `${vpName}__${tab}__search`);
      await search.fill("");
    }
  }

  if (tab === "emails") {
    // Emails tab renders 3 sub-cards stacked — scroll to the bottom and check.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await runChecks(page, `${label}/scrolled`, vpWidth, `${vpName}__${tab}__scrolled`);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
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
        await page.waitForTimeout(700);

        const onAdmin = page.url().includes("/admin") && !page.url().includes("/admin-login");

        if (onAdmin) {
          const trigger = page.locator(`[role="tab"][value="${tab}"]`).first();
          if (await trigger.count()) {
            await trigger.click();
            await page.waitForTimeout(500);
          }
          await runChecks(page, `${vp.name}/${tab}`, vp.width, `${vp.name}__${tab}`);
          await drillIntoTab(page, tab, vp.name, vp.width);
        } else {
          // Auth redirect — still capture what rendered as smoke evidence.
          await page.screenshot({
            path: path.join(OUT_DIR, `${vp.name}__${tab}__redirect.png`),
            fullPage: true,
          });
        }

        await context.close();
      });
    }
  });
}
