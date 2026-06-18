import { BuilderShell } from "@/components/builder/BuilderShell";
import { useBuilderStore } from "@/store/builder-store";
import { SEO } from "@/components/SEO";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PRESETS = [
  { name: "Midnight", gradient: "from-indigo-900 via-purple-900 to-pink-900" },
  { name: "Sunset", gradient: "from-orange-500 via-pink-500 to-purple-600" },
  { name: "Ocean", gradient: "from-cyan-500 via-blue-500 to-indigo-600" },
  { name: "Forest", gradient: "from-green-600 via-emerald-500 to-teal-500" },
  { name: "Aurora", gradient: "from-fuchsia-500 via-violet-500 to-cyan-500" },
  { name: "Ember", gradient: "from-red-500 via-orange-500 to-yellow-500" },
  { name: "Mono", gradient: "from-zinc-700 via-zinc-800 to-zinc-900" },
  { name: "Mint", gradient: "from-emerald-400 via-teal-400 to-cyan-400" },
  { name: "Berry", gradient: "from-pink-500 via-rose-500 to-red-500" },
];

const WALLPAPERS = [
  { id: "fill", label: "Fill" },
  { id: "gradient", label: "Gradient" },
  { id: "blur", label: "Blur" },
  { id: "pattern", label: "Pattern" },
];

export default function AdminDesign() {
  const { profile, patchProfile } = useBuilderStore();
  if (!profile) return null;

  return (
    <BuilderShell title="Design">
      <SEO title="Profile builder · Design" description="Theme and wallpaper" path="/admin/design" />

      <section className="space-y-3 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Theme</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const active = profile.theme_gradient === p.gradient;
            return (
              <button
                key={p.name}
                onClick={() => patchProfile({ theme_gradient: p.gradient })}
                className={`relative aspect-[4/5] rounded-xl bg-gradient-to-br ${p.gradient} p-3 text-white text-left ring-2 transition-all ${
                  active ? "ring-primary ring-offset-2 ring-offset-background" : "ring-transparent hover:ring-border"
                }`}
              >
                <div className="font-semibold text-sm">{p.name}</div>
                {active && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Wallpaper</h2>
        <div className="grid grid-cols-4 gap-3">
          {WALLPAPERS.map((w) => {
            const active = (profile.wallpaper_style || "fill") === w.id;
            return (
              <button
                key={w.id}
                onClick={() => patchProfile({ wallpaper_style: w.id })}
                className={`aspect-[3/4] rounded-xl border-2 transition-colors ${
                  active ? "border-primary" : "border-border hover:border-foreground/30"
                }`}
              >
                <div className={`h-full w-full rounded-[10px] bg-gradient-to-br ${profile.theme_gradient || "from-indigo-900 to-pink-900"} ${
                  w.id === "blur" ? "blur-md" : w.id === "pattern" ? "opacity-70" : ""
                }`} />
                <div className="text-xs font-medium mt-1">{w.label}</div>
              </button>
            );
          })}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Background color</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={profile.wallpaper_value || "#1a1a2e"}
              onChange={(e) => patchProfile({ wallpaper_value: e.target.value })}
              className="w-10 h-10 rounded border border-input bg-transparent cursor-pointer"
            />
            <input
              value={profile.wallpaper_value || ""}
              onChange={(e) => patchProfile({ wallpaper_value: e.target.value })}
              placeholder="#1a1a2e"
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Footer</h2>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <Label htmlFor="hide-footer">Hide SmartCard footer</Label>
          <Switch
            id="hide-footer"
            checked={(profile.qr_settings as any)?.hide_footer ?? false}
            onCheckedChange={(v) => patchProfile({ qr_settings: { ...(profile.qr_settings || {}), hide_footer: v } })}
          />
        </div>
      </section>
    </BuilderShell>
  );
}
