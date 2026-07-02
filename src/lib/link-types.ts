// Link type helpers: derive a "type" from a stored URL, and build a URL
// from a user-entered handle/number. Type is not persisted — it's inferred
// from the URL so no schema changes are required.

export type LinkType =
  | "custom"
  | "phone"
  | "email"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "github"
  | "website";

export interface LinkTypeDef {
  value: LinkType;
  label: string;
  placeholder: string;
  /** Human-friendly hint shown under the input. */
  hint?: string;
}

export const LINK_TYPES: LinkTypeDef[] = [
  { value: "custom", label: "Custom URL", placeholder: "https://..." },
  { value: "phone", label: "Phone (tap to call)", placeholder: "+1 555 123 4567", hint: "Opens the dialer on tap" },
  { value: "email", label: "Email", placeholder: "you@example.com" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "+1 555 123 4567" },
  { value: "instagram", label: "Instagram", placeholder: "username" },
  { value: "facebook", label: "Facebook", placeholder: "username or page" },
  { value: "twitter", label: "X / Twitter", placeholder: "username" },
  { value: "linkedin", label: "LinkedIn", placeholder: "in/username" },
  { value: "youtube", label: "YouTube", placeholder: "@channel" },
  { value: "tiktok", label: "TikTok", placeholder: "username" },
  { value: "github", label: "GitHub", placeholder: "username" },
  { value: "website", label: "Website", placeholder: "example.com" },
];

const SOCIAL_HOSTS: Record<Exclude<LinkType, "custom" | "phone" | "email" | "whatsapp" | "website">, string> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  twitter: "x.com",
  linkedin: "linkedin.com",
  youtube: "youtube.com",
  tiktok: "tiktok.com",
  github: "github.com",
};

export function detectLinkType(url: string): LinkType {
  const u = (url || "").trim().toLowerCase();
  if (!u) return "custom";
  if (u.startsWith("tel:")) return "phone";
  if (u.startsWith("mailto:")) return "email";
  if (u.startsWith("https://wa.me/") || u.startsWith("https://api.whatsapp.com/")) return "whatsapp";
  for (const [type, host] of Object.entries(SOCIAL_HOSTS)) {
    if (u.includes(`//${host}/`) || u.includes(`//www.${host}/`)) return type as LinkType;
  }
  return "custom";
}

/** Extract just the user-visible portion (handle / number) from a stored URL. */
export function extractHandle(type: LinkType, url: string): string {
  const v = (url || "").trim();
  if (!v) return "";
  if (type === "phone") return v.replace(/^tel:/i, "");
  if (type === "email") return v.replace(/^mailto:/i, "");
  if (type === "whatsapp") {
    const m = v.match(/wa\.me\/(\+?[\d]+)/i) || v.match(/phone=(\+?[\d]+)/i);
    return m ? m[1] : v;
  }
  if (type === "custom" || type === "website") return v;
  // Social: last path segment
  try {
    const parsed = new URL(v.startsWith("http") ? v : `https://${v}`);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return v;
  }
}

/** Build a full URL from a user-entered handle for the given type. */
export function buildUrl(type: LinkType, input: string): string {
  const v = (input || "").trim();
  if (!v) return "";
  switch (type) {
    case "phone":
      return `tel:${v.replace(/\s+/g, "")}`;
    case "email":
      return v.startsWith("mailto:") ? v : `mailto:${v}`;
    case "whatsapp": {
      const digits = v.replace(/[^\d+]/g, "");
      return `https://wa.me/${digits.replace(/^\+/, "")}`;
    }
    case "custom":
    case "website":
      if (/^https?:\/\//i.test(v) || /^(tel|mailto|sms):/i.test(v)) return v;
      return `https://${v}`;
    default: {
      const host = SOCIAL_HOSTS[type as keyof typeof SOCIAL_HOSTS];
      if (!host) return v;
      // Accept full URL paste
      if (/^https?:\/\//i.test(v)) return v;
      const handle = v.replace(/^@/, "");
      if (type === "linkedin" && !handle.includes("/")) {
        return `https://linkedin.com/in/${handle}`;
      }
      return `https://${host}/${handle}`;
    }
  }
}
