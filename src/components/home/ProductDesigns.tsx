import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Palette, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const designs = [
  { name: "Midnight Pro", gradient: "from-slate-900 via-slate-800 to-indigo-900", tag: "Best seller" },
  { name: "Aurora", gradient: "from-violet-500 via-fuchsia-500 to-pink-500", tag: "Creative" },
  { name: "Sunset", gradient: "from-orange-500 via-rose-500 to-pink-600", tag: "Bold" },
  { name: "Emerald", gradient: "from-emerald-500 via-teal-500 to-cyan-600", tag: "Pro" },
  { name: "Mono", gradient: "from-zinc-100 via-zinc-300 to-zinc-500", tag: "Minimal" },
  { name: "Carbon Gold", gradient: "from-stone-900 via-zinc-800 to-amber-700", tag: "Luxury" },
];

export function ProductDesigns() {
  return (
    <section id="designs" className="py-14 sm:py-20 lg:py-24 relative overflow-hidden bg-secondary/10">
      

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-4 text-foreground/80">
            <Palette className="w-3.5 h-3.5 text-primary" /> Designs that match your brand
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Choose a finish. Or <span className="gradient-text">design your own.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start from a curated preset, then customize colors, logo, and layout in our live editor.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto mb-10 sm:mb-12">
          {designs.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -6, rotate: -1 }}
              className="group relative aspect-[1.6/1] rounded-2xl overflow-hidden border border-border/40 shadow-elevated cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${d.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Chip */}
              <div className="absolute top-1/2 right-6 -translate-y-1/2 w-8 h-8 rounded bg-yellow-200/80 border border-yellow-600/40 opacity-80" />

              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-white/95 font-bold text-lg drop-shadow">{d.name}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {d.tag}
                  </span>
                </div>
                <div>
                  <div className="text-white/70 text-xs">SmartCard</div>
                  <div className="text-white font-mono text-sm">@yourname</div>
                </div>
              </div>

              {/* Shine on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button asChild size="lg" variant="outline" className="h-14 px-8 glass">
            <Link to="/nfc-products">
              Customize your card <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
