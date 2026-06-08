/**
 * Regression test: when the AdminDashboard overview opens, the lazy
 * AdminOverviewCharts chunk loads and every major element renders —
 * period selector, summary cards (Revenue / Orders / New Users), and
 * the three chart cards.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, lazy } from "react";

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
});

const LazyAdminCharts = lazy(() =>
  import("@/components/admin/AdminOverviewCharts").then((m) => ({ default: m.AdminOverviewCharts }))
);

describe("AdminOverviewCharts — admin overview regression", () => {
  it("renders every major element once the lazy chunk loads", async () => {
    render(
      <Suspense fallback={<div>loading-fallback</div>}>
        <LazyAdminCharts />
      </Suspense>
    );

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
