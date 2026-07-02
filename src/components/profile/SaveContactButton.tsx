import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { detectLinkType } from "@/lib/link-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveContactButtonProps {
  profile: {
    id: string;
    username: string;
    title?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    social_links?: unknown;
  };
  links: Array<{ title: string; url: string; visible?: boolean }>;
  publicUrl: string;
}

// vCard 3.0 requires CRLF line endings per RFC 2426.
const CRLF = "\r\n";

const escapeVcf = (s: string) =>
  (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

/** Fold long vCard lines at 75 octets per RFC 2426. */
const foldLine = (line: string): string => {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(0, 75));
  i = 75;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join(CRLF);
};

const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return (hasPlus ? "+" : "") + digits;
};

const extractWhatsAppNumber = (url: string): string => {
  const m = url.match(/wa\.me\/(\+?[\d]+)/i) || url.match(/phone=(\+?[\d]+)/i);
  const raw = m ? m[1] : url;
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
};

export function SaveContactButton({ profile, links, publicUrl }: SaveContactButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    try {
      const displayName = profile.title || profile.username;
      const bio = profile.bio || "";
      const activeLinks = links.filter((l) => l.visible !== false);

      const phones = activeLinks
        .filter((l) => detectLinkType(l.url, l.title) === "phone")
        .map((l) => normalizePhone(l.url.replace(/^tel:/i, "")))
        .filter(Boolean);

      const whatsapps = activeLinks
        .filter((l) => detectLinkType(l.url, l.title) === "whatsapp")
        .map((l) => extractWhatsAppNumber(l.url))
        .filter(Boolean);

      const emails = activeLinks
        .filter((l) => detectLinkType(l.url, l.title) === "email")
        .map((l) => l.url.replace(/^mailto:/i, "").trim())
        .filter(Boolean);

      const websites = activeLinks
        .filter((l) => {
          const t = detectLinkType(l.url, l.title);
          return t === "website" || t === "custom";
        })
        .map((l) => l.url.trim())
        .filter(Boolean);

      const socials = (profile.social_links as Record<string, string | undefined> | null) || {};
      const socialUrls = Object.values(socials).filter(
        (v): v is string => typeof v === "string" && v.length > 0,
      );

      const lines: string[] = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        foldLine(`FN:${escapeVcf(displayName)}`),
        foldLine(`N:${escapeVcf(displayName)};;;;`),
      ];
      if (bio) lines.push(foldLine(`NOTE:${escapeVcf(bio)}`));
      phones.forEach((p) => lines.push(foldLine(`TEL;TYPE=CELL,VOICE:${p}`)));
      whatsapps.forEach((p) => lines.push(foldLine(`TEL;TYPE=CELL;X-SERVICE-TYPE=WhatsApp:${p}`)));
      emails.forEach((e) => lines.push(foldLine(`EMAIL;TYPE=INTERNET:${escapeVcf(e)}`)));
      websites.forEach((w) => lines.push(foldLine(`URL:${escapeVcf(w)}`)));
      socialUrls.forEach((s) => lines.push(foldLine(`URL:${escapeVcf(s)}`)));
      if (publicUrl) lines.push(foldLine(`URL:${escapeVcf(publicUrl)}`));
      lines.push(`REV:${new Date().toISOString()}`);
      lines.push("END:VCARD");

      const vcf = lines.join(CRLF) + CRLF;

      // Fire-and-forget analytics event.
      supabase
        .from("profile_share_events")
        .insert({
          profile_id: profile.id,
          channel: "save_contact",
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .then(({ error }) => {
          if (error) console.warn("share event failed:", error.message);
        });

      const filename = `${(profile.username || "contact").replace(/[^\w-]/g, "_")}.vcf`;
      const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      // iOS Safari sometimes ignores `download` — target=_blank lets it open the vCard viewer.
      a.rel = "noopener";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } catch (err) {
      console.error("save contact failed", err);
      toast.error("Couldn't save contact. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={busy}
      className="inline-flex h-6 items-center justify-center gap-1 rounded-full border border-primary-foreground/25 bg-primary-foreground/20 px-2.5 text-[10px] font-semibold text-primary-foreground shadow-md backdrop-blur transition-all hover:bg-primary-foreground/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
      Save Contact
    </button>
  );
}
