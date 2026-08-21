// Link type helpers: derive a "type" from a stored URL, and build a URL
// from a user-entered handle/number. Type is inferred from the URL — no
// schema changes required.

export type LinkType =
  | "custom"
  | "phone"
  | "email"
  | "whatsapp"
  | "messenger"
  | "snapchat"
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "github"
  | "telegram"
  | "discord"
  | "pinterest"
  | "reddit"
  | "twitch"
  | "spotify"
  | "website";

export interface LinkTypeDef {
  value: LinkType;
  label: string;
  placeholder: string;
  hint?: string;
  /** lucide-react icon name (rendered dynamically) */
  icon?: string;
}

export const LINK_TYPES: LinkTypeDef[] = [
  { value: "custom", label: "Custom URL", placeholder: "https://...", icon: "Link2" },
  { value: "phone", label: "Phone (tap to call)", placeholder: "555 123 4567", hint: "Opens the dialer on tap", icon: "Phone" },
  { value: "email", label: "Email", placeholder: "you@example.com", icon: "Mail" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "555 123 4567", icon: "MessageCircle" },
  { value: "messenger", label: "Facebook Messenger", placeholder: "username", icon: "MessageSquare" },
  { value: "snapchat", label: "Snapchat", placeholder: "username", icon: "Ghost" },
  { value: "instagram", label: "Instagram", placeholder: "username", icon: "Instagram" },
  { value: "facebook", label: "Facebook", placeholder: "username or page", icon: "Facebook" },
  { value: "twitter", label: "X / Twitter", placeholder: "username", icon: "Twitter" },
  { value: "linkedin", label: "LinkedIn", placeholder: "username", icon: "Linkedin" },
  { value: "youtube", label: "YouTube", placeholder: "@channel", icon: "Youtube" },
  { value: "tiktok", label: "TikTok", placeholder: "username", icon: "Music2" },
  { value: "github", label: "GitHub", placeholder: "username", icon: "Github" },
  { value: "telegram", label: "Telegram", placeholder: "username", icon: "Send" },
  { value: "discord", label: "Discord", placeholder: "invite code or URL", icon: "MessagesSquare" },
  { value: "pinterest", label: "Pinterest", placeholder: "username", icon: "Pin" },
  { value: "reddit", label: "Reddit", placeholder: "username", icon: "MessageCircle" },
  { value: "twitch", label: "Twitch", placeholder: "username", icon: "Twitch" },
  { value: "spotify", label: "Spotify", placeholder: "artist/user URL", icon: "Music" },
  { value: "website", label: "Website", placeholder: "example.com", icon: "Globe" },
];

export function getLinkTypeDef(type: LinkType): LinkTypeDef {
  return LINK_TYPES.find((t) => t.value === type) ?? LINK_TYPES[0];
}

const SOCIAL_HOSTS: Partial<Record<LinkType, string>> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  messenger: "m.me",
  snapchat: "snapchat.com",
  twitter: "x.com",
  linkedin: "linkedin.com",
  youtube: "youtube.com",
  tiktok: "tiktok.com",
  github: "github.com",
  telegram: "t.me",
  discord: "discord.gg",
  pinterest: "pinterest.com",
  reddit: "reddit.com",
  twitch: "twitch.tv",
  spotify: "open.spotify.com",
};

export function detectLinkType(url: string, title?: string): LinkType {
  const u = (url || "").trim().toLowerCase();
  const t = (title || "").trim().toLowerCase();

  // URL-based detection (most reliable)
  if (u.startsWith("tel:")) return "phone";
  if (u.startsWith("mailto:")) return "email";
  if (u.startsWith("https://wa.me/") || u.startsWith("https://api.whatsapp.com/")) return "whatsapp";
  for (const [type, host] of Object.entries(SOCIAL_HOSTS)) {
    if (!host) continue;
    if (u.includes(`//${host}/`) || u.includes(`//www.${host}/`)) return type as LinkType;
  }

  // Title-based fallback — for links saved as raw handles/numbers without a scheme.
  if (t) {
    const titleMap: Array<[RegExp, LinkType]> = [
      [/whats\s*app|\bwa\b/, "whatsapp"],
      [/e[-\s]?mail|@/, "email"],
      [/\bcall\b|\bphone\b|\bmobile\b|\btel\b|dial/, "phone"],
      [/instagram|\binsta\b|\big\b/, "instagram"],
      [/facebook|\bfb\b/, "facebook"],
      [/messenger/, "messenger"],
      [/snap\s*chat|snap/, "snapchat"],
      [/twitter|\bx\b/, "twitter"],
      [/linked\s*in/, "linkedin"],
      [/youtube|\byt\b/, "youtube"],
      [/tik\s*tok/, "tiktok"],
      [/github/, "github"],
      [/telegram/, "telegram"],
      [/discord/, "discord"],
      [/pinterest/, "pinterest"],
      [/reddit/, "reddit"],
      [/twitch/, "twitch"],
      [/spotify/, "spotify"],
      [/website|portfolio|blog|homepage/, "website"],
    ];
    for (const [re, type] of titleMap) {
      if (re.test(t)) return type;
    }
  }

  // URL heuristics: pure digits/+ → phone; contains @ → email.
  if (/^[+\d][\d\s\-().]{5,}$/.test(u)) return "phone";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return "email";

  return "custom";
}


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
  try {
    const parsed = new URL(v.startsWith("http") ? v : `https://${v}`);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return v;
  }
}

export function buildUrl(type: LinkType, input: string): string {
  const v = (input || "").trim();
  if (!v) return "";
  switch (type) {
    case "phone":
      return `tel:${v.replace(/[^\d+]/g, "")}`;
    case "email":
      return v.startsWith("mailto:") ? v : `mailto:${v}`;
    case "whatsapp": {
      const digits = v.replace(/[^\d+]/g, "").replace(/^\+/, "");
      return `https://wa.me/${digits}`;
    }
    case "custom":
    case "website":
      if (/^https?:\/\//i.test(v) || /^(tel|mailto|sms):/i.test(v)) return v;
      return `https://${v}`;
    default: {
      const host = SOCIAL_HOSTS[type];
      if (!host) return v;
      if (/^https?:\/\//i.test(v)) return v;
      const handle = v.replace(/^@/, "");
      if (type === "linkedin" && !handle.includes("/")) {
        return `https://linkedin.com/in/${handle}`;
      }
      return `https://${host}/${handle}`;
    }
  }
}

/** Common country dial codes for the phone-number editor. */
export const COUNTRY_CODES: { code: string; name: string; dial: string }[] = [
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "FI", name: "Finland", dial: "+358" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "TR", name: "Turkey", dial: "+90" },
  { code: "RU", name: "Russia", dial: "+7" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "IL", name: "Israel", dial: "+972" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "CL", name: "Chile", dial: "+56" },
  { code: "CO", name: "Colombia", dial: "+57" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "CN", name: "China", dial: "+86" },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "TW", name: "Taiwan", dial: "+886" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "TH", name: "Thailand", dial: "+66" },
  { code: "VN", name: "Vietnam", dial: "+84" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
];

export function splitPhone(raw: string): { dial: string; local: string } {
  let v = (raw || "").trim();
  // Handle tel: or WhatsApp URLs
  if (v.startsWith("tel:")) {
    v = v.replace(/^tel:/i, "");
  } else if (v.includes("wa.me/")) {
    const m = v.match(/wa\.me\/(\+?[\d]+)/i);
    v = m ? (m[1].startsWith("+") ? m[1] : "+" + m[1]) : v;
  }

  if (!v) return { dial: "", local: "" };

  // Sort country codes by dial length descending to match longest code first (e.g. +971 before +9)
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  
  for (const c of sortedCodes) {
    if (v.startsWith(c.dial)) {
      return { dial: c.dial, local: v.slice(c.dial.length).trim() };
    }
  }

  // Fallback for codes not in our list
  const match = v.match(/^(\+\d{1,4})[\s.-]*(.*)$/);
  if (match) {
    return { dial: match[1], local: match[2] };
  }
  
  return { dial: "", local: v };
}

/** Pretty-format the "local" portion — grouping digits without changing meaning. */
export function formatLocalPhone(local: string): string {
  const digits = (local || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
}
