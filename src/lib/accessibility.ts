/**
 * Scoped accessibility preferences for the public bio profile.
 *
 * IMPORTANT: These styles are intentionally NOT applied to the global
 * `document.documentElement`. They only affect elements that live inside a
 * container marked with `[data-accessibility-scope]` (rendered by
 * `PublicProfile`). The dashboard and internal pages must remain unaffected.
 */

export interface AccessibilityPreferences {
  fontSize: "small" | "medium" | "large" | "extra-large";
  fontFamily: "default" | "dyslexia";
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  highContrastText: boolean;
  focusIndicators: boolean;
  lineHeight: number;
}

export const ACCESSIBILITY_SCOPE_ATTR = "data-accessibility-scope";
export const ACCESSIBILITY_STORAGE_KEY = "accessibility-preferences";

export const fontSizeScale: Record<AccessibilityPreferences["fontSize"], number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
  "extra-large": 1.25,
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  fontSize: "medium",
  fontFamily: "default",
  reducedMotion: false,
  screenReaderOptimized: false,
  highContrastText: false,
  focusIndicators: true,
  lineHeight: 1.5,
};

export function loadAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") return defaultAccessibilityPreferences;
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return defaultAccessibilityPreferences;
    return { ...defaultAccessibilityPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultAccessibilityPreferences;
  }
}

/**
 * Apply preferences ONLY to a scoped element. Never call this with
 * `document.documentElement` or `document.body` — accessibility styling must
 * stay limited to the public bio profile.
 */
export function applyAccessibilityPreferencesToScope(
  el: HTMLElement | null | undefined,
  prefs: AccessibilityPreferences,
): void {
  if (!el) return;
  if (el === document.documentElement || el === document.body) {
    if (typeof console !== "undefined") {
      console.warn(
        "[accessibility] Refusing to apply scoped preferences to <html>/<body>.",
      );
    }
    return;
  }
  el.setAttribute(ACCESSIBILITY_SCOPE_ATTR, "");
  el.style.setProperty("--accessibility-font-scale", String(fontSizeScale[prefs.fontSize]));
  el.style.setProperty("--accessibility-line-height", String(prefs.lineHeight));
  el.classList.toggle(
    "accessibility-large-text",
    prefs.fontSize === "large" || prefs.fontSize === "extra-large",
  );
  el.classList.toggle("dyslexia-font", prefs.fontFamily === "dyslexia");
  el.classList.toggle("reduce-motion", prefs.reducedMotion);
  el.classList.toggle("screen-reader-optimized", prefs.screenReaderOptimized);
  el.classList.toggle("high-contrast-text", prefs.highContrastText);
  el.classList.toggle("enhanced-focus", prefs.focusIndicators);
}
