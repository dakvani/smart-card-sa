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

type ButtonShape = "pill" | "square" | "torn" | "outline" | "shadow-hard";
type FontFamily = "sans" | "serif" | "mono" | "display";

type SampleProfile = {
  name: string;
  username: string;
  category: string;
  bio: string;
  // Visual identity
  bgImage: string;              // full-bleed cover photo
  bgTint?: string;              // optional overlay tint (tailwind)
  avatarImage: string;          // circular avatar
  font: FontFamily;
  nameColor: string;            // tailwind text color
  bioColor: string;
  // Buttons
  buttonShape: ButtonShape;
  buttonBg: string;             // full tailwind classes for button bg + text
  // Social icon color
  socialColor: string;
  links: string[];
  socials: SocialIcon[];
};

// Use Unsplash source photos so each template has a real, distinctive look.
const templates: SampleProfile[] = [
  {
    name: "Matthew Hugh", username: "matthew.skates", category: "Social Media",
    bio: "Aspiring skater with a taste for cooking.",
    bgImage: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=70",
    font: "serif", nameColor: "text-white", bioColor: "text-white/90",
    buttonShape: "torn", buttonBg: "bg-orange-200/95 text-neutral-900",
    socialColor: "text-white",
    links: ["Youtube Channel", "Tiktok Account", "Instagram"],
    socials: ["tiktok", "youtube", "x", "instagram"],
  },
  {
    name: "Timothy Teodor", username: "timothy.teo", category: "Music",
    bio: "Online most people know me as Teodor, so that's what I prefer to go by. I'm the best at everything.",
    bgImage: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=70",
    font: "mono", nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "pill", buttonBg: "bg-orange-500 text-white",
    socialColor: "text-white",
    links: ["Twitch Account", "Merch Store", "Contact"],
    socials: ["tiktok", "youtube", "x", "instagram"],
  },
  {
    name: "Gabrielle Lacey", username: "gabby.hoops", category: "Health & Fitness",
    bio: "Basketball today, tomorrow and forever.",
    bgImage: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=70",
    font: "sans", nameColor: "text-white", bioColor: "text-white/90",
    buttonShape: "pill", buttonBg: "bg-white text-neutral-900",
    socialColor: "text-white",
    links: ["Favourite Courts", "Donate to our team", "Team store"],
    socials: ["tiktok", "youtube", "x", "instagram"],
  },
  {
    name: "Sara Al-Otaibi", username: "sara.designs", category: "Creator",
    bio: "Brand & visual identity designer — Riyadh",
    bgImage: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=70",
    font: "display", nameColor: "text-neutral-900", bioColor: "text-neutral-800/80",
    buttonShape: "shadow-hard", buttonBg: "bg-white text-neutral-900 border-2 border-neutral-900",
    socialColor: "text-neutral-900",
    links: ["Portfolio", "Book a Project", "Case Studies", "Shop Prints"],
    socials: ["instagram", "youtube", "x", "website"],
  },
  {
    name: "Omar Khaled", username: "omar.dev", category: "Tech",
    bio: "Full-stack engineer • React, Node, Postgres",
    bgImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=70",
    font: "mono", nameColor: "text-emerald-300", bioColor: "text-emerald-100/80",
    buttonShape: "outline", buttonBg: "bg-transparent text-emerald-200 border border-emerald-300/60",
    socialColor: "text-emerald-200",
    links: ["GitHub", "Hire Me", "Open Source", "Read Blog"],
    socials: ["github", "linkedin", "x", "website"],
  },
  {
    name: "Layla Hassan", username: "layla.sings", category: "Music",
    bio: "Indie pop • New single 'Golden Hour' out now",
    bgImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=70",
    font: "display", nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "pill", buttonBg: "bg-fuchsia-500 text-white",
    socialColor: "text-white",
    links: ["Listen on Spotify", "New Music Video", "Tour Tickets", "Merch Store"],
    socials: ["spotify", "youtube", "instagram", "tiktok"],
  },
  {
    name: "Faisal Aziz", username: "faisal.fit", category: "Health & Fitness",
    bio: "Certified coach • Strength & nutrition",
    bgImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&q=70",
    font: "sans", nameColor: "text-white", bioColor: "text-white/90",
    buttonShape: "square", buttonBg: "bg-neutral-900 text-white",
    socialColor: "text-white",
    links: ["8-Week Program", "Book 1:1 Session", "Free Workout PDF", "Supplements"],
    socials: ["instagram", "youtube", "tiktok", "whatsapp"],
  },
  {
    name: "Noura Salem", username: "noura.style", category: "Fashion",
    bio: "Editorial & personal styling — Dubai",
    bgImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=70",
    font: "serif", nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "outline", buttonBg: "bg-transparent text-white border border-white/70",
    socialColor: "text-white",
    links: ["Shop My Looks", "Lookbook 2026", "Book Styling", "Newsletter"],
    socials: ["instagram", "tiktok", "youtube", "website"],
  },
  {
    name: "Yousef Rahman", username: "chef.yousef", category: "Food",
    bio: "Modern Middle Eastern kitchen",
    bgImage: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&q=70",
    font: "serif", nameColor: "text-amber-50", bioColor: "text-amber-50/80",
    buttonShape: "torn", buttonBg: "bg-amber-100 text-neutral-900",
    socialColor: "text-amber-50",
    links: ["Reserve a Table", "Order Catering", "Recipe Book", "Cooking Classes"],
    socials: ["instagram", "youtube", "tiktok", "website"],
  },
  {
    name: "Reem Al-Fahad", username: "reem.consults", category: "Business",
    bio: "GTM strategy for early-stage founders",
    bgImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=70",
    font: "sans", nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "square", buttonBg: "bg-white text-neutral-900",
    socialColor: "text-white",
    links: ["Book a Call", "Case Studies", "Newsletter", "Podcast"],
    socials: ["linkedin", "x", "youtube", "email"],
  },
  {
    name: "Ustadha Hana", username: "hana.tutor", category: "Education",
    bio: "IELTS, Arabic & English tutoring",
    bgImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=70",
    font: "serif", nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "pill", buttonBg: "bg-white text-neutral-900",
    socialColor: "text-white",
    links: ["Book a Lesson", "Free Worksheet", "Group Classes", "YouTube Lessons"],
    socials: ["youtube", "instagram", "tiktok", "email"],
  },
  {
    name: "Khalid Majed", username: "khalid.realty", category: "Real Estate",
    bio: "Residential & investment listings — KSA",
    bgImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=70",
    font: "sans", nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "shadow-hard", buttonBg: "bg-amber-400 text-neutral-900 border-2 border-neutral-900",
    socialColor: "text-white",
    links: ["View Listings", "Schedule Viewing", "Market Report", "Sell Your Home"],
    socials: ["whatsapp", "linkedin", "instagram", "website"],
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
  const [activeCategory, setActiveCategory] = useState("All templates");
  const filteredTemplates = activeCategory === "All templates" ? templates : templates.filter(t => t.category === activeCategory);
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

        {/* Templates — Linktree-style: sidebar + full phone mockups */}
        <section id="templates" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                A SmartLink template to suit <span className="gradient-text">every brand and creator</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Different link styles, integrations and visuals help you build a bio that looks and feels like you.
                Explore our template library and start growing today.
              </p>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] gap-10">
              {/* Sidebar */}
              <aside className="lg:sticky lg:top-28 self-start">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-4">
                  BROWSE BY CATEGORY
                </p>
                <div className="flex lg:flex-col flex-wrap gap-2">
                  {categories.map((cat) => (
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

              {/* Phone grid */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredTemplates.map((template, index) => {
                  const shapeClass =
                    template.buttonShape === "pill"
                      ? "rounded-full"
                      : template.buttonShape === "square"
                        ? "rounded-none"
                        : template.buttonShape === "outline"
                          ? "rounded-full"
                          : template.buttonShape === "shadow-hard"
                            ? "rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]"
                            : "rounded-2xl [clip-path:polygon(2%_10%,98%_4%,100%_88%,4%_96%)]"; // torn
                  const fontClass =
                    template.font === "serif"
                      ? "font-serif tracking-tight"
                      : template.font === "mono"
                        ? "font-mono tracking-tighter"
                        : template.font === "display"
                          ? "font-black uppercase tracking-wide"
                          : "font-semibold";

                  return (
                    <motion.div
                      key={template.username}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.04 }}
                      className="group"
                    >
                      <div className="relative rounded-[36px] overflow-hidden aspect-[9/17] shadow-elevated ring-1 ring-black/10 group-hover:shadow-glow group-hover:-translate-y-1 transition-all duration-300">
                        {/* Cover photo */}
                        <img
                          src={template.bgImage}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {template.bgTint && <div className={`absolute inset-0 ${template.bgTint}`} />}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/40" />

                        <div className="relative h-full flex flex-col items-center px-5 pt-8 pb-6">
                          {/* Avatar */}
                          <img
                            src={template.avatarImage}
                            alt={template.name}
                            loading="lazy"
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-white/70 shadow-lg"
                          />

                          {/* Name / bio */}
                          <h3 className={`mt-3 text-lg text-center ${fontClass} ${template.nameColor}`}>
                            {template.name}
                          </h3>
                          <p className={`text-[11px] text-center leading-snug mt-1 line-clamp-3 max-w-[85%] ${template.bioColor}`}>
                            {template.bio}
                          </p>

                          {/* Link buttons */}
                          <div className="w-full mt-5 space-y-2.5">
                            {template.links.map((label) => (
                              <div
                                key={label}
                                className={`w-full text-center text-[11px] font-semibold py-3 ${shapeClass} ${template.buttonBg}`}
                              >
                                {label}
                              </div>
                            ))}
                          </div>

                          {/* Socials */}
                          <div className="mt-auto pt-4 flex items-center gap-4">
                            {template.socials.map((s) => {
                              const Icon = iconMap[s];
                              return <Icon key={s} className={`w-4 h-4 ${template.socialColor}`} />;
                            })}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 font-semibold text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">@{template.username} · {template.category}</p>
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
