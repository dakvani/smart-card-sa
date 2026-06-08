import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

vi.mock("@/hooks/use-plan", () => ({
  usePlan: () => ({ plan: "free", loading: false }),
}));

/**
 * The Navbar swaps its background-pill className based on scroll position
 * (`hasScrolled = scrollY > 20`). At rest it uses a softer shadow; once
 * the user scrolls down, an elevated shadow + primary-tinted border kick
 * in so the bar stays readable over page content.
 *
 * The scroll-aware element is the first absolutely-positioned
 * `aria-hidden` sibling inside the <header role="banner">.
 */
function getScrollPill(): HTMLElement {
  const header = screen.getByRole("banner");
  const pill = header.querySelector<HTMLElement>(":scope > [aria-hidden='true']");
  if (!pill) throw new Error("Scroll background pill not found");
  return pill;
}

function setViewport(width: number, height = 800) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  Object.defineProperty(window, "pageYOffset", { configurable: true, value: y });
  window.dispatchEvent(new Event("scroll"));
}

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar — scroll-aware background & shadow", () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    scrollTo(0);
  });

  afterEach(() => {
    setViewport(originalWidth);
    scrollTo(0);
  });

  const viewports: Array<{ label: string; width: number }> = [
    { label: "mobile (375px)", width: 375 },
    { label: "tablet (768px)", width: 768 },
    { label: "desktop (1440px)", width: 1440 },
  ];

  for (const { label, width } of viewports) {
    it(`switches to the elevated shadow + accent border on scroll @ ${label}`, async () => {
      setViewport(width);
      renderNavbar();

      const pill = getScrollPill();

      // At rest: soft resting shadow, neutral border.
      expect(pill.className).toContain("shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)]");
      expect(pill.className).toContain("border-border/50");
      expect(pill.className).not.toContain("border-primary/30");

      // Scrolling past the 20px threshold should swap styles for readability.
      await act(async () => {
        scrollTo(120);
      });

      await waitFor(() => {
        expect(pill.className).toContain(
          "shadow-[0_24px_80px_-16px_rgba(0,0,0,0.6),0_0_0_1px_hsl(var(--primary)/0.25),0_0_60px_-12px_hsl(var(--primary)/0.3)]"
        );
      });
      expect(pill.className).toContain("border-primary/30");
      expect(pill.className).not.toContain("shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)]");

      // Scrolling back to the top reverts the styles.
      await act(async () => {
        scrollTo(0);
      });

      await waitFor(() => {
        expect(pill.className).toContain("shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)]");
      });
      expect(pill.className).not.toContain("border-primary/30");
    });
  }
});
