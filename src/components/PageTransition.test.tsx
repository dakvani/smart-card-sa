import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Regression guard: PageTransition must NOT animate `transform` or `filter`.
 *
 * Those properties create a containing block for `position: fixed`
 * descendants (the Navbar), which makes the fixed header scroll away
 * with the page content. If this test fails, the navbar will disappear
 * while scrolling on every page that wraps its content in PageTransition.
 */
describe("PageTransition (navbar visibility regression)", () => {
  const source = readFileSync(
    path.resolve(__dirname, "./PageTransition.tsx"),
    "utf-8"
  );

  // Isolate the pageVariants block so we don't false-positive on
  // unrelated mentions (LoadingSkeleton uses `rotate`, etc.).
  const variantsBlock =
    source.match(/const pageVariants\s*=\s*{[\s\S]*?};/)?.[0] ?? "";

  it("defines pageVariants", () => {
    expect(variantsBlock).not.toBe("");
  });

  it("does not animate `y` / translate in pageVariants", () => {
    expect(variantsBlock).not.toMatch(/\by\s*:/);
    expect(variantsBlock).not.toMatch(/translate/i);
  });

  it("does not animate `filter` / blur in pageVariants", () => {
    expect(variantsBlock).not.toMatch(/filter\s*:/);
    expect(variantsBlock).not.toMatch(/blur\(/);
  });

  it("does not animate `scale` / `rotate` in pageVariants", () => {
    expect(variantsBlock).not.toMatch(/\bscale\s*:/);
    expect(variantsBlock).not.toMatch(/\brotate\s*:/);
  });
});
