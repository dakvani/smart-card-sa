/**
 * Regression tests for the lazy-loaded modules wired into Dashboard,
 * AdminDashboard, and ProductCard. Verifies dynamic imports resolve
 * AND expose the expected named exports — so renaming/removing an
 * export will fail tests instead of silently breaking the lazy chunk
 * at runtime (which only blows up when the user opens the tab/modal).
 */
import { describe, it, expect, vi } from "vitest";

// Mock supabase so components that import it at module load don't crash.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        }),
        gte: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  },
}));

describe("lazy module regression", () => {
  it("AnalyticsCharts dynamic import resolves with named export", async () => {
    const mod = await import("@/components/dashboard/AnalyticsCharts");
    expect(typeof mod.AnalyticsCharts).toBe("function");
  });

  it("DetailedAnalytics dynamic import resolves with named export", async () => {
    const mod = await import("@/components/dashboard/DetailedAnalytics");
    expect(typeof mod.DetailedAnalytics).toBe("function");
  });

  it("AdminOverviewCharts dynamic import resolves with named export", async () => {
    const mod = await import("@/components/admin/AdminOverviewCharts");
    expect(typeof mod.AdminOverviewCharts).toBe("function");
  });

  it("Product3DViewer dynamic import resolves with named export", async () => {
    const mod = await import("@/components/products/Product3DViewer");
    expect(typeof mod.Product3DViewer).toBe("function");
  });
});
