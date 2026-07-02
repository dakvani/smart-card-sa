import { UserPlus } from "lucide-react";
import { detectLinkType } from "@/lib/link-types";

interface SaveContactButtonProps {
  profile: {
    username: string;
    title?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    social_links?: unknown;
  };
  links: Array<{ title: string; url: string; visible?: boolean }>;
  publicUrl: string;
}


const escapeVcf = (s: string) =>
  (s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

async function fetchAvatarBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const s = String(reader.result || "");
        const b64 = s.split(",")[1] || "";
        resolve(b64 || null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function SaveContactButton({ profile, links, publicUrl }: SaveContactButtonProps) {
  const handleSave = async () => {
    const displayName = profile.title || profile.username;
    const bio = profile.bio || "";
    const activeLinks = links.filter((l) => l.visible !== false);

    const phones = activeLinks
      .filter((l) => detectLinkType(l.url, l.title) === "phone")
      .map((l) => l.url.replace(/^tel:/i, ""));
    const whatsapps = activeLinks
      .filter((l) => detectLinkType(l.url, l.title) === "whatsapp")
      .map((l) => l.url.replace(/^https?:\/\/wa\.me\//i, "").replace(/^\+?/, "+"));
    const emails = activeLinks
      .filter((l) => detectLinkType(l.url, l.title) === "email")
      .map((l) => l.url.replace(/^mailto:/i, ""));
    const websites = activeLinks
      .filter((l) => {
        const t = detectLinkType(l.url, l.title);
        return t === "website" || t === "custom";
      })
      .map((l) => l.url);

    const socials = profile.social_links || {};
    const socialUrls = Object.values(socials).filter(Boolean) as string[];

    let photoLine = "";
    if (profile.avatar_url) {
      const b64 = await fetchAvatarBase64(profile.avatar_url);
      if (b64) photoLine = `PHOTO;ENCODING=b;TYPE=JPEG:${b64}\n`;
    }

    const vcf =
      "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      `FN:${escapeVcf(displayName)}\n` +
      `N:${escapeVcf(displayName)};;;;\n` +
      (bio ? `NOTE:${escapeVcf(bio)}\n` : "") +
      phones.map((p) => `TEL;TYPE=CELL:${escapeVcf(p)}\n`).join("") +
      whatsapps.map((p) => `TEL;TYPE=OTHER:${escapeVcf(p)}\n`).join("") +
      emails.map((e) => `EMAIL;TYPE=INTERNET:${escapeVcf(e)}\n`).join("") +
      websites.map((w) => `URL:${escapeVcf(w)}\n`).join("") +
      socialUrls.map((s) => `URL:${escapeVcf(s)}\n`).join("") +
      `URL;TYPE=SmartCard:${escapeVcf(publicUrl)}\n` +
      photoLine +
      "END:VCARD\n";

    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile.username || "contact").replace(/[^\w-]/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      onClick={handleSave}
      className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-primary-foreground text-background font-semibold hover:bg-primary-foreground/90 active:scale-[0.98] transition-all shadow-lg"
    >
      <UserPlus className="w-4 h-4" />
      Save to contacts
    </button>
  );
}
