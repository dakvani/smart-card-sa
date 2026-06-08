import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeOnboardingPrefill, deriveUsernameFromEmail, trackOnboarding } from "./onboarding";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics";

const userId = "abcdef1234567890";

describe("deriveUsernameFromEmail", () => {
  it("strips and lowercases the local part of an email", () => {
    expect(deriveUsernameFromEmail("Jane.Doe+test@gmail.com", userId)).toBe("janedoetest");
  });
  it("falls back to user_<id> when email is missing", () => {
    expect(deriveUsernameFromEmail(undefined, userId)).toBe("user_abcdef12");
  });
});

describe("computeOnboardingPrefill (new user)", () => {
  it("pre-populates username, title, and avatar from Google metadata", () => {
    const result = computeOnboardingPrefill({
      userId,
      email: "jane.doe@gmail.com",
      metadata: {
        full_name: "Jane Doe",
        avatar_url: "https://lh3.googleusercontent.com/a/jane",
        provider: "google",
      },
      existing: null,
    });

    expect(result.fields.username).toBe("janedoe");
    expect(result.fields.title).toBe("Jane Doe");
    expect(result.fields.avatar_url).toBe("https://lh3.googleusercontent.com/a/jane");
    expect(result.sources).toEqual({
      username: "email",
      title: "oauth",
      avatar_url: "oauth",
    });
  });

  it("supports Google's `name` and `picture` aliases", () => {
    const result = computeOnboardingPrefill({
      userId,
      email: "alex@example.com",
      metadata: { name: "Alex Smith", picture: "https://img/alex.png" },
      existing: null,
    });
    expect(result.fields.title).toBe("Alex Smith");
    expect(result.fields.avatar_url).toBe("https://img/alex.png");
  });

  it("falls back to user_<id> when no email and no metadata", () => {
    const result = computeOnboardingPrefill({ userId, existing: null });
    expect(result.fields.username).toBe("user_abcdef12");
    expect(result.sources.username).toBe("fallback");
    expect(result.fields.title).toBeUndefined();
    expect(result.fields.avatar_url).toBeUndefined();
  });
});

describe("computeOnboardingPrefill (existing user)", () => {
  it("replaces an auto-generated user_xxxxxxxx username with the email handle", () => {
    const result = computeOnboardingPrefill({
      userId,
      email: "jane.doe@gmail.com",
      metadata: { full_name: "Jane Doe", avatar_url: "https://img/jane.png" },
      existing: { username: "user_abcdef12", title: "@creator", avatar_url: null },
    });
    expect(result.fields.username).toBe("janedoe");
    expect(result.fields.title).toBe("Jane Doe");
    expect(result.fields.avatar_url).toBe("https://img/jane.png");
  });

  it("does not overwrite a user-chosen username or existing avatar", () => {
    const result = computeOnboardingPrefill({
      userId,
      email: "jane@gmail.com",
      metadata: { full_name: "Jane Doe", avatar_url: "https://img/g.png" },
      existing: { username: "janed", title: "Jane D.", avatar_url: "https://my/pic.png" },
    });
    expect(result.fields).toEqual({});
    expect(result.sources).toEqual({ username: "existing", title: "existing", avatar_url: "existing" });
  });
});

describe("trackOnboarding", () => {
  beforeEach(() => {
    (trackEvent as any).mockClear();
  });

  it("emits an event with new-vs-returning and prefilled field flags", () => {
    const prefill = computeOnboardingPrefill({
      userId,
      email: "jane@gmail.com",
      metadata: { full_name: "Jane Doe", picture: "https://x/y.png", provider: "google" },
      existing: null,
    });
    trackOnboarding("onboarding_prefilled", { isNewUser: true, provider: "google", prefill });
    expect(trackEvent).toHaveBeenCalledWith("onboarding_prefilled", expect.objectContaining({
      is_new_user: true,
      provider: "google",
      prefilled_username: true,
      prefilled_title: true,
      prefilled_avatar: true,
      source_username: "email",
      source_title: "oauth",
      source_avatar: "oauth",
    }));
  });

  it("marks returning users with no prefill correctly", () => {
    trackOnboarding("onboarding_skipped", { isNewUser: false, provider: "google" });
    expect(trackEvent).toHaveBeenCalledWith("onboarding_skipped", expect.objectContaining({
      is_new_user: false,
      prefilled_username: false,
      prefilled_title: false,
      prefilled_avatar: false,
      prefilled_fields: "none",
    }));
  });
});
