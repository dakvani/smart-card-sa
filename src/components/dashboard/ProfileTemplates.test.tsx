import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfileTemplates } from "@/components/dashboard/ProfileTemplates";

// Mock sonner so toasts don't render portals
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const sampleTemplates = [
  {
    id: "t-free-1",
    name: "Free Creator",
    description: "Basic creator template",
    category: "creator",
    theme_name: "Midnight",
    theme_gradient: "from-indigo-900 via-purple-900 to-pink-900",
    gradient_direction: "to-b",
    is_premium: false,
    animation_type: null,
  },
  {
    id: "t-pro-1",
    name: "Pro Doctor",
    description: "Premium doctor template",
    category: "doctor",
    theme_name: "OceanPro",
    theme_gradient: "from-cyan-500 via-blue-500 to-indigo-600",
    gradient_direction: "to-b",
    is_premium: true,
    animation_type: "pulse",
  },
];

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: sampleTemplates, error: null }),
      }),
    }),
  },
}));

function renderTemplates(props: { isPro: boolean; onApply?: () => void }) {
  return render(
    <MemoryRouter>
      <ProfileTemplates
        currentThemeName="Midnight"
        isPro={props.isPro}
        onApply={props.onApply || vi.fn()}
      />
    </MemoryRouter>
  );
}

describe("ProfileTemplates — Pro gating", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free user: shows Pro badge and Unlock button on premium templates", async () => {
    renderTemplates({ isPro: false });

    await waitFor(() => expect(screen.getByText("Free Creator")).toBeInTheDocument());

    // Pro badge appears on premium card
    expect(screen.getAllByText(/Pro/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Unlock/i })).toBeInTheDocument();
    // Free template shows Apply
    expect(screen.getByRole("button", { name: /^Apply$/i })).toBeInTheDocument();
  });

  it("Free user: clicking a locked template opens upgrade dialog instead of applying", async () => {
    const onApply = vi.fn();
    renderTemplates({ isPro: false, onApply });

    await waitFor(() => expect(screen.getByText("Pro Doctor")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Unlock/i }));

    await waitFor(() =>
      expect(screen.getByText(/Unlock Pro Doctor/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /Upgrade to Pro/i })).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("Pro user: can apply a premium template (onApply is called with template values)", async () => {
    const onApply = vi.fn();
    renderTemplates({ isPro: true, onApply });

    await waitFor(() => expect(screen.getByText("Pro Doctor")).toBeInTheDocument());

    // No Unlock button for Pro users
    expect(screen.queryByRole("button", { name: /Unlock/i })).not.toBeInTheDocument();

    // Two Apply buttons (one per template) — click the second (premium)
    const applyButtons = screen.getAllByRole("button", { name: /^Apply$/i });
    expect(applyButtons.length).toBe(2);
    fireEvent.click(applyButtons[1]);

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          theme_name: "OceanPro",
          theme_gradient: "from-cyan-500 via-blue-500 to-indigo-600",
          animation_type: "pulse",
        })
      )
    );
  });

  it("Free user: free templates apply normally", async () => {
    const onApply = vi.fn();
    renderTemplates({ isPro: false, onApply });

    await waitFor(() => expect(screen.getByText("Free Creator")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /^Apply$/i }));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({ theme_name: "Midnight" })
      )
    );
  });
});
