/**
 * Regression tests for the Dashboard "Appearance" tab.
 *
 * The Dashboard page itself is a 1,100-line monolith that mounts
 * auth, plan, realtime, templates, and many supabase tables — full
 * mounts in jsdom are brittle. So we test the Appearance-tab
 * components in isolation against the same `onUpdate` contract the
 * Dashboard passes them, which is what actually drives the live
 * preview update on the page.
 *
 * Covers:
 *  - ThemeCustomizer: preset selection, custom color inputs (incl. a
 *    dark "Deep Space" preset that exercises dark-mode-style themes),
 *    gradient direction, animation selection + animation controls.
 *  - AvatarUpload: upload UI renders with fallback, fires onUpload
 *    after a successful storage upload.
 *
 * Note: there is no separate "button shape" selector in the
 * Appearance tab today — link/button shape is implicit in the theme.
 * The relevant assertion is included as a documented absence.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// supabase storage mock for AvatarUpload
vi.mock("@/integrations/supabase/client", () => {
  const storage = {
    from: () => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "https://cdn.example.com/u-1/avatar.png" } }),
    }),
  };
  return { supabase: { storage } };
});

import { ThemeCustomizer } from "@/components/dashboard/ThemeCustomizer";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";

describe("Appearance tab — ThemeCustomizer", () => {
  const baseProps = {
    themeName: "Midnight",
    themeGradient: "from-indigo-900 via-purple-900 to-pink-900",
    customBgColor: null as string | null,
    customAccentColor: null as string | null,
    gradientDirection: "to-b",
    animationType: null as string | null,
    animationSpeed: 1,
    animationIntensity: 1,
  };

  it("renders the preset grid (including the dark 'Deep Space' theme)", () => {
    render(<ThemeCustomizer {...baseProps} onUpdate={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Midnight" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deep Space" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sunset" })).toBeInTheDocument();
  });

  it("selecting a preset fires onUpdate with the theme + gradient (drives live preview)", () => {
    const onUpdate = vi.fn();
    render(<ThemeCustomizer {...baseProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "Deep Space" }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        theme_name: "Deep Space",
        theme_gradient: expect.stringContaining("slate-900"),
        custom_bg_color: null,
        custom_accent_color: null,
      })
    );
  });

  it("expanding Custom Colors reveals bg + accent color inputs and updates fire onUpdate", () => {
    const onUpdate = vi.fn();
    render(<ThemeCustomizer {...baseProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Custom Colors/i }));

    const bgInput = screen.getByPlaceholderText("#1e1b4b") as HTMLInputElement;
    const accentInput = screen.getByPlaceholderText("#8b5cf6") as HTMLInputElement;
    expect(bgInput).toBeInTheDocument();
    expect(accentInput).toBeInTheDocument();

    fireEvent.change(bgInput, { target: { value: "#222244" } });
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme_name: "Custom", custom_bg_color: "#222244" })
    );

    fireEvent.change(accentInput, { target: { value: "#ff00aa" } });
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme_name: "Custom", custom_accent_color: "#ff00aa" })
    );
  });

  it("changing the gradient direction fires onUpdate with gradient_direction", () => {
    const onUpdate = vi.fn();
    render(<ThemeCustomizer {...baseProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Custom Colors/i }));
    fireEvent.click(screen.getByRole("button", { name: /Diagonal$/ }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ gradient_direction: "to-br" })
    );
  });

  it("selecting an animation type reveals speed/intensity sliders and presets", () => {
    const onUpdate = vi.fn();
    const { rerender } = render(<ThemeCustomizer {...baseProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /Custom Colors/i }));
    fireEvent.click(screen.getByRole("button", { name: /Pulse/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ animation_type: "pulse" })
    );

    // After Dashboard re-renders with the new animationType, the
    // animation controls should be visible.
    rerender(
      <ThemeCustomizer {...baseProps} animationType="pulse" onUpdate={onUpdate} />
    );
    expect(screen.getByText(/Quick Presets/i)).toBeInTheDocument();
    // "Speed:" appears in both the slider label and the preview overlay,
    // so use getAllByText and assert at least one.
    expect(screen.getAllByText(/Speed:\s*1\.0/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Intensity:\s*1\.0/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Animation Preview/i)).toBeInTheDocument();
  });

  it("(documented absence) Appearance tab exposes no separate button-shape selector", () => {
    render(<ThemeCustomizer {...baseProps} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Custom Colors/i }));
    // Button/link shape is implicit in the theme today; there is no
    // dedicated shape selector. If one is added, replace this with
    // a positive assertion.
    expect(screen.queryByText(/button shape/i)).toBeNull();
    expect(screen.queryByText(/corner radius/i)).toBeNull();
    expect(screen.queryByText(/pill|rounded|square/i)).toBeNull();
  });
});

describe("Appearance tab — AvatarUpload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the username initial fallback + click-to-upload UI when no avatar", () => {
    render(
      <AvatarUpload
        userId="u-1"
        currentAvatarUrl={null}
        username="ada"
        onUpload={vi.fn()}
      />
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText(/Click to upload avatar/i)).toBeInTheDocument();
  });

  it("renders the current avatar when one exists", () => {
    render(
      <AvatarUpload
        userId="u-1"
        currentAvatarUrl="https://cdn.example.com/u-1/avatar.png"
        username="ada"
        onUpload={vi.fn()}
      />
    );
    const img = screen.getByRole("img", { name: "ada" }) as HTMLImageElement;
    expect(img.src).toContain("avatar.png");
  });

  it("calls onUpload with the public URL after a successful image upload", async () => {
    const onUpload = vi.fn();
    const { container } = render(
      <AvatarUpload
        userId="u-1"
        currentAvatarUrl={null}
        username="ada"
        onUpload={onUpload}
      />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "avatar.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(onUpload).toHaveBeenCalledWith("https://cdn.example.com/u-1/avatar.png")
    );
  });
});
