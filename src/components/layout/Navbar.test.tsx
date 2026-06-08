import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

// Minimal Supabase mock — Navbar calls getUser() and onAuthStateChange().
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

// usePlan hits the network — stub it.
vi.mock("@/hooks/use-plan", () => ({
  usePlan: () => ({ plan: "free", loading: false }),
}));

function renderNavbar(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar — visibility & mobile menu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the header pinned with position: fixed so it stays visible while scrolling", () => {
    renderNavbar("/");
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    // Tailwind `fixed` class -> position: fixed (stays in viewport on scroll).
    expect(header.className).toMatch(/\bfixed\b/);
  });

  it("toggles the mobile menu open and closed via the hamburger button", () => {
    renderNavbar("/");
    const toggle = screen.getByRole("button", { name: /open navigation menu/i });

    expect(screen.queryByRole("menu", { name: /mobile navigation menu/i })).toBeNull();

    fireEvent.click(toggle);
    expect(
      screen.getByRole("menu", { name: /mobile navigation menu/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /close navigation menu/i })
    );
    expect(screen.queryByRole("menu", { name: /mobile navigation menu/i })).toBeNull();
  });

  it("closes the mobile menu when clicking outside of it", () => {
    renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(
      screen.getByRole("menu", { name: /mobile navigation menu/i })
    ).toBeInTheDocument();

    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(screen.queryByRole("menu", { name: /mobile navigation menu/i })).toBeNull();
  });

  it("closes the mobile menu when pressing Escape", () => {
    renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(
      screen.getByRole("menu", { name: /mobile navigation menu/i })
    ).toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(screen.queryByRole("menu", { name: /mobile navigation menu/i })).toBeNull();
  });
});
