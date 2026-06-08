import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2, Check, Palette, Briefcase, Camera, Sparkles, Lock,
  Stethoscope, Home, Trophy, Music, UtensilsCrossed, Dumbbell,
  Code, Star, GraduationCap, Gauge, Eye, Upload, X, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { UnlockProDialog } from "./UnlockProDialog";
import { TemplatePreview } from "./TemplatePreview";
import type { UserPlan } from "@/hooks/use-plan";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  theme_name: string;
  theme_gradient: string;
  gradient_direction: string;
  is_premium: boolean;
  animation_type: string | null;
}

interface ProfileTemplatesProps {
  onApply: (updates: {
    theme_name: string;
    theme_gradient: string;
    gradient_direction: string;
    custom_bg_color: null;
    custom_accent_color: null;
    animation_type: string | null;
  }) => void;
  currentThemeName: string;
  isPro?: boolean;
  plan?: UserPlan;
}

const categoryIcons: Record<string, React.ElementType> = {
  creator: Camera, business: Briefcase, portfolio: Palette, doctor: Stethoscope,
  realtor: Home, coach: Trophy, musician: Music, restaurant: UtensilsCrossed,
  fitness: Dumbbell, photographer: Camera, developer: Code, influencer: Star,
  educator: GraduationCap,
};

const categoryLabels: Record<string, string> = {
  creator: "Creator", business: "Business", portfolio: "Portfolio", doctor: "Doctor",
  realtor: "Realtor", coach: "Coach", musician: "Musician", restaurant: "Restaurant",
  fitness: "Fitness", photographer: "Photographer", developer: "Developer",
  influencer: "Influencer", educator: "Educator",
};

const animationLabels: Record<string, string> = {
  pulse: "✨ Pulse", particles: "⭐ Particles", wave: "🌊 Wave",
  "gradient-shift": "🌈 Shift", glow: "💫 Glow", orbs: "🔮 Orbs",
  shimmer: "✦ Shimmer", neon: "💡 Neon",
};

type CustomMedia = { url: string; type: "image" | "video" } | null;

export function ProfileTemplates({ onApply, currentThemeName, isPro = false, plan }: ProfileTemplatesProps) {
  const effectivePlan: UserPlan = plan ?? (isPro ? "pro" : "free");
  const isProTier = isPro || ["pro", "pro_plus", "business", "enterprise", "lifetime"].includes(effectivePlan);
  const isStarter = effectivePlan === "starter";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [applying, setApplying] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockFeature, setUnlockFeature] = useState<string | undefined>();

  // Pro motion controls
  const [speed, setSpeed] = useState(1);
  const [motionEnabled, setMotionEnabled] = useState(true);

  // Pro custom media (per template)
  const [customMediaByTpl, setCustomMediaByTpl] = useState<Record<string, CustomMedia>>({});
  const [activeUploadFor, setActiveUploadFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => () => {
    // revoke object URLs on unmount
    Object.values(customMediaByTpl).forEach((m) => m && URL.revokeObjectURL(m.url));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_templates").select("*").order("category", { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Failed to load templates:", error.message);
    } finally { setLoading(false); }
  };

  const applyTemplate = async (template: Template) => {
    if (template.is_premium && !isProTier) {
      setUnlockFeature(template.name);
      setUnlockOpen(true);
      return;
    }
    setApplying(template.id);
    try {
      onApply({
        theme_name: template.theme_name,
        theme_gradient: template.theme_gradient,
        gradient_direction: template.gradient_direction || "to-b",
        custom_bg_color: null,
        custom_accent_color: null,
        animation_type: template.animation_type,
      });
      toast.success(`Applied "${template.name}" template!`);
    } finally {
      setTimeout(() => setApplying(null), 500);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const tplId = activeUploadFor;
    if (!file || !tplId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Please upload an image or video.");
      return;
    }
    // revoke prior url for this template
    const prior = customMediaByTpl[tplId];
    if (prior) URL.revokeObjectURL(prior.url);

    const url = URL.createObjectURL(file);
    setCustomMediaByTpl((prev) => ({ ...prev, [tplId]: { url, type: isVideo ? "video" : "image" } }));
    toast.success("Custom background applied to preview");
    e.target.value = "";
    setActiveUploadFor(null);
  };

  const clearCustomMedia = (tplId: string) => {
    const prior = customMediaByTpl[tplId];
    if (prior) URL.revokeObjectURL(prior.url);
    setCustomMediaByTpl((prev) => {
      const next = { ...prev }; delete next[tplId]; return next;
    });
  };

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Profile Templates</h3>
        <p className="text-sm text-muted-foreground">
          Apply a pre-designed theme to your profile with one click
        </p>
      </div>

      {/* Plan tier banner */}
      <div className={`rounded-lg border p-3 text-xs flex items-start gap-2 ${
        isProTier
          ? "border-primary/40 bg-primary/5"
          : isStarter
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-border bg-muted/30"
      }`}>
        {isProTier ? <Crown className="w-4 h-4 text-primary mt-0.5" /> : <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />}
        <div className="flex-1">
          {isProTier ? (
            <>
              <span className="font-semibold text-primary">Pro plan</span>
              <span className="text-muted-foreground"> — full access to all templates, animation controls and custom backgrounds.</span>
            </>
          ) : isStarter ? (
            <>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Starter plan</span>
              <span className="text-muted-foreground"> — you can apply Free templates. Premium templates with video loops and custom backgrounds require Pro.</span>
            </>
          ) : (
            <>
              <span className="font-semibold">Free plan</span>
              <span className="text-muted-foreground"> — basic templates only. Upgrade for category video loops, motion controls and custom uploads.</span>
            </>
          )}
        </div>
        {!isProTier && (
          <Button size="sm" variant="gradient" className="h-7 text-[11px]" onClick={() => { setUnlockFeature("Premium templates"); setUnlockOpen(true); }}>
            <Sparkles className="w-3 h-3" /> Upgrade
          </Button>
        )}
      </div>

      {/* Pro motion controls */}
      {isProTier && (
        <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Reduce motion (accessibility)
            </Label>
            <Switch checked={!motionEnabled} onCheckedChange={(v) => setMotionEnabled(!v)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Animation speed
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">{speed.toFixed(2)}×</span>
            </div>
            <Slider
              value={[speed]}
              min={0.25} max={2} step={0.05}
              disabled={!motionEnabled}
              onValueChange={(v) => setSpeed(v[0])}
            />
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const Icon = categoryIcons[cat] || Palette;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {cat !== "all" && <Icon className="w-4 h-4" />}
              {cat === "all" ? "All" : categoryLabels[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Hidden file input for Pro custom media */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredTemplates.map(template => {
          const isActive = template.theme_name === currentThemeName;
          const Icon = categoryIcons[template.category] || Palette;
          const locked = template.is_premium && !isProTier;
          const customMedia = customMediaByTpl[template.id] || null;

          return (
            <div
              key={template.id}
              className={`relative rounded-xl border overflow-hidden transition-all ${
                isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="relative">
                <TemplatePreview
                  category={template.category}
                  gradientClass={template.theme_gradient}
                  direction={template.gradient_direction || "to-b"}
                  animationType={template.animation_type}
                  name={template.name}
                  speed={speed}
                  motionEnabled={motionEnabled}
                  customMedia={isProTier ? customMedia : null}
                />
                {locked && (
                  <button
                    type="button"
                    onClick={() => { setUnlockFeature(template.name); setUnlockOpen(true); }}
                    className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 cursor-pointer hover:bg-background/40 transition gap-2"
                    aria-label={`Unlock ${template.name}`}
                  >
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                      <Lock className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground/90 bg-background/70 px-2 py-0.5 rounded">
                      {isStarter ? "Upgrade Starter → Pro" : "Pro required"}
                    </span>
                  </button>
                )}
                {customMedia && isProTier && (
                  <button
                    type="button"
                    onClick={() => clearCustomMedia(template.id)}
                    className="absolute top-2 left-2 z-30 w-6 h-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                    aria-label="Remove custom background"
                    title="Remove custom background"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-4 bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        template.is_premium
                          ? "bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {template.is_premium ? "Pro" : "Free · Starter"}
                      </span>
                      {template.animation_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {animationLabels[template.animation_type] || "Animated"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  {locked ? (
                    <Button
                      size="sm" variant="gradient" className="shrink-0"
                      onClick={() => { setUnlockFeature(template.name); setUnlockOpen(true); }}
                    >
                      <Lock className="w-3.5 h-3.5" /> Unlock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={isActive ? "outline" : "gradient"}
                      onClick={() => applyTemplate(template)}
                      disabled={applying === template.id}
                      className="shrink-0"
                    >
                      {applying === template.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isActive ? (
                        <><Check className="w-4 h-4" />Applied</>
                      ) : ("Apply")}
                    </Button>
                  )}
                </div>

                {/* Pro custom media uploader */}
                {isProTier && !locked && (
                  <button
                    type="button"
                    onClick={() => { setActiveUploadFor(template.id); fileRef.current?.click(); }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md border border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-3 h-3" />
                    {customMedia ? "Replace background image / video" : "Upload custom background (image/video)"}
                  </button>
                )}
              </div>

              {template.is_premium && !isProTier && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 text-[10px] font-bold uppercase shadow-sm z-30">
                  Pro
                </div>
              )}
              {template.is_premium && isProTier && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase shadow-sm z-30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pro
                </div>
              )}
            </div>
          );
        })}
      </div>

      <UnlockProDialog open={unlockOpen} onOpenChange={setUnlockOpen} featureName={unlockFeature} />
    </div>
  );
}
