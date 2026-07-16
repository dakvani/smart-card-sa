import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, Zap, Sparkles } from "lucide-react";

const stats = [
  { icon: Users, value: "50K+", label: "Cards shipped" },
  { icon: Star, value: "4.9", label: "Customer rating" },
  { icon: Zap, value: "<1s", label: "Tap to connect" },
];

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a1a] py-16 sm:py-24 lg:py-28 text-white">
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Big CTA panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-[28px] border border-[#4f46e5]/30 bg-gradient-to-br from-[#1e1e5a] via-[#141432] to-[#0a0a1a] p-8 sm:rounded-[36px] sm:p-12 lg:p-16"
          >
            {/* Ambient glows inside */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#4f46e5]/30 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#7c3aed]/20 blur-[120px]" />

            {/* Radial rings */}
            <div className="pointer-events-none absolute right-6 top-6 opacity-40 sm:right-10 sm:top-10">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                <div className="absolute inset-0 rounded-full border border-[#a5b4fc]/40" />
                <div className="absolute inset-3 rounded-full border border-[#a5b4fc]/30" />
                <div className="absolute inset-6 rounded-full border border-[#a5b4fc]/20" />
                <div className="absolute inset-10 rounded-full bg-[#4f46e5] shadow-[0_0_40px_#4f46e5]" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4f46e5]/40 bg-white/5 px-3 py-1 font-body-alt text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c4b5fd] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Ships in 48 hours
              </div>

              <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
                Order your SmartCard.
                <br />
                <span className="bg-gradient-to-r from-[#818cf8] via-[#a78bfa] to-[#c4b5fd] bg-clip-text text-transparent">
                  Tap into tomorrow.
                </span>
              </h2>
              <p className="mt-5 max-w-lg font-body-alt text-base text-white/60 sm:text-lg">
                Free worldwide shipping on orders over $50. Lifetime profile included with every card.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="h-14 w-full rounded-full bg-white px-8 font-body-alt text-base font-bold text-[#0a0a1a] shadow-[0_20px_50px_-15px_rgba(255,255,255,0.4)] transition hover:bg-white/90 sm:w-auto"
                >
                  <Link to="/nfc-products">
                    Shop now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 w-full rounded-full border border-white/15 bg-white/5 px-8 font-body-alt text-base font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto"
                >
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>

              {/* Stats row */}
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-8 sm:mt-14 sm:gap-6 sm:pt-10">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                    className="flex flex-col"
                  >
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f46e5]/20 text-[#a5b4fc] sm:h-10 sm:w-10">
                      <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="font-display text-2xl font-extrabold leading-none text-white sm:text-4xl lg:text-5xl">
                      {s.value}
                    </div>
                    <div className="mt-1 font-body-alt text-[11px] uppercase tracking-[0.15em] text-white/50 sm:text-xs">
                      {s.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
