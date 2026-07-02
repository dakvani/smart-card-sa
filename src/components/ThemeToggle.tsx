import { useEffect, useState, useCallback } from "react";
import { Moon, Sun, Monitor, Eye, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Theme = "light" | "dark" | "system" | "high-contrast" | "protanopia" | "deuteranopia" | "tritanopia";

const DEFAULT_PUBLIC_THEME: Theme = "protanopia";
const THEME_VALUES: Theme[] = ["light", "dark", "system", "high-contrast", "protanopia", "deuteranopia", "tritanopia"];

const normalizeTheme = (value: unknown): Theme =>
  typeof value === "string" && THEME_VALUES.includes(value as Theme) ? (value as Theme) : DEFAULT_PUBLIC_THEME;

const themeConfig: Record<Theme, { icon: typeof Sun; label: string; category: "standard" | "accessibility" }> = {
  light: { icon: Sun, label: "Light", category: "standard" },
  dark: { icon: Moon, label: "Dark", category: "standard" },
  system: { icon: Monitor, label: "System", category: "standard" },
  "high-contrast": { icon: Eye, label: "High Contrast", category: "accessibility" },
  protanopia: { icon: Palette, label: "Protanopia", category: "accessibility" },
  deuteranopia: { icon: Palette, label: "Deuteranopia", category: "accessibility" },
  tritanopia: { icon: Palette, label: "Tritanopia", category: "accessibility" },
};

const applyThemeToDom = (newTheme: Theme): "light" | "dark" => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark", "high-contrast", "protanopia", "deuteranopia", "tritanopia");
  let effectiveTheme: "light" | "dark";
  if (newTheme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.classList.add(effectiveTheme);
  } else if (
    newTheme === "high-contrast" ||
    newTheme === "protanopia" ||
    newTheme === "deuteranopia" ||
    newTheme === "tritanopia"
  ) {
    root.classList.add("dark", newTheme);
    effectiveTheme = "dark";
  } else {
    effectiveTheme = newTheme;
    root.classList.add(effectiveTheme);
  }
  return effectiveTheme;
};

/**
 * Public site theme is controlled by admins via `site_settings.public_theme`.
 * All visitors (including anon) load and apply that theme.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_PUBLIC_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const { toast } = useToast();

  // Load site-wide theme on mount + subscribe to changes
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("public_theme")
        .eq("id", "global")
        .maybeSingle();
      if (!mounted) return;
      const t = normalizeTheme(data?.public_theme);
      setThemeState(t);
      setResolvedTheme(applyThemeToDom(t));
    };
    load();

    const channel = supabase
      .channel("site_settings_theme")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "id=eq.global" },
        (payload: any) => {
          const t = normalizeTheme(payload.new?.public_theme);
          setThemeState(t);
          setResolvedTheme(applyThemeToDom(t));
        }
      )
      .subscribe();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setResolvedTheme(applyThemeToDom(theme));
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      mediaQuery.removeEventListener("change", handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);
      setResolvedTheme(applyThemeToDom(newTheme));
      const { error } = await supabase
        .from("site_settings")
        .update({ public_theme: newTheme, updated_at: new Date().toISOString() })
        .eq("id", "global");
      if (error) {
        toast({
          title: "Couldn't update site appearance",
          description: "Only admins can change the public appearance.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  return { theme, setTheme, resolvedTheme };
}

/**
 * Admin-only appearance picker. Renders a dropdown to set the site-wide
 * public theme. Not intended for public navigation.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const CurrentIcon = themeConfig[theme]?.icon || Monitor;

  const standardThemes = Object.entries(themeConfig).filter(([_, config]) => config.category === "standard");
  const accessibilityThemes = Object.entries(themeConfig).filter(([_, config]) => config.category === "accessibility");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Current site appearance: ${themeConfig[theme]?.label || theme}. Click to change`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentIcon className="h-5 w-5" aria-hidden="true" />
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Change site appearance</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" role="menu" aria-label="Site appearance options" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Standard</DropdownMenuLabel>
        {standardThemes.map(([key, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key as Theme)}
              role="menuitemradio"
              aria-checked={theme === key}
            >
              <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{config.label}</span>
              {theme === key && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Accessibility</DropdownMenuLabel>
        {accessibilityThemes.map(([key, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key as Theme)}
              role="menuitemradio"
              aria-checked={theme === key}
            >
              <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{config.label}</span>
              {theme === key && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
