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

export default function SmartLinkBio() {
  const [activeCategory, setActiveCategory] = useState<string>("All templates");
  const [previewMode, setPreviewMode] = useState<"phone" | "full">("phone");

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
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" /> SmartLink Bio
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              One link for <span className="gradient-text">everything you are</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Beautiful templates, powerful features, and pricing that scales with you — all in one bio link.
            </motion.p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup"><Button variant="gradient" size="lg" className="shadow-glow">Create your bio free</Button></Link>
              <a href="#pricing"><Button variant="outline" size="lg">See pricing</Button></a>
            </div>
          </div>
        </section>

        {/* Live Preview + Editor */}
        <section id="preview" className="py-16 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Try it live — <span className="gradient-text">edit as you go</span>
              </h2>
              <p className="text-muted-foreground">
                Change your name and bio, pick a template, and watch your public SmartLink update instantly.
              </p>
            </div>

            <div ref={previewRef} data-smartlink-editor className="grid lg:grid-cols-[1fr_420px] gap-10 items-start max-w-6xl mx-auto">
              {/* Editor */}
              <div className="order-2 lg:order-1 space-y-5 rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wand2 className="w-4 h-4 text-primary" /> Your bio content
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button" size="icon" variant="ghost"
                      onClick={undo} disabled={!canUndo}
                      aria-label="Undo" title="Undo (⌘Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button" size="icon" variant="ghost"
                      onClick={redo} disabled={!canRedo}
                      aria-label="Redo" title="Redo (⌘⇧Z)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button" size="sm" variant="ghost"
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

                <div className="space-y-1.5">
                  <Label htmlFor="sl-name">Display name</Label>
                  <Input
                    id="sl-name"
                    value={draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    maxLength={40}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "sl-name-err" : undefined}
                  />
                  {errors.name && (
                    <p id="sl-name-err" className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sl-handle">Username</Label>
                  <Input
                    id="sl-handle"
                    value={draft.handle}
                    onChange={(e) => updateDraft({ handle: e.target.value.replace(/\s+/g, "") })}
                    maxLength={30}
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? "sl-handle-err" : undefined}
                  />
                  {errors.username && (
                    <p id="sl-handle-err" className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sl-bio">Bio</Label>
                  <Textarea
                    id="sl-bio"
                    value={draft.bio}
                    onChange={(e) => updateDraft({ bio: e.target.value })}
                    rows={3}
                    maxLength={200}
                    aria-invalid={!!errors.bio}
                    aria-describedby={errors.bio ? "sl-bio-err" : undefined}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={errors.bio ? "text-destructive flex items-center gap-1" : "text-transparent"}>
                      {errors.bio && <><AlertCircle className="w-3 h-3" />{errors.bio}</>}
                    </span>
                    <span className={draft.bio.length > 160 ? "text-destructive" : "text-muted-foreground"}>
                      {draft.bio.length}/160
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  Current template: <span className="font-semibold text-foreground">{selected.name}</span> · {selected.category}
                </div>
                <Link to="/signup" className="block">
                  <Button variant="gradient" className="w-full" disabled={!validation.success}>
                    {validation.success ? "Publish this bio" : "Fix errors to publish"}
                  </Button>
                </Link>
              </div>

              {/* Live preview with mode toggle */}
              <div className="order-1 lg:order-2">
                <div className="flex items-center justify-center gap-1 mb-4 p-1 rounded-full bg-secondary/60 w-fit mx-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("phone")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                      previewMode === "phone" ? "bg-background shadow" : "text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("full")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                      previewMode === "full" ? "bg-background shadow" : "text-muted-foreground"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Full width
                  </button>
                </div>

                <div className={previewMode === "phone" ? "mx-auto w-full max-w-[300px]" : "mx-auto w-full max-w-[420px]"}>
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
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Live preview · saved automatically
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Templates */}
        <section id="templates" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                A SmartLink template to suit <span className="gradient-text">every brand and creator</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Different link styles, integrations and visuals help you build a bio that looks and feels like you.
              </p>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] gap-10">
              <aside className="lg:sticky lg:top-28 self-start">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-4">
                  BROWSE BY CATEGORY
                </p>
                <div className="flex lg:flex-col flex-wrap gap-2">
                  {templateCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium text-left transition-all lg:w-full ${
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

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredTemplates.map((template, index) => {
                  const isSelected = template.username === selectedUsername;
                  return (
                    <motion.div
                      key={template.username}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.04 }}
                      className="group"
                    >
                      <div className="relative">
                        <TemplatePhoneCard
                          template={template}
                          className={`transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow ${
                            isSelected ? "ring-2 ring-primary shadow-glow" : ""
                          }`}
                        />
                        {isSelected && (
                          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-1 shadow">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{template.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{template.username} · {template.category}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isSelected ? "secondary" : "gradient"}
                          onClick={() => applyTemplate(template)}
                          className="shrink-0"
                        >
                          {isSelected ? "Applied" : "Use this template"}
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
        <section id="features" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need to <span className="gradient-text">grow</span></h2>
              <p className="text-muted-foreground">Powerful features built for creators, makers, and brands.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-glow transition-all"
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" ref={pricingRef} className="py-20 scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple, transparent <span className="gradient-text">pricing</span></h2>
              <p className="text-muted-foreground">Start free. Scale when you are ready.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${plan.popular ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-background text-foreground text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>{plan.period}</span>}
                  </div>
                  <Link to="/signup">
                    <Button
                      variant={plan.popular ? "heroOutline" : "gradient"}
                      className={`w-full mb-8 ${plan.popular ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}`}
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
                </motion.div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Need bulk seats or enterprise?{" "}
              <Link to="/contact" className="text-primary hover:underline">Contact sales</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
