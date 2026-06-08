import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2, Check, Palette, Briefcase, Camera, Sparkles, Lock,
  Stethoscope, Home, Trophy, Music, UtensilsCrossed, Dumbbell,
  Code, Star, GraduationCap, Gauge, Eye, EyeOff, Upload, X, Crown, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { UnlockProDialog } from "./UnlockProDialog";
import { TemplatePreview } from "./TemplatePreview";
import type { UserPlan } from "@/hooks/use-plan";

export type CustomBackground = { url: string; type: "image" | "video" } | null;

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  theme_name: string;
  theme_gradient: string;
  gradient_direction: string;
  is_premium: boolean;
  required_plan?: "free" | "starter" | "pro" | null;
  animation_type: string | null;
  apply_count?: number | null;
  view_count?: number | null;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;  // 25 MB
const MAX_VIDEO_DURATION = 15;              // seconds

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read video metadata"));
    };
    v.src = url;
  });
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
  userId?: string;
  initialCustomBackground?: CustomBackground;
  initialAnimationSpeed?: number;
  initialMotionEnabled?: boolean;
  onPersist?: (updates: {
    custom_background_url?: string | null;
    custom_background_type?: "image" | "video" | null;
    animation_speed?: number;
    motion_enabled?: boolean;
  }) => void;
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

const PRO_TIERS: UserPlan[] = ["pro", "pro_plus", "business", "enterprise", "lifetime"];

const planRank = (p: UserPlan): number => {
  if (PRO_TIERS.includes(p)) return 2;
  if (p === "starter") return 1;
  return 0;
};
const requiredRank = (r: Template["required_plan"], isPremium: boolean): number => {
  const v = r ?? (isPremium ? "pro" : "free");
  return v === "pro" ? 2 : v === "starter" ? 1 : 0;
};

export function ProfileTemplates({
  onApply,
  currentThemeName,
  isPro = false,
  plan,
  userId,
  initialCustomBackground = null,
  initialAnimationSpeed = 1,
  initialMotionEnabled = true,
  onPersist,
}: ProfileTemplatesProps) {
  const effectivePlan: UserPlan = plan ?? (isPro ? "pro" : "free");
  const isProTier = isPro || PRO_TIERS.includes(effectivePlan);
  const isStarter = effectivePlan === "starter";
  const isFree = effectivePlan === "free";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [applying, setApplying] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockFeature, setUnlockFeature] = useState<string | undefined>();

  // Persistent Pro motion controls + custom background (single, profile-wide)
  const [speed, setSpeed] = useState(initialAnimationSpeed);
  const [motionEnabled, setMotionEnabled] = useState(initialMotionEnabled);
  const [customMedia, setCustomMedia] = useState<CustomBackground>(initialCustomBackground);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Per-user hidden templates (UI-only) — persisted to localStorage
  const hiddenKey = `tpl_hidden:${userId || "anon"}`;
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(hiddenKey) || "[]")); }
    catch { return new Set(); }
  });
  const [showHidden, setShowHidden] = useState(false);
  const persistHidden = (next: Set<string>) => {
    setHiddenIds(new Set(next));
    try { localStorage.setItem(hiddenKey, JSON.stringify([...next])); } catch { /* noop */ }
  };
  const toggleHide = (id: string, name: string) => {
    const next = new Set(hiddenIds);
    if (next.has(id)) {
      next.delete(id);
      toast.success(`"${name}" restored to gallery`);
    } else {
      next.add(id);
      toast.success(`"${name}" hidden from gallery`);
    }
    persistHidden(next);
  };

  useEffect(() => { loadTemplates(); }, []);
  // Record one view per template per session (rough impression metric)
  useEffect(() => {
    if (loading || templates.length === 0) return;
    try {
      const key = "tpl_view_session";
      const seen = new Set<string>(JSON.parse(sessionStorage.getItem(key) || "[]"));
      const fresh = templates.filter((t) => !seen.has(t.id));
      fresh.forEach((t) => {
        seen.add(t.id);
        supabase.rpc("increment_template_view" as any, { template_uuid: t.id });
      });
      if (fresh.length) sessionStorage.setItem(key, JSON.stringify([...seen]));
    } catch { /* noop */ }
  }, [loading, templates]);
  useEffect(() => { setCustomMedia(initialCustomBackground); }, [initialCustomBackground?.url]); // eslint-disable-line
  useEffect(() => { setSpeed(initialAnimationSpeed); }, [initialAnimationSpeed]);
  useEffect(() => { setMotionEnabled(initialMotionEnabled); }, [initialMotionEnabled]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_templates").select("*").order("category", { ascending: true });
      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (error: any) {
      console.error("Failed to load templates:", error.message);
    } finally { setLoading(false); }
  };

  const isLocked = (t: Template) => requiredRank(t.required_plan, t.is_premium) > planRank(effectivePlan);

  const lockReason = (t: Template) => {
    const rank = requiredRank(t.required_plan, t.is_premium);
    if (rank === 2) return "Pro plan required";
    if (rank === 1) return "Starter plan required";
    return "";
  };

  const applyTemplate = async (template: Template) => {
    if (isLocked(template)) {
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
      // Optimistic local bump + persist count
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id ? { ...t, apply_count: (t.apply_count || 0) + 1 } : t
        )
      );
      supabase.rpc("increment_template_apply" as any, { template_uuid: template.id });
      toast.success(`Applied "${template.name}" template!`);
    } finally {
      setTimeout(() => setApplying(null), 500);
    }
  };

  const persist = async (updates: Parameters<NonNullable<ProfileTemplatesProps["onPersist"]>>[0]) => {
    if (!userId) return;
    onPersist?.(updates);
    const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", userId);
    if (error) toast.error(error.message);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isProTier) {
      setUnlockFeature("Custom template backgrounds");
      setUnlockOpen(true);
      e.target.value = "";
      return;
    }
    if (!userId) {
      toast.error("Please sign in first");
      e.target.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Unsupported file. Please upload an image or video.");
      e.target.value = "";
      return;
    }
    if (isImage && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Unsupported image format. Use JPG, PNG, WEBP or GIF.");
      e.target.value = "";
      return;
    }
    if (isVideo && !ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast.error("Unsupported video format. Use MP4, WEBM or MOV.");
      e.target.value = "";
      return;
    }
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      toast.error(
        isVideo
          ? `Video too large. Max ${MAX_VIDEO_BYTES / (1024 * 1024)}MB.`
          : `Image too large. Max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.`
      );
      e.target.value = "";
      return;
    }
    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_DURATION + 0.25) {
          toast.error(`Video too long (${Math.round(duration)}s). Max ${MAX_VIDEO_DURATION}s — trim it first.`);
          e.target.value = "";
          return;
        }
      } catch {
        toast.error("Could not read this video. Try a different file.");
        e.target.value = "";
        return;
      }
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${userId}/template-bg/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const type: "image" | "video" = isVideo ? "video" : "image";
      setCustomMedia({ url: pub.publicUrl, type });
      await persist({ custom_background_url: pub.publicUrl, custom_background_type: type });
      toast.success("Custom background saved");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const clearCustomMedia = async () => {
    setCustomMedia(null);
    await persist({ custom_background_url: null, custom_background_type: null });
    toast.success("Custom background removed");
  };

  const commitSpeed = (v: number) => {
    setSpeed(v);
    persist({ animation_speed: v });
  };
  const toggleMotion = (enabled: boolean) => {
    setMotionEnabled(enabled);
    persist({ motion_enabled: enabled });
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
              <span className="text-muted-foreground"> — Free + Starter templates available. Pro templates with video loops and custom backgrounds require an upgrade.</span>
            </>
          ) : (
            <>
              <span className="font-semibold">Free plan</span>
              <span className="text-muted-foreground"> — only Free templates. Starter and Pro templates are locked until you upgrade.</span>
            </>
          )}
        </div>
        {!isProTier && (
          <Button size="sm" variant="gradient" className="h-7 text-[11px]" onClick={() => { setUnlockFeature("Premium templates"); setUnlockOpen(true); }}>
            <Sparkles className="w-3 h-3" /> Upgrade
          </Button>
        )}
      </div>

      {/* Pro motion controls + global custom background */}
      {isProTier && (
        <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Reduce motion (accessibility)
            </Label>
            <Switch checked={!motionEnabled} onCheckedChange={(v) => toggleMotion(!v)} />
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
              onValueCommit={(v) => commitSpeed(v[0])}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="min-w-0">
              <p className="text-xs font-medium">Custom background</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {customMedia ? `${customMedia.type === "video" ? "Video" : "Image"} saved — visible on your live profile` : "Image ≤5MB (JPG/PNG/WEBP/GIF) or video ≤25MB & 15s (MP4/WEBM/MOV)"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {customMedia && (
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={clearCustomMedia}>
                  <X className="w-3 h-3" /> Remove
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {customMedia ? "Replace" : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top templates leaderboard */}
      {(() => {
        const top = [...templates]
          .filter((t) => (t.apply_count || 0) + (t.view_count || 0) > 0)
          .sort((a, b) =>
            ((b.apply_count || 0) * 3 + (b.view_count || 0)) -
            ((a.apply_count || 0) * 3 + (a.view_count || 0))
          )
          .slice(0, 3);
        if (top.length === 0) return null;
        return (
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top templates
              </p>
              <span className="text-[10px] text-muted-foreground">By applies × views</span>
            </div>
            <ol className="space-y-1.5">
              {top.map((t, i) => (
                <li key={t.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                    : i === 1 ? "bg-zinc-400/20 text-zinc-600 dark:text-zinc-300"
                    : "bg-orange-600/20 text-orange-700 dark:text-orange-300"
                  }`}>{i + 1}</span>
                  <span className="font-medium truncate flex-1">{t.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t.apply_count || 0} applies · {t.view_count || 0} views
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      })()}

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

      {/* Hidden file input */}
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
          const locked = isLocked(template);
          const rank = requiredRank(template.required_plan, template.is_premium);
          const tierLabel = rank === 2 ? "Pro" : rank === 1 ? "Starter" : "Free";
          const tierClass = rank === 2
            ? "bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40"
            : rank === 1
            ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/40"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";

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
                {/* usage badge */}
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/70 backdrop-blur text-[10px] text-foreground/90 border border-border/60">
                  <Eye className="w-2.5 h-2.5" />
                  <span className="tabular-nums">{template.view_count || 0}</span>
                  <span className="opacity-50">·</span>
                  <Check className="w-2.5 h-2.5" />
                  <span className="tabular-nums">{template.apply_count || 0}</span>
                </div>
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
                      {lockReason(template)}
                    </span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${tierClass}`}>
                        {tierLabel}
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
              </div>

              {rank === 2 && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 text-[10px] font-bold uppercase shadow-sm z-30">
                  Pro
                </div>
              )}
              {rank === 1 && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold uppercase shadow-sm z-30">
                  Starter
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
