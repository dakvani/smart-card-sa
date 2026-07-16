import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Palette regression: pins the brand indigo→purple gradient across every theme
 * variant so accessibility themes (protanopia/deuteranopia/tritanopia/etc.)
 * cannot silently drift the CTA to a non-brand palette.
 */
const BRAND_GRADIENT =
  "linear-gradient(135deg, hsl(243 75% 59%) 0%, hsl(271 81% 56%) 100%)";

describe("brand palette tokens", () => {
  const css = readFileSync(
    path.resolve(__dirname, "../index.css"),
    "utf-8",
  );

  it("every --gradient-primary declaration uses the brand indigo→purple gradient", () => {
    const matches = css.match(/--gradient-primary:\s*[^;]+;/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(7); // root + light + 5 a11y themes
    for (const line of matches) {
      expect(line).toContain(BRAND_GRADIENT);
    }
  });

  it("ScrollStory CTA renders with the gradient-primary token, not a hardcoded gradient", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../components/home/ScrollStory.tsx"),
      "utf-8",
    );
    // Both CTAs must use the semantic token
    const ctaMatches = src.match(/data-testid="cta-shop-smartcards[^"]*"[^>]*className="([^"]+)"/g) ?? [];
    expect(ctaMatches.length).toBe(2);
    for (const m of ctaMatches) {
      expect(m).toContain("gradient-primary");
      // Guard against reintroducing hardcoded off-brand gradients
      expect(m).not.toMatch(/from-(teal|cyan|amber|yellow|orange|red|green)-/);
    }
  });
});
