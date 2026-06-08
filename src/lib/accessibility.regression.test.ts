/**
 * Regression tests for accessibility scoping.
 *
 * These guard two prior bugs:
 *  1. Accessibility classes / CSS variables leaking into the dashboard,
 *     admin pages, or any internal UI (must stay inside the scoped
 *     `[data-accessibility-scope]` container only).
 *  2. The public share view skipping preference application when the
 *     viewer is the profile owner — the public/live view must always
 *     reflect saved preferences, regardless of who is viewing.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  ACCESSIBILITY_SCOPE_ATTR,
  ACCESSIBILITY_STORAGE_KEY,
  applyAccessibilityPreferencesToScope,
  defaultAccessibilityPreferences,
  loadAccessibilityPreferences,
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

const STYLE_VARS = [
  "--accessibility-font-scale",
  "--accessibility-line-height",
];

function resetDom() {
  document.documentElement.removeAttribute(ACCESSIBILITY_SCOPE_ATTR);
  document.body.removeAttribute(ACCESSIBILITY_SCOPE_ATTR);
  LEAK_CLASSES.forEach((c) => {
    document.documentElement.classList.remove(c);
    document.body.classList.remove(c);
  });
  STYLE_VARS.forEach((v) => {
    document.documentElement.style.removeProperty(v);
    document.body.style.removeProperty(v);
  });
  document.body.innerHTML = "";
  localStorage.clear();
}

describe("accessibility regression — owner dashboard stays untouched", () => {
  beforeEach(resetDom);

  it("does not add scope attribute or classes to the dashboard subtree", () => {
    // Simulate dashboard layout: NO [data-accessibility-scope] anywhere.
    const dashboardRoot = document.createElement("div");
    dashboardRoot.id = "dashboard-root";
    dashboardRoot.innerHTML = `
      <header id="dash-header"><button>Share</button></header>
      <aside id="dash-side"><a href="#">Links</a></aside>
      <main id="dash-main"><h1>Welcome</h1><p>Body text</p></main>
    `;
    document.body.appendChild(dashboardRoot);

    // What AccessibilitySettings does after a toggle: look up an existing
    // scope and apply preferences only if one exists. On internal pages
    // there is none, so this must be a no-op.
    const scope = document.querySelector<HTMLElement>(
      "[data-accessibility-scope]",
    );
    expect(scope).toBeNull();
    applyAccessibilityPreferencesToScope(scope, FULLY_ENABLED);

    const everyEl = [
      dashboardRoot,
      ...Array.from(dashboardRoot.querySelectorAll<HTMLElement>("*")),
      document.documentElement,
      document.body,
    ];
    for (const el of everyEl) {
      expect(el.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(false);
      for (const c of LEAK_CLASSES) {
        expect(el.classList.contains(c)).toBe(false);
      }
      for (const v of STYLE_VARS) {
        expect(el.style.getPropertyValue(v)).toBe("");
      }
    }
  });

  it("applies only inside the scoped preview when dashboard hosts a live preview", () => {
    // Dashboard with an embedded preview container that IS the public share
    // view scope (e.g. the in-dashboard "Live Preview" phone mockup).
    const dashboard = document.createElement("div");
    dashboard.id = "dashboard";
    dashboard.innerHTML = `
      <section id="dash-panel"><p id="dash-text">Internal copy</p></section>
    `;
    const preview = document.createElement("div");
    preview.id = "live-preview-scope";
    preview.setAttribute(ACCESSIBILITY_SCOPE_ATTR, "");
    preview.innerHTML = `<h1 id="preview-title">Bio</h1>`;
    dashboard.appendChild(preview);
    document.body.appendChild(dashboard);

    const scope = document.querySelector<HTMLElement>(
      "[data-accessibility-scope]",
    );
    expect(scope).toBe(preview);
    applyAccessibilityPreferencesToScope(scope, FULLY_ENABLED);

    // Preview scope gets all the classes + style vars.
    for (const c of LEAK_CLASSES) {
      expect(preview.classList.contains(c)).toBe(true);
    }
    for (const v of STYLE_VARS) {
      expect(preview.style.getPropertyValue(v)).not.toBe("");
    }

    // Dashboard surroundings stay clean.
    const dashText = dashboard.querySelector<HTMLElement>("#dash-text")!;
    const panel = dashboard.querySelector<HTMLElement>("#dash-panel")!;
    for (const el of [dashboard, panel, dashText, document.documentElement, document.body]) {
      expect(el.hasAttribute(ACCESSIBILITY_SCOPE_ATTR)).toBe(false);
      for (const c of LEAK_CLASSES) {
        expect(el.classList.contains(c)).toBe(false);
      }
      for (const v of STYLE_VARS) {
        expect(el.style.getPropertyValue(v)).toBe("");
      }
    }
  });

  it("public share view applies saved preferences for every viewer (including owner)", () => {
    // Persist a saved preference set the way AccessibilitySettings would.
    localStorage.setItem(
      ACCESSIBILITY_STORAGE_KEY,
      JSON.stringify(FULLY_ENABLED),
    );

    // Mimic PublicProfile rendering the scoped container. The component
    // must NOT gate this on owner/visitor — that was a prior bug where
    // owners previewing their own public page saw no a11y styles.
    const publicScope = document.createElement("div");
    publicScope.setAttribute(ACCESSIBILITY_SCOPE_ATTR, "");
    document.body.appendChild(publicScope);

    const prefs = loadAccessibilityPreferences();
    applyAccessibilityPreferencesToScope(publicScope, prefs);

    for (const c of LEAK_CLASSES) {
      expect(publicScope.classList.contains(c)).toBe(true);
    }
    expect(publicScope.style.getPropertyValue("--accessibility-font-scale"))
      .not.toBe("");
    expect(publicScope.style.getPropertyValue("--accessibility-line-height"))
      .toBe(String(FULLY_ENABLED.lineHeight));
  });

  it("admin-style page (no scope element) is never mutated", () => {
    const admin = document.createElement("div");
    admin.id = "admin-dashboard";
    admin.innerHTML = `<table><tr><td>User</td></tr></table>`;
    document.body.appendChild(admin);

    const scope = document.querySelector<HTMLElement>(
      "[data-accessibility-scope]",
    );
    applyAccessibilityPreferencesToScope(scope, FULLY_ENABLED);

    for (const c of LEAK_CLASSES) {
      expect(admin.classList.contains(c)).toBe(false);
      expect(document.body.classList.contains(c)).toBe(false);
      expect(document.documentElement.classList.contains(c)).toBe(false);
    }
  });
});
