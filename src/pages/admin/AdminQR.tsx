import { BuilderShell } from "@/components/builder/BuilderShell";
import { useBuilderStore } from "@/store/builder-store";
import { SEO } from "@/components/SEO";
import { QRCodeSVG } from "qrcode.react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PRESETS = ["#000000", "#061492", "#a21caf", "#0d9488", "#ea580c"];

export default function AdminQR() {
  const { profile, patchProfile } = useBuilderStore();
  if (!profile) return null;
  const qr = (profile.qr_settings as any) || {};
  const color = qr.color || "#000000";
  const hideLogo = qr.hide_logo ?? false;
  const url = `${window.location.origin}/${profile.username}`;

  const set = (patch: Record<string, any>) =>
    patchProfile({ qr_settings: { ...qr, ...patch } });

  return (
    <BuilderShell title="QR Code" hidePreview>
      <SEO title="Profile builder · QR" description="Customize your QR" path="/admin/qr" />

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
        <div className="rounded-xl border border-border bg-background p-6 flex items-center justify-center">
          <QRCodeSVG value={url} size={220} fgColor={color} bgColor="#ffffff" level="M" />
        </div>

        <div className="space-y-5">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">QR color</Label>
            <div className="flex items-center gap-2 mt-2">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => set({ color: c })}
                  className={`w-10 h-10 rounded-full ring-2 transition-all ${color === c ? "ring-primary ring-offset-2 ring-offset-background" : "ring-transparent"}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="color"
                value={color}
                onChange={(e) => set({ color: e.target.value })}
                className="w-10 h-10 rounded border border-input bg-transparent cursor-pointer"
              />
              <input
                value={color}
                onChange={(e) => set({ color: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <Label htmlFor="hide-logo">Hide SmartCard logo</Label>
            <Switch id="hide-logo" checked={hideLogo} onCheckedChange={(v) => set({ hide_logo: v })} />
          </div>

          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Encoded URL</Label>
            <div className="mt-1 text-sm break-all">{url}</div>
          </div>
        </div>
      </div>
    </BuilderShell>
  );
}
