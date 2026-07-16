import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Palette, ArrowRight, Wifi, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const designs = [
  { name: "Midnight Pro", tag: "Best seller", gradient: "from-[#0f172a] via-[#141432] to-[#1e1e5a]", ink: "text-white", chip: "bg-[#c4b5fd]/70" },
  { name: "Aurora", tag: "Creative", gradient: "from-[#4f46e5] via-[#7c3aed] to-[#ec4899]", ink: "text-white", chip: "bg-white/70" },
  { name: "Sunset", tag: "Bold", gradient: "from-[#f97316] via-[#e11d48] to-[#be185d]", ink: "text-white", chip: "bg-amber-100/80" },
  { name: "Emerald", tag: "Pro", gradient: "from-[#065f46] via-[#0d9488] to-[#22d3ee]", ink: "text-white", chip: "bg-white/70" },
  { name: "Mono", tag: "Minimal", gradient: "from-[#f4f4f5] via-[#d4d4d8] to-[#71717a]", ink: "text-black", chip: "bg-black/70" },
  { name: "Carbon Gold", tag: "Luxury", gradient: "from-[#0a0a0a] via-[#27272a] to-[#b45309]", ink: "text-amber-100", chip: "bg-amber-400/80" },
];

export function ProductDesigns() {
  return (
    <section
      id="designs"
      className="relative overflow-hidden bg-[#0a0a1a] py-10 sm:py-24 lg:py-28 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-[#4f46e5]/10 blur-[140px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto mb-6 flex max-w-6xl flex-col items-start gap-4 sm:mb-14 sm:gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.4 }}
            className="max-w-xl"
          >
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#4f46e5]/30 bg-[#4f46e5]/10 px-2.5 py-1 font-body-alt text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a5b4fc] sm:mb-4 sm:gap-2 sm:px-3 sm:text-[11px] sm:tracking-[0.18em]">
              <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Designs that match your brand
            </div>
            <h2 className="font-display text-2xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Choose a finish. Or{" "}
              <span className="bg-gradient-to-r from-[#4f46e5] via-[#6d5ef0] to-[#7c3aed] bg-clip-text text-transparent">
                design your own.
              </span>
            </h2>
            <p className="mt-2 font-body-alt text-[13px] text-white/60 sm:mt-4 sm:text-lg">
              Start from a curated preset, then push colors, logo and layout in the live editor.
            </p>
          </motion.div>

          <Button
            asChild
            className="hidden h-12 rounded-full bg-[#4f46e5] px-6 font-body-alt font-semibold text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.7)] transition hover:bg-[#4338ca] md:inline-flex"
          >
            <Link to="/nfc-products">
              Design your own
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Card grid — 2 cols on mobile (compact), 2 sm, 3 lg */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
          {designs.map((d, i) => (
            <motion.article
              key={d.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -5% 0px" }}
              transition={{ duration: 0.35, delay: Math.min(i, 3) * 0.03 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              {/* Card face */}
              <div
                className={`relative aspect-[1.586/1] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)] sm:rounded-2xl ${d.gradient}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_0%_0%,rgba(255,255,255,0.25),transparent_60%)]" />
                <div className="pointer-events-none absolute -inset-1 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* header */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5 sm:p-5">
                  <span className={`font-display text-[11px] font-bold leading-tight sm:text-lg ${d.ink}`}>{d.name}</span>
                  <span className={`rounded-full border px-1.5 py-0.5 font-body-alt text-[8px] font-semibold uppercase tracking-widest sm:px-2 sm:text-[10px] ${d.ink === "text-black" ? "border-black/20 bg-black/10 text-black/80" : "border-white/25 bg-white/10 text-white/90"} backdrop-blur-sm`}>
                    {d.tag}
                  </span>
                </div>

                {/* NFC + chip */}
                <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 sm:right-5 sm:gap-3">
                  <Wifi className={`h-3 w-3 rotate-90 sm:h-5 sm:w-5 ${d.ink === "text-black" ? "text-black/40" : "text-white/60"}`} />
                  <div className={`h-5 w-6 rounded-[3px] sm:h-9 sm:w-11 sm:rounded-md ${d.chip} shadow-inner`}>
                    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-px p-0.5 sm:p-1">
                      <span className="rounded-[1px] bg-black/20" />
                      <span className="rounded-[1px] bg-black/10" />
                      <span className="rounded-[1px] bg-black/10" />
                      <span className="rounded-[1px] bg-black/20" />
                    </div>
                  </div>
                </div>

                {/* footer */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-5">
                  <div className={`font-body-alt text-[7px] uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.2em] ${d.ink === "text-black" ? "text-black/50" : "text-white/60"}`}>SmartCard</div>
                  <div className={`font-mono text-[10px] sm:text-sm ${d.ink}`}>@yourname</div>
                </div>
              </div>

              {/* meta row */}
              <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5 sm:mt-3 sm:px-1">
                <span className="truncate font-body-alt text-[11px] text-white/80 sm:text-sm">{d.name}</span>
                <span className="shrink-0 font-body-alt text-[9px] text-white/40 sm:text-xs">Preset</span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Custom card CTA — compact tile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -5% 0px" }}
          transition={{ duration: 0.35 }}
          className="mx-auto mt-4 max-w-6xl sm:mt-6"
        >
          <Link
            to="/nfc-products"
            className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-dashed border-[#4f46e5]/40 bg-[#141432]/50 p-3 transition-all hover:border-[#4f46e5] hover:bg-[#1e1e5a]/30 sm:rounded-2xl sm:border-2 sm:p-7"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f46e5]/20 text-[#a5b4fc] transition-transform group-hover:rotate-90 sm:h-11 sm:w-11 sm:rounded-xl">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-bold sm:text-lg">Design your own card</div>
                <div className="font-body-alt text-[11px] text-white/50 sm:text-sm">Colors, logo, layout — live preview.</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-[#a5b4fc] sm:h-5 sm:w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
