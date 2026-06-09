/**
 * ScrollStory motion config — single source of truth for timings, easing,
 * stage thresholds, and ambient parallax. Tweak here to iterate feel without
 * touching the component.
 */

import type { Transition } from "framer-motion";

export const SCROLL_STORY_CONFIG = {
  /** Number of stages in the narrative. Section height = STAGES * 100vh. */
  stages: 4,

  /** Vertical viewport multiplier per stage. Larger = more scroll per stage. */
  viewportPerStage: 1,

  /**
   * Stage cross-fade window, expressed as fractions of a single stage span.
   * `enterPad` extends the fade-in before the stage start; `exitPad` extends
   * the fade-out past the stage end; `fadeIn`/`fadeOut` are the actual ramps.
   * Keep enterPad + fadeIn small to avoid two stages reading simultaneously.
   */
  stageWindow: {
    enterPad: 0.04,
    fadeIn: 0.06,
    fadeOut: 0.06,
    exitPad: 0.04,
  },

  /** Spring smoothing applied to scrollYProgress before driving transforms. */
  spring: {
    stiffness: 140,
    damping: 28,
    mass: 0.35,
    restDelta: 0.0005,
  } satisfies Transition,

  /** Ambient parallax orbs (background). */
  orbs: {
    a: {
      travelY: -160,
      travelX: 40,
      opacity: [0.55, 0.7, 0.4] as [number, number, number],
    },
    b: {
      travelY: 140,
      travelX: -40,
      opacity: [0.4, 0.7, 0.55] as [number, number, number],
    },
  },

  /** Subtle stage container breathing across scroll. */
  stageScale: [0.98, 1, 1, 1, 0.99] as number[],

  /** Smooth scroll behavior for CTA anchors. */
  scrollBehavior: "smooth" as ScrollBehavior,
} as const;

/**
 * Build a 4-point cross-fade window for a stage, clamped & monotonic.
 * Returns the offsets that feed useTransform alongside [0, 1, 1, 0] outputs.
 */
export function stageFadeStops(index: number): [number, number, number, number] {
  const { stages, stageWindow } = SCROLL_STORY_CONFIG;
  const span = 1 / stages;
  const start = index * span;
  const end = (index + 1) * span;
  const raw = [
    start - stageWindow.enterPad,
    start + stageWindow.fadeIn,
    end - stageWindow.fadeOut,
    end + stageWindow.exitPad,
  ];
  const out: number[] = [];
  let prev = -Infinity;
  for (const v of raw) {
    let c = Math.max(0, Math.min(1, v));
    if (c <= prev) c = Math.min(1, prev + 0.0001);
    out.push(c);
    prev = c;
  }
  return out as [number, number, number, number];
}

/** Smoothly scroll to an element id or selector, respecting reduced motion. */
export function smoothScrollTo(target: string) {
  const el = target.startsWith("#")
    ? document.querySelector(target)
    : document.getElementById(target);
  if (!el) return;
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({
    behavior: prefersReduced ? "auto" : SCROLL_STORY_CONFIG.scrollBehavior,
    block: "start",
  });
}
