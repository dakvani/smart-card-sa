import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBuilderStore } from "@/store/builder-store";
import { BuilderSidebar } from "./BuilderSidebar";
import { LivePhonePreview } from "./LivePhonePreview";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface BuilderShellProps {
  title: string;
  children: React.ReactNode;
  /** When true, hides the live preview pane (for tabs that have their own canvas like Insights). */
  hidePreview?: boolean;
}

/**
 * Shared shell for /admin/* routes. Loads profile + blocks once and renders
 * sidebar, center column, and live preview.
 */
export function BuilderShell({ title, children, hidePreview = false }: BuilderShellProps) {
  const navigate = useNavigate();
  const { load, loading, profile, saveStatus } = useBuilderStore();
  const [authChecked, setAuthChecked] = useState(false);
  const isMobile = useIsMobile();
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        navigate("/auth");
        return;
      }
      setAuthChecked(true);
      void load(session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) navigate("/auth");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [load, navigate]);

  if (!authChecked || loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      <BuilderSidebar />

      <main className="flex-1 min-w-0 flex">
        <section className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-10">
          <header className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
            <div className="flex items-center gap-2">
              <SaveStatus status={saveStatus} />
              {isMobile && !hidePreview && (
                <Drawer open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DrawerTrigger asChild>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-background flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-6 max-h-[90vh]">
                    <div className="pt-2 pb-4">
                      <LivePhonePreview />
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </div>
          </header>
          {children}
        </section>

        {!hidePreview && (
          <aside className="hidden lg:block w-[360px] shrink-0 border-l border-border bg-background/40 backdrop-blur-xl p-6 sticky top-0 self-start">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Live preview</div>
            <LivePhonePreview />
            {profile && (
              <a
                href={`/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="block mt-4 text-center text-xs text-primary hover:underline"
              >
                Open public profile →
              </a>
            )}
          </aside>
        )}
      </main>

      <BuilderMobileTabBar />
    </div>
  );
}

function SaveStatus({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  return (
    <span className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
      {status === "saving" && "Saving…"}
      {status === "saved" && "Saved"}
      {status === "error" && "Save failed"}
    </span>
  );
}

import { NavLink } from "react-router-dom";
import { Link2, Palette, QrCode, BarChart3, Settings as SettingsIcon } from "lucide-react";

function BuilderMobileTabBar() {
  const items = [
    { to: "/admin/links", label: "Links", icon: Link2 },
    { to: "/admin/design", label: "Design", icon: Palette },
    { to: "/admin/qr", label: "QR", icon: QrCode },
    { to: "/admin/insights", label: "Stats", icon: BarChart3 },
    { to: "/admin/settings", label: "More", icon: SettingsIcon },
  ];
  return (
    <nav
      aria-label="Builder sections"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  `w-full min-h-[56px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{it.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
