import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

interface ShareProfileButtonProps {
  username: string;
  title?: string;
  className?: string;
}

export function ShareProfileButton({ username, title, className }: ShareProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/${username}` : `/${username}`;
  const shareText = title ? `${title} — SmartCard` : `Check out @${username} on SmartCard`;
  const enc = encodeURIComponent;

  const tryNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareText, url });
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
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("share-profile-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      canvas.getContext("2d")?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `${username}-qrcode.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const targets: { label: string; icon: any; href: string; color: string }[] = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${enc(`${shareText} ${url}`)}`,
      color: "bg-emerald-500",
    },
    {
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(shareText)}`,
      color: "bg-sky-500",
    },
    {
      label: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(shareText)}`,
      color: "bg-slate-900",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      color: "bg-blue-600",
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      color: "bg-blue-700",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${enc(shareText)}&body=${enc(url)}`,
      color: "bg-rose-500",
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

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[max(env(safe-area-inset-bottom),1rem)]">
          <DrawerHeader>
            <DrawerTitle className="text-center">Share this profile</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2">
            {/* URL row */}
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 mb-4">
              <span className="flex-1 text-sm font-mono truncate">{url}</span>
              <Button size="sm" variant={copied ? "secondary" : "gradient"} onClick={copy} className="shrink-0 gap-1.5">
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
                  onClick={() => setOpen(false)}
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

            {/* QR */}
            <div className="border-t border-border pt-4 flex flex-col items-center gap-3">
              <div className="bg-white p-2.5 rounded-xl shadow-sm">
                <QRCodeSVG id="share-profile-qr" value={url} size={140} level="H" includeMargin />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                Scan to open on phone
              </p>
              <Button variant="outline" size="sm" onClick={downloadQR} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download QR
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
