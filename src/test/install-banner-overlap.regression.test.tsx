import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Static regression test for the install banner overlap fix.
 * Since native Playwright isn't available in this environment, we verify the 
 * implementation logic via code inspection:
 * 1. InstallPrompt measures [data-bottom-nav] to set its offset.
 * 2. SmartLinkBio nav uses [data-bottom-nav].
 */
describe("Install Banner Regression (Implementation check)", () => {
  it("InstallPrompt measures data-bottom-nav to avoid overlap", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../components/InstallPrompt.tsx"),
      "utf-8"
    );
    
    // Must look for the bottom-nav attribute
    expect(src).toContain('document.querySelector<HTMLElement>("[data-bottom-nav]")');
    
    // Must set a bottom offset based on that element's height
    expect(src).toContain('setBottomOffset(h + 16)');
    
    // Must use that offset in its style
    expect(src).toContain('style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))` }}');
  });

  it("SmartLinkBio bottom tabs provide the data-bottom-nav attribute", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../pages/SmartLinkBio.tsx"),
      "utf-8"
    );
    
    // The bottom nav must have the identification attribute
    expect(src).toContain('data-bottom-nav');
    
    // It should also have z-index high enough but lower than the dialog if needed
    // SmartLinkBio nav uses z-40.
  });

  it("InstallPrompt is disabled on public profile pages", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../components/InstallPrompt.tsx"),
      "utf-8"
    );
    
    // Must have the check for public profile routes
    expect(src).toContain('isPublicProfileRoute');
    // Check that we've expanded the list to include more app routes
    expect(src).toContain('"/login"');
    expect(src).toContain('"/signup"');
    expect(src).toContain('"/settings"');
    expect(src).toContain('if (!visible || isPublicProfileRoute) return null;');
  });
});
