/**
 * Regression test: when the AdminDashboard overview loads, the
 * AdminOverviewCharts component (which lives behind a React.lazy
 * chunk in the page) renders every major UI element after its
 * supabase data load finishes — period selector, three summary
 * cards, and three chart card titles.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => {
  const ok = { data: [], error: null };
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    order: () => Promise.resolve(ok),
  };
  return { supabase: { from: () => chain } };
});

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 600 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 300 });
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import { AdminOverviewCharts } from "@/components/admin/AdminOverviewCharts";

describe("AdminOverviewCharts — admin overview regression", () => {
  it("renders every major element once the lazy chunk loads", async () => {
    render(<AdminOverviewCharts />);

    // Header + period buttons
    await waitFor(() =>
      expect(screen.getByText(/Trends & Analytics/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /^7 days$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^30 days$/i })).toBeInTheDocument();

    // Summary cards
    expect(screen.getByText(/Revenue \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Orders \(/i)).toBeInTheDocument();
    expect(screen.getByText(/New Users \(/i)).toBeInTheDocument();

    // Chart card titles
    expect(screen.getByText(/Revenue Over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/User Growth/i)).toBeInTheDocument();
  });
});
