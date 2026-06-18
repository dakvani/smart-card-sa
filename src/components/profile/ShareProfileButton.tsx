import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  QrCode,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShareProfileButtonProps {
  /** Public username — used to build the /{username} URL. */
  username: string;
  /** Profile UUID — required to record share/click analytics. */
  profileId?: string;
  title?: string;
  className?: string;
}

type Channel =
  | "native"
  | "copy"
  | "whatsapp"
  | "telegram"
  | "x"
  | "facebook"
  | "linkedin"
  | "email"
  | "qr-open"
  | "qr-download";

const QR_SIZES: { label: string; size: number; note: string }[] = [
  { label: "Standard", size: 512, note: "Web & social" },
  { label: "High-res", size: 1024, note: "Print posters" },
  { label: "Ultra HD", size: 2048, note: "Large format" },
];

export function ShareProfileButton({
  username,
  profileId,
  title,
  className,
}: ShareProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(1024);

  const url = useMemo(
    () =>
      typeof window !== "undefined"
        ? `${window.location.origin}/${username}`
        : `/${username}`,
    [username],
  );
  const shareText = title ? `${title} — SmartCard` : `Check out @${username} on SmartCard`;
  const enc = encodeURIComponent;

  const trackShare = (channel: Channel) => {
    if (!profileId) return;
    void supabase
      .from("profile_share_events")
      .insert({
        profile_id: profileId,
        channel,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      })
      .then(({ error }) => {
        if (error) console.warn("share tracking failed:", error.message);
      });
  };

  const tryNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareText, url });
        trackShare("native");
        return true;
      } catch {
        // user cancelled or failed → fall through to drawer
      }
    }
    return false;
  };

  const handleClick = async () => {
    const ok = await tryNativeShare();
    if (!ok) setOpen(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare("copy");
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        trackShare("copy");
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy");
      }
    }
  };

  const downloadQR = (size: number) => {
    const svg = document.getElementById("share-profile-qr-hd");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
      }
      const a = document.createElement("a");
      a.download = `${username}-qrcode-${size}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      trackShare("qr-download");
      toast.success(`Downloaded ${size}×${size} QR`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const targets: { label: string; icon: any; href: string; color: string; channel: Channel }[] = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${enc(`${shareText} ${url}`)}`,
      color: "bg-emerald-500",
      channel: "whatsapp",
    },
    {
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(shareText)}`,
      color: "bg-sky-500",
      channel: "telegram",
    },
    {
      label: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(shareText)}`,
      color: "bg-slate-900",
      channel: "x",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      color: "bg-blue-600",
      channel: "facebook",
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      color: "bg-blue-700",
      channel: "linkedin",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${enc(shareText)}&body=${enc(url)}`,
      color: "bg-rose-500",
      channel: "email",
    },
  ];

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="Share profile"
        className={
          className ??
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 text-slate-900 shadow-lg hover:scale-105 active:scale-95 transition"
        }
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {/* Hidden high-resolution QR source for downloads */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeSVG id="share-profile-qr-hd" value={url} size={1024} level="H" includeMargin />
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[max(env(safe-area-inset-bottom),1rem)]">
          <DrawerHeader>
            <DrawerTitle className="text-center">Share this profile</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2">
            {/* URL row — auto-generated, always shown */}
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 mb-4">
              <span className="flex-1 text-sm font-mono truncate" title={url}>{url}</span>
              <Button
                size="sm"
                variant={copied ? "secondary" : "gradient"}
                onClick={copy}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            {/* Share targets grid */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {targets.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackShare(t.channel);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${t.color} group-hover:scale-105 group-active:scale-95 transition`}
                  >
                    <t.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-foreground/80">{t.label}</span>
                </a>
              ))}
            </div>

            {/* Open dedicated QR modal */}
            <div className="border-t border-border pt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setQrOpen(true);
                  trackShare("qr-open");
                }}
                className="gap-2"
              >
                <QrCode className="w-4 h-4" />
                Show QR code
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dedicated QR modal with high-resolution download options */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QR code for @{username}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <QRCodeSVG value={url} size={220} level="H" includeMargin />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Scan to open this profile. Choose a resolution for printing or sharing.
            </p>

            <div className="grid grid-cols-3 gap-2 w-full">
              {QR_SIZES.map((opt) => (
                <button
                  key={opt.size}
                  onClick={() => setQrSize(opt.size)}
                  className={`rounded-xl border p-3 text-left transition ${
                    qrSize === opt.size
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground">{opt.size}×{opt.size}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{opt.note}</div>
                </button>
              ))}
            </div>

            <Button onClick={() => downloadQR(qrSize)} variant="gradient" className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download PNG ({qrSize}×{qrSize})
            </Button>

            <button
              onClick={copy}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link copied" : "Copy profile link"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
