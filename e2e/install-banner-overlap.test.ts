import { test, expect } from "@playwright/test";

/**
 * Regression test for iPhone Safari install banner overlap.
 * Verifies that the InstallPrompt (which shows a floating banner on iOS) 
 * does not overlap the SmartLink Bio page's bottom tab bar.
 */
test.describe("iPhone Safari Install Banner Regression", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 13/14/15
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });

  test("install banner should not overlap bottom tab bar on SmartLink Bio page", async ({ page }) => {
    // Navigate to the bio builder page
    await page.goto("http://localhost:8080/smartlink-bio");

    // The InstallPrompt should appear after a delay (2500ms per src/components/InstallPrompt.tsx)
    // We wait for it to be visible. It has role="dialog" and aria-label="Install SmartCard app".
    const installBanner = page.locator('role=dialog[name="Install SmartCard app"]');
    await expect(installBanner).toBeVisible({ timeout: 5000 });

    // The bottom navigation tab bar has data-bottom-nav
    const bottomNav = page.locator('[data-bottom-nav]');
    await expect(bottomNav).toBeVisible();

    // Get bounding boxes to check for overlap
    const bannerBox = await installBanner.boundingBox();
    const navBox = await bottomNav.boundingBox();

    if (!bannerBox || !navBox) {
      throw new Error("Could not find bounding boxes for banner or nav");
    }

    // The banner should be ABOVE the nav. 
    // This means banner's bottom (y + height) should be less than or equal to nav's top (y).
    // In our implementation, we use `bottomOffset` to push it up.
    
    const bannerBottom = bannerBox.y + bannerBox.height;
    const navTop = navBox.y;

    console.log(`Banner bottom: ${bannerBottom}, Nav top: ${navTop}`);
    
    // We expect banner bottom to be <= nav top (maybe with some small margin or exactly flush)
    // If it's > nav top, it's overlapping.
    expect(bannerBottom).toBeLessThanOrEqual(navTop);
  });

  test("install banner should be hidden on public profile pages", async ({ page }) => {
    // Public profile pages like /username should not show the banner
    await page.goto("http://localhost:8080/demo"); // Assuming /demo is a public profile

    const installBanner = page.locator('role=dialog[name="Install SmartCard app"]');
    
    // Wait a bit to ensure the timeout doesn't fire
    await page.waitForTimeout(3000);
    await expect(installBanner).not.toBeVisible();
  });
});
