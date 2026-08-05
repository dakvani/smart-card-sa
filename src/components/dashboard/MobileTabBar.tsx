import { Link2, Palette, BarChart3, Settings as SettingsIcon } from "lucide-react";

interface MobileTabBarProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const TABS = [
  { id: "links", label: "Links", icon: Link2 },
  { id: "appearance", label: "Design", icon: Palette },
  { id: "analytics", label: "Stats", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/**
 * Sticky bottom navigation for the profile builder on mobile.
 * Renders nothing on md+ screens — desktop keeps the existing left aside.
 */
export function MobileTabBar({ activeTab, onChange }: MobileTabBarProps) {
  return (
    <nav
      data-bottom-nav
      aria-label="Profile builder sections"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`w-full min-h-[56px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                {active && <span className="block w-6 h-0.5 rounded-full bg-primary mt-0.5" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
