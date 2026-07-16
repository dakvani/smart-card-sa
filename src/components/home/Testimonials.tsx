import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import avatarDakvan from "@/assets/testimonial-dakvan.jpg";
import avatarSarah from "@/assets/testimonial-sarah.jpg";
import avatarMarcus from "@/assets/testimonial-marcus.jpg";
import avatarPriya from "@/assets/testimonial-priya.jpg";
import avatarAlex from "@/assets/testimonial-alex.jpg";
import avatarJordan from "@/assets/testimonial-jordan.jpg";

const testimonials = [
  { name: "Dakvan", role: "Digital Creator · 1.8M followers", avatar: avatarDakvan,
    quote: "SmartCard completely transformed how I share my content. My link clicks went up 340% in the first month alone.", rating: 5, size: "lg" },
  { name: "Sarah Chen", role: "Content Creator · 2.4M followers", avatar: avatarSarah,
    quote: "The analytics alone are worth it. I finally understand what my audience actually clicks on.", rating: 5, size: "md" },
  { name: "Marcus Williams", role: "Music Producer · Spotify Verified", avatar: avatarMarcus,
    quote: "Finally a link-in-bio that actually looks professional. The NFC cards are a game-changer at events.", rating: 5, size: "md" },
  { name: "Priya Patel", role: "Fitness Coach · 890K followers", avatar: avatarPriya,
    quote: "My clients love how easy it is to find everything in one place. Bookings up 60% since switching.", rating: 5, size: "sm" },
  { name: "Alex Rivera", role: "UX Designer · Freelancer", avatar: avatarAlex,
    quote: "The customization is unreal. My link page looks better than most sites I've designed.", rating: 5, size: "sm" },
  { name: "Jordan Lee", role: "Podcast Host · 500K listeners", avatar: avatarJordan,
    quote: "Went from 5 links in my bio to one SmartCard. Listener engagement doubled overnight.", rating: 5, size: "md" },
] as const;

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a1a] py-16 sm:py-24 lg:py-28 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-[#4f46e5]/10 blur-[140px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4f46e5]/30 bg-[#4f46e5]/10 px-3 py-1 font-body-alt text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">
            <Star className="h-3.5 w-3.5 fill-[#a5b4fc]" />
            4.9 average · 12k+ reviews
          </div>
          <h2 className="font-display text-3xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Loved by{" "}
            <span className="bg-gradient-to-r from-[#818cf8] via-[#a78bfa] to-[#c4b5fd] bg-clip-text text-transparent">
              creators everywhere
            </span>
          </h2>
        </motion.div>

        {/* Mobile: horizontal snap scroll (engaging swipe) */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-none">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} t={t} i={i} className="w-[85%] shrink-0 snap-center" />
            ))}
          </div>
          <div className="mt-3 text-center font-body-alt text-[11px] uppercase tracking-widest text-white/40">
            ← Swipe to read more →
          </div>
        </div>

        {/* Desktop/tablet: bento masonry */}
        <div className="mx-auto hidden max-w-6xl grid-cols-6 gap-4 sm:grid lg:gap-5">
          <TestimonialCard t={testimonials[0]} i={0} className="col-span-6 lg:col-span-4" featured />
          <TestimonialCard t={testimonials[1]} i={1} className="col-span-3 lg:col-span-2" />
          <TestimonialCard t={testimonials[2]} i={2} className="col-span-3 lg:col-span-2" />
          <TestimonialCard t={testimonials[3]} i={3} className="col-span-3 lg:col-span-2" />
          <TestimonialCard t={testimonials[4]} i={4} className="col-span-6 lg:col-span-4" featured />
          <TestimonialCard t={testimonials[5]} i={5} className="col-span-6 lg:col-span-6" />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  t,
  i,
  className = "",
  featured = false,
}: {
  t: (typeof testimonials)[number];
  i: number;
  className?: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.06 }}
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-colors duration-500 sm:rounded-3xl sm:p-7 ${
        featured
          ? "border-[#4f46e5]/40 bg-gradient-to-br from-[#1e1e5a]/60 via-[#141432] to-[#141432] hover:border-[#4f46e5]/70"
          : "border-white/[0.06] bg-[#141432]/80 hover:border-[#4f46e5]/30"
      } ${className}`}
    >
      <Quote className={`mb-4 h-6 w-6 ${featured ? "text-[#a5b4fc]" : "text-[#4f46e5]/50"}`} />
      <p className={`font-body-alt leading-relaxed text-white/85 ${featured ? "text-lg sm:text-xl" : "text-sm sm:text-base"}`}>
        "{t.quote}"
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-[#4f46e5]/40">
            <AvatarImage src={t.avatar} alt={`${t.name} — ${t.role}`} />
            <AvatarFallback className="bg-[#1e1e5a] text-[#a5b4fc]">
              {t.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display text-sm font-bold text-white">{t.name}</p>
            <p className="font-body-alt text-xs text-white/50">{t.role}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating }).map((_, k) => (
            <Star key={k} className="h-3.5 w-3.5 fill-[#a5b4fc] text-[#a5b4fc]" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
