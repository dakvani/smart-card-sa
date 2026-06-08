// Lightweight client-side link & social handle validation.
// No network calls (CORS would block most HEAD requests anyway) — we
// validate format strictly so users can't save garbage URLs/handles.

export type ValidationResult = { valid: boolean; message?: string };

const USERNAME_RE = /^[a-zA-Z0-9._-]{1,40}$/;
const CHANNEL_RE = /^[a-zA-Z0-9._-]{1,60}$/;

export function validateUrl(raw: string): ValidationResult {
  const value = (raw || "").trim();
  if (!value) return { valid: true };
  let withScheme = value;
  if (!/^https?:\/\//i.test(withScheme)) withScheme = `https://${withScheme}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) {
      return { valid: false, message: "Enter a valid domain (e.g. example.com)" };
    }
    if (!/^[a-zA-Z0-9.-]+$/.test(u.hostname)) {
      return { valid: false, message: "Hostname contains invalid characters" };
    }
    return { valid: true };
  } catch {
    return { valid: false, message: "Not a valid URL" };
  }
}

export function validateSocialHandle(
  platform: string,
  raw: string,
): ValidationResult {
  const value = (raw || "").trim();
  if (!value) return { valid: true };

  if (platform === "website") return validateUrl(value);

  // Allow users to paste a full profile URL — extract the handle portion.
  let handle = value;
  if (/^https?:\/\//i.test(handle) || handle.startsWith("www.")) {
    try {
      const u = new URL(handle.startsWith("http") ? handle : `https://${handle}`);
      const parts = u.pathname.split("/").filter(Boolean);
      handle = parts[parts.length - 1] || "";
    } catch {
      return { valid: false, message: "Not a valid profile URL" };
    }
  }
  handle = handle.replace(/^@/, "");

  const re = platform === "youtube" ? CHANNEL_RE : USERNAME_RE;
  if (!re.test(handle)) {
    return {
      valid: false,
      message: "Use letters, numbers, dots, dashes or underscores only",
    };
  }
  return { valid: true };
}
