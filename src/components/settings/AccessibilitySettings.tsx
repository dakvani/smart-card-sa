import { useState, useEffect } from "react";
import { Accessibility, Type, Zap, Volume2, Check, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  AccessibilityPreferences,
  ACCESSIBILITY_STORAGE_KEY,
  applyAccessibilityPreferencesToScope,
  defaultAccessibilityPreferences,
  loadAccessibilityPreferences,
} from "@/lib/accessibility";

const fontSizeConfig = {
  small: { label: "Small", value: "14px" },
  medium: { label: "Medium", value: "16px" },
  large: { label: "Large", value: "18px" },
  "extra-large": { label: "Extra Large", value: "20px" },
};

const fontFamilyConfig = {
  default: { label: "Default", description: "System default font" },
  dyslexia: { label: "OpenDyslexic", description: "Dyslexia-friendly font" },
};

const defaultPreferences = defaultAccessibilityPreferences;

export function AccessibilitySettings() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage on mount. We intentionally do NOT
  // apply them anywhere here — these settings live on the dashboard but
  // only affect the public bio profile (see src/lib/accessibility.ts).
  useEffect(() => {
    const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (saved) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
        return;
      } catch {
        /* fall through to system pref */
      }
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setPreferences(prev => ({ ...prev, reducedMotion: true }));
    }
  }, []);

  const applyPreferences = (prefs: AccessibilityPreferences) => {
    // Only the public bio profile renders a scope element. On internal
    // pages this is a no-op by design — accessibility styling must never
    // leak into the dashboard or other internal UI.
    if (typeof document === "undefined") return;
    const scope = document.querySelector<HTMLElement>("[data-accessibility-scope]");
    if (scope) applyAccessibilityPreferencesToScope(scope, prefs);
  };

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setHasChanges(true);
    applyPreferences(newPreferences);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
      setHasChanges(false);
      toast.success("Accessibility preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    applyPreferences(defaultPreferences);
    localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
    setHasChanges(false);
    toast.success("Preferences reset to defaults");
  };

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          Text Size & Readability
        </h2>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Font Size</Label>
            <RadioGroup
              value={preferences.fontSize}
              onValueChange={(value) => updatePreference("fontSize", value as AccessibilityPreferences["fontSize"])}
              className="grid grid-cols-2 gap-3"
            >
              {Object.entries(fontSizeConfig).map(([key, config]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Label
                    htmlFor={`font-${key}`}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      preferences.fontSize === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={key} id={`font-${key}`} />
                      <span style={{ fontSize: config.value }}>{config.label}</span>
                    </div>
                    {preferences.fontSize === key && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Line Height</Label>
              <span className="text-sm text-muted-foreground">{preferences.lineHeight.toFixed(1)}</span>
            </div>
            <Slider
              value={[preferences.lineHeight]}
              onValueChange={([value]) => updatePreference("lineHeight", value)}
              min={1}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Compact</span>
              <span>Spacious</span>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Font Style</Label>
            <RadioGroup
              value={preferences.fontFamily}
              onValueChange={(value) => updatePreference("fontFamily", value as AccessibilityPreferences["fontFamily"])}
              className="grid grid-cols-1 gap-3"
            >
              {Object.entries(fontFamilyConfig).map(([key, config]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Label
                    htmlFor={`font-family-${key}`}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      preferences.fontFamily === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={key} id={`font-family-${key}`} />
                      <div>
                        <span className={`font-medium ${key === "dyslexia" ? "font-['OpenDyslexic']" : ""}`}>
                          {config.label}
                        </span>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    {key === "dyslexia" && (
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    )}
                    {preferences.fontFamily === key && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
            {preferences.fontFamily === "dyslexia" && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg mt-3"
              >
                ✓ OpenDyslexic font is now active. This font is designed to increase readability for readers with dyslexia.
              </motion.p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">High Contrast Text</p>
                <p className="text-sm text-muted-foreground">Increase text contrast for better readability</p>
              </div>
            </div>
            <Switch
              checked={preferences.highContrastText}
              onCheckedChange={(checked) => updatePreference("highContrastText", checked)}
            />
          </div>
        </div>
      </div>

      {/* Motion & Animations */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Motion & Animations
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Reduce Motion</p>
                <p className="text-sm text-muted-foreground">Minimize animations and transitions throughout the app</p>
              </div>
            </div>
            <Switch
              checked={preferences.reducedMotion}
              onCheckedChange={(checked) => updatePreference("reducedMotion", checked)}
            />
          </div>
          
          {preferences.reducedMotion && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg"
            >
              ✓ Animations are now minimized. Page transitions, hover effects, and decorative animations will be reduced or disabled.
            </motion.p>
          )}
        </div>
      </div>

      {/* Screen Reader & Assistive Technology */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Screen Reader & Assistive Technology
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Screen Reader Optimizations</p>
                <p className="text-sm text-muted-foreground">Add extra labels and improve navigation for screen readers</p>
              </div>
            </div>
            <Switch
              checked={preferences.screenReaderOptimized}
              onCheckedChange={(checked) => updatePreference("screenReaderOptimized", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <Accessibility className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Enhanced Focus Indicators</p>
                <p className="text-sm text-muted-foreground">Show larger, more visible focus rings when using keyboard navigation</p>
              </div>
            </div>
            <Switch
              checked={preferences.focusIndicators}
              onCheckedChange={(checked) => updatePreference("focusIndicators", checked)}
            />
          </div>
        </div>
      </div>

      {/* Theme Shortcuts */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Accessibility className="w-5 h-5" />
          Accessibility Themes
        </h2>
        
        <p className="text-sm text-muted-foreground mb-4">
          Quick access to color-blind friendly themes. You can also access these from the theme menu in the navigation bar.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "high-contrast", label: "High Contrast", desc: "Maximum visibility" },
            { key: "protanopia", label: "Protanopia", desc: "Red-blind friendly" },
            { key: "deuteranopia", label: "Deuteranopia", desc: "Green-blind friendly" },
            { key: "tritanopia", label: "Tritanopia", desc: "Blue-blind friendly" },
          ].map((item) => (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme(item.key as Theme)}
              className={`p-4 rounded-xl border text-left transition-colors ${
                theme === item.key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              {theme === item.key && (
                <Check className="w-4 h-4 text-primary mt-2" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Save/Reset Buttons */}
      <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button 
          variant="gradient" 
          onClick={savePreferences}
          disabled={!hasChanges || saving}
        >
          {saving ? "Saving..." : hasChanges ? "Save Preferences" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
