import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Copy, Check, ExternalLink, QrCode, Globe, Link2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileShareCardProps {
  username: string;
}

const CUSTOM_DOMAIN_KEY = "smartcard_custom_domain";

function getStoredDomain(): string {
  return localStorage.getItem(CUSTOM_DOMAIN_KEY) || "";
}

function getProfileUrl(username: string, customDomain?: string): string {
  const base = customDomain?.trim() || window.location.origin;
  // Remove trailing slash
  const cleanBase = base.replace(/\/+$/, "");
  return `${cleanBase}/${username}`;
}

function getQrUrl(username: string, customDomain?: string): string {
  const base = customDomain?.trim() || window.location.origin;
  const cleanBase = base.replace(/\/+$/, "");
  // Route via /qr/ so mobile devices get forced mobile layout (?mobile=1)
  return `${cleanBase}/qr/${username}`;
}

export function ProfileShareCard({ username }: ProfileShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [customDomain, setCustomDomain] = useState(getStoredDomain);
  const [editingDomain, setEditingDomain] = useState(false);
  const [domainInput, setDomainInput] = useState(customDomain);

  const profileUrl = getProfileUrl(username, customDomain);
  const qrUrl = getQrUrl(username, customDomain);

  const copyUrl = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Profile URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const saveDomain = () => {
    const cleaned = domainInput.trim().replace(/\/+$/, "");
    // Add https:// if missing
    const withProtocol = cleaned && !cleaned.startsWith("http") ? `https://${cleaned}` : cleaned;
    setCustomDomain(withProtocol);
    localStorage.setItem(CUSTOM_DOMAIN_KEY, withProtocol);
    setEditingDomain(false);
    toast.success(withProtocol ? "Custom domain saved!" : "Using default domain");
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("share-card-qr");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${username}-qrcode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="bg-background rounded-2xl border border-border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-primary" />
        Your Profile Link
      </h3>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <QRCodeSVG
              id="share-card-qr"
              value={qrUrl}
              size={140}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <Button variant="outline" size="sm" onClick={downloadQRCode} className="gap-1.5 w-full">
            <Download className="w-3.5 h-3.5" />
            Download QR
          </Button>
        </div>

        {/* URL & Actions */}
        <div className="flex-1 space-y-4">
          {/* Profile URL display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm truncate border border-border">
              {profileUrl}
            </div>
            <Button variant="gradient" size="sm" onClick={copyUrl} className="shrink-0 gap-1.5">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          {/* View profile link */}
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open profile in new tab
          </a>

          {/* Custom domain config */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {customDomain ? "Custom domain" : "Using default domain"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingDomain(!editingDomain); setDomainInput(customDomain); }}
                className="text-xs h-7"
              >
                {editingDomain ? "Cancel" : customDomain ? "Change" : "Set custom domain"}
              </Button>
            </div>
            {editingDomain && (
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="text-sm"
                />
                <Button size="sm" onClick={saveDomain}>
                  Save
                </Button>
              </div>
            )}
            {customDomain && !editingDomain && (
              <p className="text-xs text-muted-foreground">
                QR code and links point to: <span className="font-mono">{customDomain}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
