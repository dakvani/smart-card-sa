import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3, CreditCard, Layers, Lock, Palette, Smartphone,
  Check, Sparkles, Wand2, Undo2, Redo2, Monitor, AlertCircle,
  Home, Grid3x3, Zap, DollarSign, Eye, Pencil,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SEO } from "@/components/SEO";
import {
  templates, templateCategories, bioInputSchema,
  type TemplateProfile, type BioInput,
} from "@/lib/smartlink-templates";
import { TemplatePhoneCard } from "@/components/smartlink/TemplatePhoneCard";
import { useHistoryState, useDebouncedCommit } from "@/hooks/use-history-state";

const features = [
  { icon: Layers, title: "Link Management", description: "Unlimited links with drag-and-drop reordering and scheduling." },
  { icon: Palette, title: "Deep Customization", description: "Themes, fonts, animated backgrounds, custom CSS." },
  { icon: BarChart3, title: "Real-time Analytics", description: "Views, clicks, geography, devices — all live." },
  { icon: CreditCard, title: "Monetization", description: "Tips, products, payments directly from your bio." },
  { icon: Smartphone, title: "Mobile First", description: "Stunning on every device, lightning fast." },
  { icon: Lock, title: "Privacy & Security", description: "Enterprise-grade. Control what is public." },
];

const plans = [
  { name: "Free", price: "SAR 0", description: "Get started in minutes",
    features: ["Unlimited links", "5 base themes", "Tip jar", "28-day analytics"],
    cta: "Start free", popular: false },
  { name: "Starter", price: "SAR 19", period: "/mo", description: "For growing creators",
    features: ["Everything in Free", "Custom fonts & BGs", "Spotlight links", "6 months analytics", "Priority Help & Support"],
    cta: "Try Starter", popular: true },
  { name: "Pro", price: "SAR 56", period: "/mo", description: "Power users & brands",
    features: ["Everything in Starter", "Remove branding", "Export email list", "GA / Pixel", "Custom CSS", "API access"],
    cta: "Try Pro", popular: false },
];

type EditorState = { username: string; name: string; bio: string; handle: string };

const STORAGE_KEY = "smartlink.editor.v1";


const loadInitial = (): EditorState => {
  const fallback: EditorState = {
    username: templates[0].username,
    name: templates[0].name,
    bio: templates[0].bio,
    handle: templates[0].username,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<EditorState>;
    // Only restore username if template still exists.
    const exists = templates.find((t) => t.username === parsed.username);
    return {
      username: exists?.username ?? fallback.username,
      name: typeof parsed.name === "string" ? parsed.name : fallback.name,
      bio: typeof parsed.bio === "string" ? parsed.bio : fallback.bio,
      handle: typeof parsed.handle === "string" ? parsed.handle : fallback.handle,
    };
  } catch {
    return fallback;
  }
};

type MobileTab = "hero" | "studio" | "templates";

export default function SmartLinkBio() {
  const [activeCategory, setActiveCategory] = useState<string>("All templates");
  const [previewMode, setPreviewMode] = useState<"phone" | "full">("phone");
  const [mobileTab, setMobileTab] = useState<MobileTab>("hero");

  // Persisted, history-tracked editor state.
  const initial = useMemo(loadInitial, []);
  const history = useHistoryState<EditorState>(initial, 60);
  const { value: editor, set: pushHistory, replace: replaceHistory, undo, redo, canUndo, canRedo, reset } = history;

  // Local input state (typed live, committed to history after a short pause).
  const [draft, setDraft] = useState<EditorState>(initial);
  useEffect(() => { setDraft(editor); }, [editor]);
  useDebouncedCommit(draft, (v) => {
    if (v.name !== editor.name || v.bio !== editor.bio || v.handle !== editor.handle || v.username !== editor.username) {
      pushHistory(v);
    }
  }, 450);

  // Persist committed history value.
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(editor)); } catch { /* ignore */ }
  }, [editor]);

  // Zod validation for friendly field errors.
  const validation = useMemo(() => bioInputSchema.safeParse({
    name: draft.name, username: draft.handle, bio: draft.bio,
  } satisfies BioInput), [draft]);
  const errors: Partial<Record<"name" | "username" | "bio", string>> = {};
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "username" || key === "bio") {
        errors[key] ??= issue.message;
      }
    }
  }

  const selected: TemplateProfile =
    templates.find((t) => t.username === editor.username) ?? templates[0];

  const filteredTemplates = useMemo(
    () => (activeCategory === "All templates"
      ? templates
      : templates.filter((t) => t.category === activeCategory)),
    [activeCategory],
  );

  const location = useLocation();
  const pricingRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (location.hash !== "#pricing") return;
    setMobileTab("pricing");
    let tries = 0;
    const tick = () => {
      const el = pricingRef.current ?? document.getElementById("pricing");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        trackEvent("pricing_section_landed", { source: "hash", path: location.pathname });
      } else if (tries++ < 20) setTimeout(tick, 100);
    };
    setTimeout(tick, 50);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const el = pricingRef.current ?? document.getElementById("pricing");
    if (!el || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !fired) {
          fired = true;
          trackEvent("pricing_section_viewed", { path: location.pathname });
        }
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [location.pathname]);

  // Keyboard shortcuts for undo/redo while focused inside the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-smartlink-editor]")) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault(); redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const applyTemplate = (t: TemplateProfile) => {
    pushHistory({ username: t.username, name: t.name, bio: t.bio, handle: t.username });
    trackEvent("smartlink_template_selected", { username: t.username, category: t.category });
    // On mobile, jump to the Preview tab so the user sees the change immediately.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMobileTab("studio");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const updateDraft = (patch: Partial<EditorState>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="SmartLink Bio — Digital Profile Builder, Themes & Analytics"
        description="Build a customizable bio-link profile in minutes. Unlimited links, drag-and-drop, deep theming, scheduling, and real-time click analytics."
        path="/smartlink-bio"
      />
      <Navbar />

      <main className="flex-1 pt-14 md:pt-24 mobile-safe-bottom md:pb-0">
        {/* Hero */}
        <section className={`relative py-5 sm:py-16 md:py-20 overflow-hidden ${mobileTab === "hero" ? "" : "hidden"} md:block`}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-medium mb-2 sm:mb-6"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> SmartLink Bio
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-6 leading-tight"
            >
              One link for <span className="gradient-text">everything you are</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3 sm:mb-8"
            >
              Beautiful templates, powerful features, and pricing that scales with you.
            </motion.p>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <Link to="/signup"><Button variant="gradient" size="sm" className="h-8 text-xs sm:h-11 sm:text-sm sm:px-8 shadow-glow">Create free</Button></Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs sm:h-11 sm:text-sm sm:px-8"
                onClick={() => {
                  setMobileTab("hero");
                  requestAnimationFrame(() => {
                    (pricingRef.current ?? document.getElementById("pricing"))?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }}
              >
                See pricing
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs sm:hidden"
                onClick={() => { setMobileTab("studio"); window.scrollTo({ top: 0 }); }}
              >
                Try live preview →
              </Button>
            </div>
          </div>
        </section>


        {/* Studio: Editor + Live Preview merged */}
        <section id="preview" className={`py-3 sm:py-16 bg-secondary/20 border-y border-border ${mobileTab === "studio" ? "" : "hidden"} md:block`}>
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-10 max-w-2xl mx-auto">
              <h2 className="text-base sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-3 leading-tight">
                Try it live — <span className="gradient-text">edit as you go</span>
              </h2>
              <p className="hidden sm:block text-xs sm:text-base text-muted-foreground">
                Change your name, pick a template, and watch your SmartLink update instantly.
              </p>
            </div>

            <div ref={previewRef} data-smartlink-editor className="grid lg:grid-cols-[1fr_420px] gap-3 sm:gap-10 items-start max-w-6xl mx-auto">
              {/* Editor — first on mobile (top), second on desktop (left) */}
              <div className="order-1 lg:order-1 space-y-2.5 sm:space-y-5 rounded-xl sm:rounded-2xl border border-border bg-card p-2.5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-sm font-semibold">
                    <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> Edit your bio
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)" className="h-7 w-7 sm:h-9 sm:w-9">
                      <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⌘⇧Z)" className="h-7 w-7 sm:h-9 sm:w-9">
                      <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button" size="sm" variant="ghost"
                      className="h-7 px-2 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
                      onClick={() => {
                        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
                        const first = templates[0];
                        reset({ username: first.username, name: first.name, bio: first.bio, handle: first.username });
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-5">
                  <div className="space-y-1">
                    <Label htmlFor="sl-name" className="text-[11px] sm:text-xs">Display name</Label>
                    <Input
                      id="sl-name"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                      value={draft.name}
                      onChange={(e) => updateDraft({ name: e.target.value })}
                      maxLength={40}
                      aria-invalid={!!errors.name}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sl-handle" className="text-[11px] sm:text-xs">Username</Label>
                    <Input
                      id="sl-handle"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                      value={draft.handle}
                      onChange={(e) => updateDraft({ handle: e.target.value.replace(/\s+/g, "") })}
                      maxLength={30}
                      aria-invalid={!!errors.username}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sl-bio" className="text-[11px] sm:text-xs">Bio</Label>
                  <Textarea
                    id="sl-bio"
                    value={draft.bio}
                    onChange={(e) => updateDraft({ bio: e.target.value })}
                    rows={2}
                    maxLength={200}
                    className="text-xs sm:text-sm resize-none"
                    aria-invalid={!!errors.bio}
                  />
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className={errors.bio ? "text-destructive flex items-center gap-1" : "text-transparent"}>
                      {errors.bio && <><AlertCircle className="w-3 h-3" />{errors.bio}</>}
                    </span>
                    <span className={draft.bio.length > 160 ? "text-destructive" : "text-muted-foreground"}>
                      {draft.bio.length}/160
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/40 px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs text-muted-foreground truncate">
                  Template: <span className="font-semibold text-foreground">{selected.name}</span> · {selected.category}
                </div>
                <Link to="/signup" className="block">
                  <Button variant="gradient" size="sm" className="w-full h-9 text-xs sm:h-11 sm:text-base" disabled={!validation.success}>
                    {validation.success ? "Publish this bio" : "Fix errors to publish"}
                  </Button>
                </Link>
              </div>

              {/* Live preview — second on mobile (below editor), first on desktop (right) */}
              <div className="order-2 lg:order-2">
                <div className="hidden sm:flex items-center justify-center gap-1 mb-2 sm:mb-4 p-0.5 sm:p-1 rounded-full bg-secondary/60 w-fit mx-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("phone")}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition ${
                      previewMode === "phone" ? "bg-background shadow" : "text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("full")}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition ${
                      previewMode === "full" ? "bg-background shadow" : "text-muted-foreground"
                    }`}
                  >
                    <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Full
                  </button>
                </div>

                <p className="sm:hidden text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Eye className="w-3 h-3 inline -mt-0.5 mr-1" />Live preview
                </p>
                <div className={previewMode === "phone" ? "mx-auto w-full max-w-[150px] sm:max-w-[300px]" : "mx-auto w-full max-w-[180px] sm:max-w-[420px]"}>
                  <TemplatePhoneCard
                    template={selected}
                    size="full"
                    overrides={{
                      name: (draft.name || selected.name).slice(0, 40),
                      bio: draft.bio.slice(0, 200),
                      username: draft.handle,
                    }}
                  />
                </div>
                <p className="mt-1 sm:mt-3 text-center text-[10px] sm:text-xs text-muted-foreground">
                  Saved automatically
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Templates */}
        <section id="templates" className={`py-4 sm:py-16 md:py-20 ${mobileTab === "templates" ? "" : "hidden"} md:block`}>
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-3 sm:mb-12 max-w-3xl mx-auto">
              <h2 className="text-lg sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-4 tracking-tight leading-tight">
                A template for <span className="gradient-text">every brand</span>
              </h2>
              <p className="hidden sm:block text-xs sm:text-base md:text-lg text-muted-foreground">
                Different link styles, integrations and visuals to match your vibe.
              </p>
            </div>


            <div className="flex flex-col lg:grid lg:grid-cols-[220px_minmax(0,1fr)] gap-4 sm:gap-10">
              <aside className="lg:sticky lg:top-28 self-start -mx-4 px-4 lg:mx-0 lg:px-0">
                <p className="hidden lg:block text-xs font-semibold tracking-widest text-muted-foreground mb-4">
                  BROWSE BY CATEGORY
                </p>
                <div className="flex lg:flex-col gap-1.5 sm:gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide -mx-1 px-1 pb-1 lg:mx-0 lg:px-0">
                  {templateCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium text-left transition-all lg:w-full ${
                        activeCategory === cat
                          ? "bg-foreground text-background"
                          : "bg-secondary/60 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </aside>

              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-8 min-w-0">
                {filteredTemplates.map((template, index) => {
                  const isSelected = template.username === editor.username;
                  return (
                    <motion.div
                      key={template.username}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.04 }}
                      className="group"
                    >
                      <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden">
                        <TemplatePhoneCard
                          template={template}
                          className={`transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow ${
                            isSelected ? "ring-2 ring-primary shadow-glow" : ""
                          }`}
                        />
                        {isSelected && (
                          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 shadow">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> On
                          </span>
                        )}
                        {/* Mobile-only info + CTA overlay for compact, always-visible card */}
                        <div className="sm:hidden absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/60 to-transparent">
                          <p className="text-white text-[11px] font-semibold leading-tight truncate">{template.name}</p>
                          <p className="text-white/70 text-[9px] truncate mb-1.5">@{template.username}</p>
                          <Button
                            size="sm"
                            variant={isSelected ? "secondary" : "gradient"}
                            onClick={() => applyTemplate(template)}
                            className="w-full h-7 text-[10px] px-2"
                          >
                            {isSelected ? "Applied" : "Use this"}
                          </Button>
                        </div>
                      </div>

                      {/* Desktop-only label row */}
                      <div className="hidden sm:flex mt-4 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{template.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{template.username}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isSelected ? "secondary" : "gradient"}
                          onClick={() => applyTemplate(template)}
                          className="shrink-0 h-9 text-sm px-3"
                        >
                          {isSelected ? "Applied" : "Use template"}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className={`py-4 sm:py-16 md:py-20 bg-secondary/30 ${mobileTab === "features" ? "" : "hidden"} md:block`}>
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-3 sm:mb-12">
              <h2 className="text-lg sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-3 leading-tight">Everything you need to <span className="gradient-text">grow</span></h2>
              <p className="hidden sm:block text-xs sm:text-base text-muted-foreground">Powerful features for creators, makers, and brands.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-glow transition-all"
                >
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl gradient-primary flex items-center justify-center mb-2 sm:mb-4">
                    <f.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{f.title}</h3>
                  <p className="text-[11px] leading-snug sm:text-sm text-muted-foreground">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" ref={pricingRef} className={`py-4 sm:py-16 md:py-20 scroll-mt-24 ${mobileTab === "pricing" ? "" : "hidden"} md:block`}>
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-3 sm:mb-12">
              <h2 className="text-lg sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-3 leading-tight">Simple, transparent <span className="gradient-text">pricing</span></h2>
              <p className="hidden sm:block text-xs sm:text-base text-muted-foreground">Start free. Scale when you are ready.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className={`relative rounded-xl sm:rounded-2xl p-2.5 sm:p-8 ${plan.popular ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 px-2 py-0.5 sm:px-4 sm:py-1 bg-background text-foreground text-[9px] sm:text-sm font-semibold rounded-full">
                      Popular
                    </div>
                  )}

                  {/* Mobile: compact horizontal row */}
                  <div className="sm:hidden flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="text-sm font-bold">{plan.name}</h3>
                        <span className="text-base font-bold">{plan.price}</span>
                        {plan.period && <span className={`text-[10px] ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>}
                      </div>
                      <p className={`text-[10px] leading-tight line-clamp-1 ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {plan.features.slice(1, 4).join(" · ") || plan.description}
                      </p>
                    </div>
                    <Link to="/signup" className="shrink-0">
                      <Button
                        size="sm"
                        variant={plan.popular ? "heroOutline" : "gradient"}
                        className={`h-8 text-[11px] px-3 ${plan.popular ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>

                  {/* Desktop: full stacked card */}
                  <div className="hidden sm:block">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.period && <span className={`text-base ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>}
                    </div>
                    <p className={`text-sm mb-6 leading-snug ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.description}</p>
                    <Link to="/signup">
                      <Button
                        variant={plan.popular ? "heroOutline" : "gradient"}
                        className={`w-full mb-8 h-11 text-base ${plan.popular ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 mt-0.5 shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                          <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : ""}`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-5 sm:mt-8">
              Need bulk seats or enterprise?{" "}
              <Link to="/contact" className="text-primary hover:underline">Contact sales</Link>
            </p>
          </div>
        </section>
      </main>

      {/* Mobile-only bottom section tabs — single-screen navigation */}
      <nav
        aria-label="SmartLink sections"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          {([
            { id: "hero", label: "Home", Icon: Home },
            { id: "studio", label: "Studio", Icon: Pencil },
            { id: "templates", label: "Themes", Icon: Grid3x3 },
            { id: "features", label: "Features", Icon: Zap },
            { id: "pricing", label: "Pricing", Icon: DollarSign },
          ] as const).map(({ id, label, Icon }) => {
            const active = mobileTab === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab(id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`w-full min-h-[52px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "scale-110" : ""} transition-transform`} />
                  <span className="text-[9px] font-medium tracking-wide">{label}</span>
                  {active && <span className="block w-5 h-0.5 rounded-full bg-primary mt-0.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Footer />
    </div>
  );
}
