/**
 * Regression smoke tests for the three page-level routes that own the
 * lazy-loaded tabs/modals: Dashboard, AdminDashboard, PublicProfile.
 *
 * Full DOM mounts are intentionally avoided — each page wires dozens
 * of supabase tables, framer-motion, react-router, QR codes, and
 * realtime subscriptions, which makes a complete jsdom mount brittle.
 *
 * Instead we guarantee the surface that historically regressed:
 *  1. The module loads without throwing (catches missing imports,
 *     broken lazy chunks, removed exports).
 *  2. The default export is a React component (function).
 *
 * The per-tab visual content is verified by:
 *   - AnalyticsCharts.regression.test.tsx (dashboard analytics tab)
 *   - AdminOverviewCharts.regression.test.tsx (admin overview)
 *   - accessibility.regression.test.ts (public profile a11y scope)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const ok = { data: [], error: null };
  const chain: any = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === "then") return undefined;
        if (prop === "single" || prop === "maybeSingle") return () => Promise.resolve(ok);
        return (..._args: unknown[]) => chain;
      },
    }
  );
  // Allow the chain to be awaited as a query result too.
  (chain as any).then = (resolve: (v: typeof ok) => unknown) => Promise.resolve(ok).then(resolve);

  return {
    supabase: {
      from: () => chain,
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      removeChannel: () => {},
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
      storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }) }) },
    },
  };
});

describe("page module regression — Dashboard / AdminDashboard / PublicProfile", () => {
  it("Dashboard page module loads and exports a component", async () => {
    const mod = await import("@/pages/Dashboard");
    expect(typeof mod.default).toBe("function");
  });

  it("AdminDashboard page module loads and exports a component", async () => {
    const mod = await import("@/pages/AdminDashboard");
    expect(typeof mod.default).toBe("function");
  });

  it("PublicProfile page module loads and exports a component", async () => {
    const mod = await import("@/pages/PublicProfile");
    expect(typeof mod.default).toBe("function");
  });
});
