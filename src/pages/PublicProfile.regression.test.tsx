/**
 * Regression test: full mount of the PublicProfile page.
 *
 * Verifies every major element renders correctly after the lazy
 * profile + links queries resolve:
 *  - Hero (avatar fallback, title, bio)
 *  - Theme classes / inline gradient applied from profile fields
 *  - Social icons (only the keys with values appear)
 *  - Featured link, regular link, and grouped link sections
 *  - Accessibility scope attribute wired on the root
 *  - "Made with SmartCard" footer for free plan
 *
 * Note: this project has no 18+ / adult / age-gate component, so
 * that requirement is asserted as an explicit absence. If the
 * feature is added later, the absence assertion should be removed
 * and replaced with a positive check.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ---- Fixtures ----
const PROFILE = {
  id: "p-1",
  user_id: "u-1",
  username: "ada",
  title: "Ada Lovelace",
  bio: "First programmer",
  avatar_url: null, // exercise initial-letter fallback
  theme_name: "Midnight",
  theme_gradient: "from-indigo-900 via-purple-900 to-pink-900",
  gradient_direction: "to-b",
  social_links: { instagram: "ada", github: "ada" },
  custom_bg_color: "#101030",
  custom_accent_color: "#8b5cf6",
  animation_type: null,
  animation_speed: 1,
  animation_intensity: 1,
  email_collection_enabled: false,
  plan: "free",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const LINKS = [
  {
    id: "l-feat",
    user_id: "u-1",
    title: "Featured Repo",
    url: "https://example.com/featured",
    visible: true,
    thumbnail_url: null,
    scheduled_start: null,
    scheduled_end: null,
    group_id: null,
    is_featured: true,
    position: 0,
    click_count: 0,
  },
  {
    id: "l-plain",
    user_id: "u-1",
    title: "Personal Site",
    url: "https://example.com",
    visible: true,
    thumbnail_url: null,
    scheduled_start: null,
    scheduled_end: null,
    group_id: null,
    is_featured: false,
    position: 1,
    click_count: 0,
  },
  {
    id: "l-grouped",
    user_id: "u-1",
    title: "Talk: Analytical Engine",
    url: "https://example.com/talk",
    visible: true,
    thumbnail_url: null,
    scheduled_start: null,
    scheduled_end: null,
    group_id: "g-1",
    is_featured: false,
    position: 2,
    click_count: 0,
  },
];

const GROUPS = [{ id: "g-1", name: "Talks", position: 0 }];

// ---- supabase mock that routes per-table ----
function makeChain(result: { data: unknown; error: null }) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    gte: () => chain,
    order: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
    insert: () => Promise.resolve({ data: null, error: null }),
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "profiles") return makeChain({ data: PROFILE, error: null });
      if (table === "links") return makeChain({ data: LINKS, error: null });
      if (table === "link_groups") return makeChain({ data: GROUPS, error: null });
      if (table === "profile_views") return makeChain({ data: null, error: null });
      if (table === "link_clicks") return makeChain({ data: null, error: null });
      return makeChain({ data: [], error: null });
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

// EmailSignup / ClaimSmartCardDialog / AnimatedBackground each pull in
// extra deps we don't care about for this regression — neutralize them.
vi.mock("@/components/profile/EmailSignup", () => ({
  EmailSignup: () => <div data-testid="email-signup" />,
}));
vi.mock("@/components/profile/ClaimSmartCardDialog", () => ({
  ClaimSmartCardDialog: () => <div data-testid="claim-dialog" />,
}));
vi.mock("@/components/profile/AnimatedBackground", () => ({
  AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

import PublicProfile from "@/pages/PublicProfile";
import { ACCESSIBILITY_SCOPE_ATTR } from "@/lib/accessibility";

beforeEach(() => {
  // Stub window.open used by handleLinkClick
  (window as any).open = vi.fn();
});

function renderAtUsername(username = "ada") {
  return render(
    <MemoryRouter initialEntries={[`/${username}`]}>
      <Routes>
        <Route path="/:username" element={<PublicProfile />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicProfile — full mount regression", () => {
  it("renders hero (title + bio + avatar fallback) once data resolves", async () => {
    renderAtUsername();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "Ada Lovelace" })).toBeInTheDocument()
    );
    expect(screen.getByText("First programmer")).toBeInTheDocument();
    // No avatar_url → initial-letter fallback
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("applies the profile's theme colors to the rendered tree", async () => {
    const { container } = renderAtUsername();
    await waitFor(() => screen.getByRole("heading", { level: 1 }));
    // jsdom drops the React-applied `style={{ background: linear-gradient(...) }}`
    // shorthand silently, so we can't observe inline gradient colors. Instead,
    // assert the theme_gradient utility classes (which are React-applied via
    // className) are present in the rendered tree — that's what actually
    // drives the visual color on the live site.
    const html = container.innerHTML;
    expect(html).toContain("from-indigo-900");
    expect(html).toContain("via-purple-900");
    expect(html).toContain("to-pink-900");
  });

  it("renders only the social icons for keys present in social_links", async () => {
    renderAtUsername();
    await waitFor(() => screen.getByRole("heading", { level: 1 }));
    // instagram + github = 2 social anchors should render; others should not.
    const ig = document.querySelector('a[href*="instagram.com/ada"]');
    const gh = document.querySelector('a[href*="github.com/ada"]');
    expect(ig).not.toBeNull();
    expect(gh).not.toBeNull();
    expect(document.querySelector('a[href*="twitter.com"]')).toBeNull();
    expect(document.querySelector('a[href*="youtube.com"]')).toBeNull();
    expect(document.querySelector('a[href*="facebook.com"]')).toBeNull();
    expect(document.querySelector('a[href*="linkedin.com"]')).toBeNull();
  });

  it("renders featured, plain, and grouped link buttons", async () => {
    renderAtUsername();
    await waitFor(() => screen.getByRole("heading", { level: 1 }));
    // Featured section header (the standalone "Featured" label above
    // the starred links). Match the all-caps tracking-wider <p> exactly,
    // not the link title which also contains the word "Featured".
    const featuredHeaders = screen
      .getAllByText(/Featured/i)
      .filter((el) => el.tagName === "P");
    expect(featuredHeaders.length).toBeGreaterThan(0);
    // Link titles render inside <button> rows
    expect(screen.getByText("Featured Repo")).toBeInTheDocument();
    expect(screen.getByText("Personal Site")).toBeInTheDocument();
    // Group header + grouped link
    expect(screen.getByText("Talks")).toBeInTheDocument();
    expect(screen.getByText(/Analytical Engine/i)).toBeInTheDocument();
  });

  it("wires the accessibility scope attribute on the outermost wrapper", async () => {
    const { container } = renderAtUsername();
    await waitFor(() => screen.getByRole("heading", { level: 1 }));
    const scope = container.querySelector(`[${ACCESSIBILITY_SCOPE_ATTR}]`);
    expect(scope).not.toBeNull();
  });

  it("shows the 'Made with SmartCard' footer for free-plan profiles", async () => {
    renderAtUsername();
    await waitFor(() => screen.getByRole("heading", { level: 1 }));
    expect(screen.getByText(/Made with SmartCard/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Join free/i })).toBeInTheDocument();
  });

  it("(documented absence) has no 18+/adult/age-gate warning in the rendered tree", async () => {
    renderAtUsername();
    await waitFor(() => screen.getByRole("heading", { level: 1 }));
    // No such feature exists in the codebase today. If/when an
    // 18+ warning is added, swap this for a positive assertion.
    expect(screen.queryByText(/18\+/)).toBeNull();
    expect(screen.queryByText(/adult content/i)).toBeNull();
    expect(screen.queryByRole("dialog", { name: /age/i })).toBeNull();
  });
});
