// Pure helpers + analytics for Google OAuth onboarding prefill on the dashboard.
// Kept dependency-free so it's easily unit-testable.
import { trackEvent } from "@/lib/analytics";

export interface OAuthMetadataLike {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
  provider?: string;
  [key: string]: any;
}

export interface ExistingProfileLike {
  username: string;
  title: string | null;
  avatar_url: string | null;
}

export interface OnboardingPrefill {
  /** Fields the dashboard should apply (patch) to the profile. */
  fields: { username?: string; title?: string; avatar_url?: string };
  /** Which fields came from Google metadata vs email vs nothing. */
  sources: {
    username: "email" | "fallback" | "existing";
    title: "oauth" | "existing";
    avatar_url: "oauth" | "existing";
  };
  /** Computed email-derived username, even if not applied. */
  emailUsername: string;
}

/** Strip an email to a safe lower-case username slug. */
export function deriveUsernameFromEmail(email: string | undefined, userId: string): string {
  const local = email?.split("@")[0]?.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
  if (local && local.length > 0) return local;
  return `user_${userId.slice(0, 8)}`;
}

/**
 * Pure: compute what should be prefilled on the user's profile based on
 * OAuth metadata. Does not perform any DB writes. The caller decides what
 * to do with the result (apply immediately for new users, or show a
 * confirmation dialog for returning users with an auto-generated username).
 */
export function computeOnboardingPrefill(args: {
  userId: string;
  email?: string;
  metadata?: OAuthMetadataLike | null;
  existing?: ExistingProfileLike | null;
}): OnboardingPrefill {
  const { userId, email, metadata, existing } = args;
  const emailUsername = deriveUsernameFromEmail(email, userId);
  const oauthName = metadata?.full_name || metadata?.name;
  const oauthAvatar = metadata?.avatar_url || metadata?.picture;

  const fields: OnboardingPrefill["fields"] = {};
  const sources: OnboardingPrefill["sources"] = {
    username: "existing",
    title: "existing",
    avatar_url: "existing",
  };

  // No existing profile → propose a fully-populated one.
  if (!existing) {
    fields.username = emailUsername;
    sources.username = emailUsername.startsWith("user_") ? "fallback" : "email";
    if (oauthName) {
      fields.title = oauthName;
      sources.title = "oauth";
    }
    if (oauthAvatar) {
      fields.avatar_url = oauthAvatar;
      sources.avatar_url = "oauth";
    }
    return { fields, sources, emailUsername };
  }

  // Existing profile → only fill the gaps left by the auto-generated values.
  if (/^user_[a-f0-9]{8}$/i.test(existing.username) && !emailUsername.startsWith("user_")) {
    fields.username = emailUsername;
    sources.username = "email";
  }
  if (oauthName && (!existing.title || existing.title === "@creator" || existing.title === `@${existing.username}`)) {
    fields.title = oauthName;
    sources.title = "oauth";
  }
  if (oauthAvatar && !existing.avatar_url) {
    fields.avatar_url = oauthAvatar;
    sources.avatar_url = "oauth";
  }
  return { fields, sources, emailUsername };
}

export type OnboardingEvent =
  | "onboarding_started"
  | "onboarding_prefilled"
  | "onboarding_confirmed"
  | "onboarding_edited"
  | "onboarding_skipped";

export interface OnboardingTrackContext {
  isNewUser: boolean;
  provider?: string;
  prefill?: OnboardingPrefill;
}

/** Emit a single onboarding analytics event with the standard shape. */
export function trackOnboarding(event: OnboardingEvent, ctx: OnboardingTrackContext) {
  const fields = ctx.prefill?.fields ?? {};
  const sources = ctx.prefill?.sources;
  trackEvent(event, {
    is_new_user: ctx.isNewUser,
    provider: ctx.provider ?? "unknown",
    prefilled_username: Boolean(fields.username),
    prefilled_title: Boolean(fields.title),
    prefilled_avatar: Boolean(fields.avatar_url),
    prefilled_fields: Object.keys(fields).join(",") || "none",
    source_username: sources?.username ?? "existing",
    source_title: sources?.title ?? "existing",
    source_avatar: sources?.avatar_url ?? "existing",
  });
}
