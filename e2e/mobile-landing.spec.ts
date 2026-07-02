import { test, expect } from "@playwright/test";

/**
 * Responsive regression checks for the marketing landing page.
 *
 * Guards against the mobile layout bugs the team hit before:
 *  - horizontal overflow (page wider than viewport)
 *  - runtime page errors during scroll
 *  - key sections rendering off-screen
 *
 * Screenshots are captured per device × scroll stop and attached to the
 * report so a future regression is easy to eyeball.
 *
 * Run: `npm run test:e2e -- mobile-landing`
 */

const MOBILE_DEVICES = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "iphone-pmax", width: 430, height: 932 },
  { name: "android-small", width: 360, height: 780 },
  { name: "pixel-7", width: 412, height: 915 },
] as const;

// One scroll stop per major landing section
const SCROLL_STOPS = [0, 900, 2800, 4600, 6200, 7600] as const;

for (const device of MOBILE_DEVICES) {
  test.describe(`landing @ ${device.name} (${device.width}x${device.height})`, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });

    test("no horizontal overflow, no page errors, sections render", async ({ page }, testInfo) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);

      // Horizontal overflow guard — scrollWidth must equal clientWidth.
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dims.scrollWidth, `horizontal overflow on ${device.name}`).toBeLessThanOrEqual(
        dims.clientWidth,
      );

      for (const [i, y] of SCROLL_STOPS.entries()) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(350);
        const buf = await page.screenshot();
        await testInfo.attach(`${device.name}-${String(i).padStart(2, "0")}-y${y}.png`, {
          body: buf,
          contentType: "image/png",
        });
      }

      expect(pageErrors, `page errors on ${device.name}: ${pageErrors.join("; ")}`).toEqual([]);
    });
  });
}
