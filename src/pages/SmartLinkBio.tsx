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
  Check, Sparkles, Wand2,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SEO } from "@/components/SEO";
import { templates, templateCategories, type TemplateProfile } from "@/lib/smartlink-templates";
import { TemplatePhoneCard } from "@/components/smartlink/TemplatePhoneCard";

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

export default function SmartLinkBio() {
  const [activeCategory, setActiveCategory] = useState<string>("All templates");
  const [selectedUsername, setSelectedUsername] = useState<string>(templates[0].username);
  const [bioName, setBioName] = useState<string>(templates[0].name);
  const [bioText, setBioText] = useState<string>(templates[0].bio);
  const [bioHandle, setBioHandle] = useState<string>(templates[0].username);

  const selected: TemplateProfile =
    templates.find((t) => t.username === selectedUsername) ?? templates[0];

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

  const applyTemplate = (t: TemplateProfile) => {
    setSelectedUsername(t.username);
    setBioName(t.name);
    setBioText(t.bio);
    setBioHandle(t.username);
    trackEvent("smartlink_template_selected", { username: t.username, category: t.category });
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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

            <div ref={previewRef} className="grid lg:grid-cols-[1fr_360px] gap-10 items-start max-w-5xl mx-auto">
              {/* Editor */}
              <div className="order-2 lg:order-1 space-y-5 rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wand2 className="w-4 h-4 text-primary" /> Your bio content
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sl-name">Display name</Label>
                  <Input id="sl-name" value={bioName} onChange={(e) => setBioName(e.target.value)} maxLength={40} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sl-handle">Username</Label>
                  <Input id="sl-handle" value={bioHandle} onChange={(e) => setBioHandle(e.target.value.replace(/\s+/g, ""))} maxLength={30} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sl-bio">Bio</Label>
                  <Textarea id="sl-bio" value={bioText} onChange={(e) => setBioText(e.target.value)} rows={3} maxLength={160} />
                  <p className="text-xs text-muted-foreground text-right">{bioText.length}/160</p>
                </div>
                <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  Current template: <span className="font-semibold text-foreground">{selected.name}</span> · {selected.category}
                </div>
                <Link to="/signup" className="block">
                  <Button variant="gradient" className="w-full">Publish this bio</Button>
                </Link>
              </div>

              {/* Live preview */}
              <div className="order-1 lg:order-2 mx-auto w-full max-w-[300px]">
                <TemplatePhoneCard
                  template={selected}
                  size="full"
                  overrides={{ name: bioName || selected.name, bio: bioText, username: bioHandle }}
                />
                <p className="mt-3 text-center text-xs text-muted-foreground">Live preview</p>
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
