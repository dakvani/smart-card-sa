/**
 * Safeguard tests: accessibility preferences must ONLY affect a scoped
 * container (the public bio profile). They must never leak onto
 * documentElement, body, or any dashboard/internal page.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  ACCESSIBILITY_SCOPE_ATTR,
  applyAccessibilityPreferencesToScope,
  defaultAccessibilityPreferences,
} from "@/lib/accessibility";

const FULLY_ENABLED = {
  ...defaultAccessibilityPreferences,
  fontSize: "extra-large" as const,
  fontFamily: "dyslexia" as const,
  reducedMotion: true,
  screenReaderOptimized: true,
  highContrastText: true,
  focusIndicators: true,
  lineHeight: 2,
};

const LEAK_CLASSES = [
  "accessibility-large-text",
  "dyslexia-font",
  "reduce-motion",
  "screen-reader-optimized",
  "high-contrast-text",
  "enhanced-focus",
];

describe("accessibility scoping safeguard", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute(ACCESSIBILITY_SCOPE_ATTR);
    document.body.removeAttribute(ACCESSIBILITY_SCOPE_ATTR);
    LEAK_CLASSES.forEach((c) => {
      document.documentElement.classList.remove(c);
      document.body.classList.remove(c);
    });
    document.body.innerHTML = "";
  });

  it("applies all accessibility classes to the scoped element", () => {
    const scope = document.createElement("div");
    document.body.appendChild(scope);

    applyAccessibilityPreferencesToScope(scope, FULLY_ENABLED);

    expect(scope.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(true);
    for (const c of LEAK_CLASSES) {
      expect(scope.classList.contains(c)).toBe(true);
    }
  });

  it("never touches documentElement when applying to a scoped element", () => {
    const scope = document.createElement("div");
    document.body.appendChild(scope);

    applyAccessibilityPreferencesToScope(scope, FULLY_ENABLED);

    expect(document.documentElement.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(false);
    for (const c of LEAK_CLASSES) {
      expect(document.documentElement.classList.contains(c)).toBe(false);
      expect(document.body.classList.contains(c)).toBe(false);
    }
  });

  it("refuses to apply preferences to documentElement", () => {
    applyAccessibilityPreferencesToScope(document.documentElement, FULLY_ENABLED);
    for (const c of LEAK_CLASSES) {
      expect(document.documentElement.classList.contains(c)).toBe(false);
    }
    expect(document.documentElement.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(false);
  });

  it("refuses to apply preferences to body", () => {
    applyAccessibilityPreferencesToScope(document.body, FULLY_ENABLED);
    for (const c of LEAK_CLASSES) {
      expect(document.body.classList.contains(c)).toBe(false);
    }
    expect(document.body.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(false);
  });

  it("does not affect sibling/internal page containers", () => {
    const scope = document.createElement("div");
    scope.id = "bio-profile";
    const dashboard = document.createElement("div");
    dashboard.id = "dashboard";
    dashboard.innerHTML = '<p id="dash-text">Hello</p>';
    document.body.append(scope, dashboard);

    applyAccessibilityPreferencesToScope(scope, FULLY_ENABLED);

    for (const c of LEAK_CLASSES) {
      expect(dashboard.classList.contains(c)).toBe(false);
    }
    expect(dashboard.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(false);
  });

  it("CSS source has no unscoped accessibility selectors", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const css = await fs.readFile(
      path.resolve(__dirname, "../index.css"),
      "utf-8",
    );

    // Strip comments so the safeguard message doesn't trigger false positives.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

    for (const klass of LEAK_CLASSES) {
      const unscoped = new RegExp(`(^|[^\\]])\\.${klass}\\b`, "m");
      const scopedOnly = new RegExp(
        `\\[data-accessibility-scope\\]\\.${klass}\\b`,
      );
      const matches = stripped.match(new RegExp(`\\.${klass}\\b`, "g")) ?? [];
      // Every occurrence must be preceded by the scope attribute selector.
      const scopedMatches =
        stripped.match(
          new RegExp(`\\[data-accessibility-scope\\]\\.${klass}\\b`, "g"),
        ) ?? [];
      expect(
        matches.length,
        `expected all .${klass} CSS selectors to be scoped under [data-accessibility-scope]`,
      ).toBe(scopedMatches.length);
      expect(scopedOnly.test(stripped)).toBe(true);
      // Silence unused warning.
      void unscoped;
    }
  });
});
