import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BarChart3, CreditCard, Layers, Lock, Palette, Smartphone, Check, Sparkles, Instagram, Youtube, Twitter, Linkedin, Github, Music2, Facebook, Globe, Mail, MessageCircle, Twitch, Camera } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SEO } from "@/components/SEO";


const categories = [
  "All templates",
  "Fashion",
  "Health & Fitness",
  "Creator",
  "Business",
  "Music",
  "Social Media",
  "Tech",
  "Food",
  "Education",
  "Real Estate",
];

type SocialIcon = "instagram" | "youtube" | "x" | "tiktok" | "linkedin" | "github" | "facebook" | "website" | "email" | "whatsapp" | "twitch" | "spotify";

const iconMap: Record<SocialIcon, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  x: Twitter,
  tiktok: Music2,
  linkedin: Linkedin,
  github: Github,
  facebook: Facebook,
  website: Globe,
  email: Mail,
  whatsapp: MessageCircle,
  twitch: Twitch,
  spotify: Camera,
};

type SampleProfile = {
  name: string;
  username: string;
  category: string;
  initials: string;
  bio: string;
  background: string;   // tailwind gradient classes
  buttonStyle: "white" | "peach" | "orange" | "black" | "glass";
  textOnDark: boolean;  // whether name/bio should render light
  links: string[];      // link labels
  socials: SocialIcon[];
};

const templates: SampleProfile[] = [
  {
    name: "Sara Al-Otaibi", username: "sara.designs", category: "Creator",
    initials: "SA", bio: "Brand & visual identity designer",
    background: "bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-500",
    buttonStyle: "white", textOnDark: true,
    links: ["Portfolio", "Book a Project", "Case Studies", "Shop Prints"],
    socials: ["instagram", "youtube", "x", "website"],
  },
  {
    name: "Omar Khaled", username: "omar.dev", category: "Tech",
    initials: "OK", bio: "Full-stack engineer • React, Node, Postgres",
    background: "bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-700",
    buttonStyle: "glass", textOnDark: true,
    links: ["GitHub", "Hire Me", "Open Source", "Read Blog"],
    socials: ["github", "linkedin", "x", "website"],
  },
  {
    name: "Layla Hassan", username: "layla.sings", category: "Music",
    initials: "LH", bio: "Indie pop • New single 'Golden Hour' out now",
    background: "bg-gradient-to-br from-purple-900 via-fuchsia-700 to-pink-600",
    buttonStyle: "white", textOnDark: true,
    links: ["Listen on Spotify", "New Music Video", "Tour Tickets", "Merch Store"],
    socials: ["spotify", "youtube", "instagram", "tiktok"],
  },
  {
    name: "Faisal Aziz", username: "faisal.fit", category: "Health & Fitness",
    initials: "FA", bio: "Certified coach • Strength & nutrition",
    background: "bg-gradient-to-br from-orange-500 via-red-500 to-rose-600",
    buttonStyle: "black", textOnDark: true,
    links: ["8-Week Program", "Book 1:1 Session", "Free Workout PDF", "Supplements"],
    socials: ["instagram", "youtube", "tiktok", "whatsapp"],
  },
  {
    name: "Noura Salem", username: "noura.style", category: "Fashion",
    initials: "NS", bio: "Editorial & personal styling — Dubai",
    background: "bg-gradient-to-br from-amber-200 via-orange-300 to-pink-400",
    buttonStyle: "white", textOnDark: false,
    links: ["Shop My Looks", "Lookbook 2026", "Book Styling", "Newsletter"],
    socials: ["instagram", "tiktok", "youtube", "website"],
  },
  {
    name: "Yousef Rahman", username: "chef.yousef", category: "Food",
    initials: "YR", bio: "Modern Middle Eastern kitchen",
    background: "bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-700",
    buttonStyle: "peach", textOnDark: true,
    links: ["Reserve a Table", "Order Catering", "Recipe Book", "Cooking Classes"],
    socials: ["instagram", "youtube", "tiktok", "website"],
  },
  {
    name: "Reem Al-Fahad", username: "reem.consults", category: "Business",
    initials: "RA", bio: "GTM strategy for early-stage founders",
    background: "bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900",
    buttonStyle: "white", textOnDark: true,
    links: ["Book a Call", "Case Studies", "Newsletter", "Podcast"],
    socials: ["linkedin", "x", "youtube", "email"],
  },
  {
    name: "Dr. Ahmed Nasser", username: "dr.ahmed", category: "Health & Fitness",
    initials: "AN", bio: "Family Medicine • Same-week appointments",
    background: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
    buttonStyle: "white", textOnDark: true,
    links: ["Book Appointment", "Clinic Location", "Patient Portal", "Health Tips"],
    socials: ["linkedin", "whatsapp", "website", "email"],
  },
  {
    name: "Mona Zahran", username: "mona.photo", category: "Creator",
    initials: "MZ", bio: "Weddings & editorial portraits",
    background: "bg-gradient-to-br from-stone-800 via-stone-700 to-amber-900",
    buttonStyle: "peach", textOnDark: true,
    links: ["Portfolio", "Book a Shoot", "Print Store", "Behind the Scenes"],
    socials: ["instagram", "youtube", "website", "email"],
  },
  {
    name: "Ustadha Hana", username: "hana.tutor", category: "Education",
    initials: "HT", bio: "IELTS, Arabic & English tutoring",
    background: "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600",
    buttonStyle: "white", textOnDark: true,
    links: ["Book a Lesson", "Free Worksheet", "Group Classes", "YouTube Lessons"],
    socials: ["youtube", "instagram", "tiktok", "email"],
  },
  {
    name: "Khalid Majed", username: "khalid.realty", category: "Real Estate",
    initials: "KM", bio: "Residential & investment listings — KSA",
    background: "bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-700",
    buttonStyle: "black", textOnDark: true,
    links: ["View Listings", "Schedule Viewing", "Market Report", "Sell Your Home"],
    socials: ["whatsapp", "linkedin", "instagram", "website"],
  },
  {
    name: "Aisha Rami", username: "aisha.creates", category: "Social Media",
    initials: "AR", bio: "Lifestyle • Travel • Tech reviews",
    background: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400",
    buttonStyle: "white", textOnDark: true,
    links: ["Latest Video", "Brand Collabs", "Amazon Storefront", "Newsletter"],
    socials: ["youtube", "instagram", "tiktok", "x"],
  },
];



const features = [
  { icon: Layers, title: "Link Management", description: "Unlimited links with drag-and-drop reordering and scheduling." },
  { icon: Palette, title: "Deep Customization", description: "Themes, fonts, animated backgrounds, custom CSS." },
  { icon: BarChart3, title: "Real-time Analytics", description: "Views, clicks, geography, devices — all live." },
  { icon: CreditCard, title: "Monetization", description: "Tips, products, payments directly from your bio." },
  { icon: Smartphone, title: "Mobile First", description: "Stunning on every device, lightning fast." },
  { icon: Lock, title: "Privacy & Security", description: "Enterprise-grade. Control what is public." },
];

const plans = [
  {
    name: "Free", price: "SAR 0", description: "Get started in minutes",
    features: ["Unlimited links", "5 base themes", "Tip jar", "28-day analytics"],
    cta: "Start free", popular: false,
  },
  {
    name: "Starter", price: "SAR 19", period: "/mo", description: "For growing creators",
    features: ["Everything in Free", "Custom fonts & BGs", "Spotlight links", "6 months analytics", "Priority Help & Support"],
    cta: "Try Starter", popular: true,
  },
  {
    name: "Pro", price: "SAR 56", period: "/mo", description: "Power users & brands",
    features: ["Everything in Starter", "Remove branding", "Export email list", "GA / Pixel", "Custom CSS", "API access"],
    cta: "Try Pro", popular: false,
  },
];

export default function SmartLinkBio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredTemplates = activeCategory === "All" ? templates : templates.filter(t => t.category === activeCategory);
  const location = useLocation();
  const pricingRef = useRef<HTMLElement | null>(null);

  // Reliable hash-scroll on mobile (Android/iOS sometimes miss native #hash on SPA nav).
  useEffect(() => {
    if (location.hash !== "#pricing") return;
    let tries = 0;
    const tick = () => {
      const el = pricingRef.current ?? document.getElementById("pricing");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        trackEvent("pricing_section_landed", { source: "hash", path: location.pathname });
      } else if (tries++ < 20) {
        setTimeout(tick, 100);
      }
    };
    // Defer past paint/layout (mobile Safari needs this).
    setTimeout(tick, 50);
  }, [location.hash, location.pathname]);

  // Track when the pricing section becomes visible (any source).
  useEffect(() => {
    const el = pricingRef.current ?? document.getElementById("pricing");
    if (!el || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired) {
            fired = true;
            trackEvent("pricing_section_viewed", { path: location.pathname });
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [location.pathname]);


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

        {/* Templates */}
        <section id="templates" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Stunning <span className="gradient-text">templates</span></h2>
              <p className="text-muted-foreground">Pick a starting point. Make it yours in seconds.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "gradient-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.username}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="group rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-glow transition-all p-4 flex gap-4"
                >
                  {/* Mini phone mockup */}
                  <div className="shrink-0 w-[92px]">
                    <div
                      className="relative aspect-[9/19] rounded-[18px] bg-neutral-900 p-[3px] ring-1 ring-white/10 shadow-elevated"
                      style={{ boxShadow: `0 10px 30px -12px ${template.accent}55` }}
                    >
                      <div className="relative w-full h-full rounded-[15px] overflow-hidden bg-neutral-950 flex flex-col items-center pt-3 px-1.5">
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black rounded-full z-10" />
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-neutral-900 ring-1 ring-white/30 mt-1"
                          style={{ backgroundColor: template.accent }}
                        >
                          {template.initials}
                        </div>
                        <div className="text-white text-[6px] font-semibold mt-1 truncate max-w-full">@{template.username}</div>
                        <div className="w-full mt-1 space-y-1">
                          {template.links.slice(0, 2).map((l) => (
                            <div key={l.label} className="w-full h-2.5 rounded bg-white/90" />
                          ))}
                          {template.socials.slice(0, 3).map((s) => (
                            <div key={s.label} className="w-full h-1.5 rounded bg-white/25" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real profile details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{template.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          @{template.username} · {template.location}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: `${template.accent}22`, color: template.accent }}
                      >
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs font-medium mt-1" style={{ color: template.accent }}>
                      {template.profession}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{template.bio}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.socials.map((s) => (
                        <a
                          key={s.label}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-2 py-1 rounded-md bg-secondary hover:bg-secondary/70 text-secondary-foreground transition-colors"
                          title={`${s.label}: ${s.handle}`}
                        >
                          <span className="font-semibold">{s.label}</span>
                          <span className="text-muted-foreground ml-1">{s.handle}</span>
                        </a>
                      ))}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {template.links.map((l) => (
                        <a
                          key={l.label}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
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
