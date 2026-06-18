import { NavLink, useNavigate } from "react-router-dom";
import { Link2, Palette, QrCode, BarChart3, Settings as SettingsIcon, LogOut, ExternalLink } from "lucide-react";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";
import { supabase } from "@/integrations/supabase/client";
import { useBuilderStore } from "@/store/builder-store";

const items = [
  { to: "/admin/links", label: "Links", icon: Link2 },
  { to: "/admin/design", label: "Design", icon: Palette },
  { to: "/admin/qr", label: "QR Code", icon: QrCode },
  { to: "/admin/insights", label: "Insights", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function BuilderSidebar() {
  const navigate = useNavigate();
  const profile = useBuilderStore((s) => s.profile);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-background/60 backdrop-blur-xl h-screen sticky top-0">
      <div className="p-4 flex items-center gap-2">
        <SmartCardLogo className="w-8 h-8" />
        <div className="font-semibold">SmartCard</div>
      </div>

      {profile && (
        <a
          href={`/${profile.username}`}
          target="_blank"
          rel="noreferrer"
          className="mx-3 mb-2 flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-xs"
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted" />
          )}
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">@{profile.username}</div>
            <div className="text-muted-foreground truncate flex items-center gap-1">View live <ExternalLink className="w-3 h-3" /></div>
          </div>
        </a>
      )}

      <nav className="flex-1 px-2 space-y-0.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted text-foreground/80"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
