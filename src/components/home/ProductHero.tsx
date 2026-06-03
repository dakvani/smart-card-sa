import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/smartcard-hero.mp4.asset.json";

export function ProductHero() {
  // Only mount the hero video on larger screens with enough bandwidth.
  // On mobile we render a static gradient — the 4MB autoplay loop + a
  // backdrop-blur overlay on top of it was the main cause of jank.
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const conn = (navigator as any).connection;
    const saveData = !!conn?.saveData;
    const slow = conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShowVideo(mq.matches && !saveData && !slow && !reduceMotion);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Background */}
      <div className="absolute inset-0 z-0 gradient-dark">
        {showVideo && (
          <video
            src={heroVideo.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover opacity-60"
          />
        )}
        {/* Solid overlay instead of backdrop-blur over animated video — blur
            forces full-layer re-rasterization every frame on mobile. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/55 to-background" />
      </div>

      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute top-1/4 left-[5%] w-96 h-96 rounded-full bg-primary/[0.08] blur-[120px]" />
        <div className="absolute bottom-1/3 right-[5%] w-[500px] h-[500px] rounded-full bg-accent/[0.1] blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-8 text-foreground/90"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Tap. Share. Connect — instantly.</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance text-foreground"
          >
            One tap. <span className="gradient-text">Endless connections.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Premium NFC cards, stickers, keychains and tags — beautifully crafted, smartly engineered to share your entire digital identity in a single tap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button asChild size="lg" className="h-14 px-8 text-base gradient-primary shadow-glow group">
              <Link to="/nfc-products">
                Shop SmartCards
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base glass">
              <Link to="/nfc-products#designs">Explore Designs</Link>
            </Button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
          >
            {[
              { icon: Zap, label: "Instant tap", sub: "No app required" },
              { icon: ShieldCheck, label: "Lifetime chip", sub: "Reprogrammable" },
              { icon: Sparkles, label: "Premium build", sub: "Designed to last" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl glass">
                <item.icon className="w-5 h-5 text-primary" />
                <div className="text-sm font-semibold text-foreground/90">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
