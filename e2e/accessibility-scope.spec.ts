/**
 * E2E safeguard: accessibility preferences must ONLY affect the public bio
 * profile. Toggling every option must NOT change styling on /dashboard or
 * /admin (even when those routes redirect to a login page — the safeguard
 * is "no accessibility class on <html> or <body>, ever").
 *
 * Required env:
 *   E2E_BIO_USERNAME  – username of a public bio profile (default: "demo")
 *   E2E_BASE_URL      – app base URL (default: http://localhost:8080)
 */
import { test, expect, Page } from "@playwright/test";

const USERNAME = process.env.E2E_BIO_USERNAME ?? "demo";

const LEAK_CLASSES = [
  "accessibility-large-text",
  "dyslexia-font",
  "reduce-motion",
  "screen-reader-optimized",
  "high-contrast-text",
  "enhanced-focus",
];

const FULLY_ENABLED_PREFS = {
  fontSize: "extra-large",
  fontFamily: "dyslexia",
  reducedMotion: true,
  screenReaderOptimized: true,
  highContrastText: true,
  focusIndicators: true,
  lineHeight: 2,
};

async function seedPrefs(page: Page) {
  // The dashboard's AccessibilitySettings persists to localStorage under
  // this key. Seeding directly skips the auth/dashboard flow.
  await page.addInitScript((prefs) => {
    localStorage.setItem("accessibility-preferences", JSON.stringify(prefs));
  }, FULLY_ENABLED_PREFS);
}

async function getRootLeaks(page: Page) {
  return page.evaluate((classes) => {
    const html = document.documentElement;
    const body = document.body;
    return {
      htmlClasses: classes.filter((c) => html.classList.contains(c)),
      bodyClasses: classes.filter((c) => body.classList.contains(c)),
      htmlHasScopeAttr: html.hasAttribute("data-accessibility-scope"),
      bodyHasScopeAttr: body.hasAttribute("data-accessibility-scope"),
    };
  }, LEAK_CLASSES);
}

test.describe("accessibility scoping", () => {
  test("public bio profile receives scoped accessibility classes", async ({ page }) => {
    await seedPrefs(page);
    await page.goto(`/u/${USERNAME}`);

    const scope = page.locator("[data-accessibility-scope]").first();
    await expect(scope).toBeVisible({ timeout: 10_000 });

    const scopeClasses = await scope.evaluate(
      (el, classes) => classes.filter((c) => el.classList.contains(c)),
      LEAK_CLASSES,
    );
    expect(scopeClasses.sort()).toEqual([...LEAK_CLASSES].sort());

    // Even on the bio page, classes must live on the scope element, not <html>/<body>.
    const leaks = await getRootLeaks(page);
    expect(leaks.htmlClasses).toEqual([]);
    expect(leaks.bodyClasses).toEqual([]);
    expect(leaks.htmlHasScopeAttr).toBe(false);
    expect(leaks.bodyHasScopeAttr).toBe(false);
  });

  for (const route of ["/dashboard", "/admin", "/admin-login", "/"]) {
    test(`accessibility preferences do not leak onto ${route}`, async ({ page }) => {
      await seedPrefs(page);
      await page.goto(route);
      // Wait for the SPA to mount something.
      await page.waitForLoadState("networkidle");

      const leaks = await getRootLeaks(page);
      expect(
        leaks.htmlClasses,
        `accessibility class leaked onto <html> on ${route}`,
      ).toEqual([]);
      expect(
        leaks.bodyClasses,
        `accessibility class leaked onto <body> on ${route}`,
      ).toEqual([]);
      expect(leaks.htmlHasScopeAttr).toBe(false);
      expect(leaks.bodyHasScopeAttr).toBe(false);

      // No scoped container should be rendered on internal pages.
      const scopeCount = await page.locator("[data-accessibility-scope]").count();
      expect(
        scopeCount,
        `internal page ${route} must not render a [data-accessibility-scope] container`,
      ).toBe(0);
    });
  }
});
