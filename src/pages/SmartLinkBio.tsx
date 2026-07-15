import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BarChart3, CreditCard, Layers, Lock, Palette, Smartphone, Check, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SEO } from "@/components/SEO";


const categories = ["All", "Business", "Creative", "Music", "Fashion", "Fitness", "Food", "Tech", "Education"];

type SampleProfile = {
  name: string;
  handle: string;
  profession: string;
  category: string;
  initials: string;
  gradient: string;
  accent: string;
  bio: string;
  links: string[];
  socials: string[];
};

const templates: SampleProfile[] = [
  {
    name: "Sara Al-Otaibi", handle: "@sara.designs", profession: "Graphic Designer", category: "Creative",
    initials: "SA", gradient: "from-indigo-900 via-purple-900 to-pink-900", accent: "bg-pink-400",
    bio: "Brand & visual identity", links: ["View Portfolio", "Book a Project", "Shop Prints"], socials: ["IG", "Be", "Dr"],
  },
  {
    name: "Omar Khaled", handle: "@omar.dev", profession: "Software Engineer", category: "Tech",
    initials: "OK", gradient: "from-slate-900 via-slate-800 to-cyan-900", accent: "bg-cyan-400",
    bio: "Full-stack • React • Node", links: ["My GitHub", "Hire Me", "Read My Blog"], socials: ["Gh", "In", "X"],
  },
  {
    name: "Layla Hassan", handle: "@layla.sings", profession: "Musician & Vocalist", category: "Music",
    initials: "LH", gradient: "from-pink-500 via-red-500 to-yellow-500", accent: "bg-yellow-300",
    bio: "New single out now", links: ["Listen on Spotify", "Watch on YouTube", "Book a Show"], socials: ["Sp", "Yt", "IG"],
  },
  {
    name: "Faisal Aziz", handle: "@faisal.fit", profession: "Personal Trainer", category: "Fitness",
    initials: "FA", gradient: "from-orange-500 via-rose-500 to-red-600", accent: "bg-orange-300",
    bio: "Coach • Nutrition • Habits", links: ["Join 8-Week Program", "Book 1:1 Session", "Free Meal Plan"], socials: ["IG", "Yt", "Tk"],
  },
  {
    name: "Noura Salem", handle: "@noura.style", profession: "Fashion Stylist", category: "Fashion",
    initials: "NS", gradient: "from-rose-400 via-pink-400 to-fuchsia-500", accent: "bg-white",
    bio: "Editorial & personal styling", links: ["Shop My Looks", "Book Styling", "Lookbook 2026"], socials: ["IG", "Pn", "Tk"],
  },
  {
    name: "Yousef Rahman", handle: "@chef.yousef", profession: "Chef & Food Creator", category: "Food",
    initials: "YR", gradient: "from-amber-700 via-orange-600 to-red-700", accent: "bg-amber-300",
    bio: "Modern Middle Eastern", links: ["Reserve a Table", "Order Catering", "My Cookbook"], socials: ["IG", "Yt", "Tk"],
  },
  {
    name: "Reem Al-Fahad", handle: "@reem.consults", profession: "Business Consultant", category: "Business",
    initials: "RA", gradient: "from-slate-800 via-blue-900 to-indigo-900", accent: "bg-blue-300",
    bio: "Strategy for founders", links: ["Book a Call", "Case Studies", "Newsletter"], socials: ["In", "X", "Ml"],
  },
  {
    name: "Dr. Ahmed Nasser", handle: "@dr.ahmed", profession: "Physician", category: "Business",
    initials: "AN", gradient: "from-teal-700 via-emerald-700 to-slate-900", accent: "bg-emerald-300",
    bio: "Family Medicine • Clinic", links: ["Book Appointment", "Clinic Location", "Health Blog"], socials: ["In", "Wa", "Ml"],
  },
  {
    name: "Mona Zahran", handle: "@mona.photo", profession: "Photographer", category: "Creative",
    initials: "MZ", gradient: "from-neutral-900 via-neutral-800 to-stone-900", accent: "bg-amber-200",
    bio: "Weddings & portraits", links: ["Portfolio", "Book a Shoot", "Client Gallery"], socials: ["IG", "Vs", "Pn"],
  },
  {
    name: "Ustadha Hana", handle: "@hana.tutor", profession: "Online Tutor", category: "Education",
    initials: "HT", gradient: "from-sky-600 via-indigo-600 to-violet-700", accent: "bg-sky-200",
    bio: "IELTS • Arabic • English", links: ["Book a Lesson", "Free Worksheet", "Group Classes"], socials: ["Yt", "IG", "Ml"],
  },
  {
    name: "Khalid Majed", handle: "@khalid.realestate", profession: "Real Estate Agent", category: "Business",
    initials: "KM", gradient: "from-stone-800 via-amber-800 to-yellow-700", accent: "bg-yellow-200",
    bio: "Riyadh • Jeddah listings", links: ["View Listings", "Schedule Viewing", "Sell Your Home"], socials: ["Wa", "In", "IG"],
  },
  {
    name: "Aisha Rami", handle: "@aisha.creates", profession: "Content Creator", category: "Creative",
    initials: "AR", gradient: "from-fuchsia-600 via-purple-600 to-indigo-700", accent: "bg-fuchsia-300",
    bio: "Lifestyle • Travel • Tech", links: ["Latest Video", "Brand Collabs", "Amazon Storefront"], socials: ["Yt", "IG", "Tk"],
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.handle}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[9/19] rounded-[36px] bg-neutral-900 p-[6px] shadow-elevated group-hover:shadow-glow transition-all duration-300 group-hover:-translate-y-2 ring-1 ring-white/10">
                    <div className={`relative w-full h-full rounded-[30px] bg-gradient-to-b ${template.gradient} overflow-hidden`}>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-full z-10" />
                      <div className="pt-8 px-3 flex flex-col items-center text-center h-full">
                        <div className={`w-12 h-12 rounded-full ${template.accent} flex items-center justify-center text-[10px] font-bold text-neutral-900 ring-2 ring-white/40 mb-1.5`}>
                          {template.initials}
                        </div>
                        <div className="text-white text-[9px] font-semibold leading-tight truncate max-w-full">
                          {template.name}
                        </div>
                        <div className="text-white/70 text-[7px] leading-tight truncate max-w-full">
                          {template.handle}
                        </div>
                        <div className="text-white/85 text-[7px] mt-1 leading-tight px-1 line-clamp-2">
                          {template.bio}
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {template.socials.map((s) => (
                            <div key={s} className="w-4 h-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-[6px] font-bold text-white">
                              {s}
                            </div>
                          ))}
                        </div>
                        <div className="w-full mt-2 space-y-1.5 px-0.5">
                          {template.links.map((label) => (
                            <div
                              key={label}
                              className="w-full h-6 rounded-lg bg-white/95 text-neutral-900 text-[7px] font-semibold flex items-center justify-center shadow-sm"
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto mb-2 text-[6px] text-white/50 tracking-wider">
                          SMARTCARD
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">{template.profession}</p>
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
