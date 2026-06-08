/**
 * Regression test: when the Dashboard "Analytics" tab opens, the lazy
 * AnalyticsCharts chunk loads and every major element renders —
 * period selector, summary stat cards, charts container, and the
 * lazy DetailedAnalytics section.
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

// recharts ResponsiveContainer needs a measurable parent in jsdom.
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 600 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 300 });
});

const LazyAnalyticsCharts = lazy(() =>
  import("@/components/dashboard/AnalyticsCharts").then((m) => ({ default: m.AnalyticsCharts }))
);

describe("AnalyticsCharts — dashboard analytics tab regression", () => {
  it("renders every major element once the lazy chunk loads", async () => {
    render(
      <Suspense fallback={<div>loading-fallback</div>}>
        <LazyAnalyticsCharts
          profileId="profile-1"
          links={[
            { id: "l1", title: "Instagram", click_count: 42 },
            { id: "l2", title: "Twitter", click_count: 17 },
          ]}
        />
      </Suspense>
    );

    // Period selector buttons
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Last 7 days/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /Last 30 days/i })).toBeInTheDocument();

    // Summary stat cards
    expect(screen.getByText(/Total Views/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Clicks/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Views\/Day/i)).toBeInTheDocument();
    expect(screen.getByText(/Click Rate/i)).toBeInTheDocument();

    // Chart sections
    expect(screen.getByText(/Profile Views Over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Performing Links/i)).toBeInTheDocument();

    // Lazy DetailedAnalytics section header is rendered immediately
    expect(screen.getByText(/Click Analytics/i)).toBeInTheDocument();
  });
});
