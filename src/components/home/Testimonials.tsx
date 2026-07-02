import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import avatarDakvan from "@/assets/testimonial-dakvan.jpg";
import avatarSarah from "@/assets/testimonial-sarah.jpg";
import avatarMarcus from "@/assets/testimonial-marcus.jpg";
import avatarPriya from "@/assets/testimonial-priya.jpg";
import avatarAlex from "@/assets/testimonial-alex.jpg";
import avatarJordan from "@/assets/testimonial-jordan.jpg";

const testimonials = [
  {
    name: "Dakvan",
    handle: "@dakvan",
    role: "Digital Creator · 1.8M followers",
    avatar: avatarDakvan,
    quote: "SmartCard completely transformed how I share my content. My link clicks went up 340% in the first month alone.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    handle: "@sarahcreates",
    role: "Content Creator · 2.4M followers",
    avatar: avatarSarah,
    quote: "The analytics alone are worth it. I finally understand what my audience actually clicks on.",
    rating: 5,
  },
  {
    name: "Marcus Williams",
    handle: "@marcusbeats",
    role: "Music Producer · Spotify Verified",
    avatar: avatarMarcus,
    quote: "Finally a link-in-bio that actually looks professional. The NFC cards are a game-changer for networking at events.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    handle: "@priyafitness",
    role: "Fitness Coach · 890K followers",
    avatar: avatarPriya,
    quote: "My clients love how easy it is to find everything in one place. Bookings increased by 60% since switching to SmartCard.",
    rating: 5,
  },
  {
    name: "Alex Rivera",
    handle: "@alexdesigns",
    role: "UX Designer · Freelancer",
    avatar: avatarAlex,
    quote: "The customization options are unreal. My portfolio link page looks better than most actual websites I've designed.",
    rating: 5,
  },
  {
    name: "Jordan Lee",
    handle: "@jordantalks",
    role: "Podcast Host · 500K listeners",
    avatar: avatarJordan,
    quote: "Went from 5 different links in my bio to one SmartCard. Listener engagement doubled overnight. Can't recommend it enough.",
    rating: 5,
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const go = (dir: number) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  const t = testimonials[current];

  return (
    <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container mx-auto px-4 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Loved by <span className="gradient-text">creators everywhere</span>
          </h2>
        </motion.div>

        {/* Main testimonial card */}
        <div className="relative min-h-[280px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 sm:p-10 shadow-lg"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />

              <p className="text-base sm:text-xl text-foreground/90 leading-relaxed mb-6 sm:mb-8 italic">
                "{t.quote}"
              </p>


              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={t.avatar} alt={`${t.name}, ${t.role} — SmartCard customer testimonial portrait`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>

                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => go(-1)}
            className="p-2 rounded-full border border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            className="p-2 rounded-full border border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
