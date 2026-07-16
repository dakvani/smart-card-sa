import { motion } from "framer-motion";
import { Zap, Recycle, Globe, BarChart3, Smartphone, Infinity as InfinityIcon, ArrowUpRight } from "lucide-react";

/**
 * Midnight Indigo bento — mobile-first.
 * Tile sizes vary intentionally: a hero tile, a stat tile, a wide row, plus
 * three focused tiles. Mobile keeps rhythm through 2-col mosaic + one wide.
 */
export function ProductBenefits() {
  return (
    <section
      id="story-next"
      className="relative overflow-hidden py-16 sm:py-24 lg:py-28 bg-[#0a0a1a] text-white"
    >
      {/* Seamless blend from previous (ScrollStory) section — no visible seam */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent"
      />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-[#4f46e5]/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#1e1e5a]/40 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4f46e5]/30 bg-[#4f46e5]/10 px-3 py-1 font-body-alt text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5] shadow-[0_0_12px_#4f46e5]" />
            The SmartCard difference
          </div>
          <h2 className="font-display text-3xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Why thousands switched to{" "}
            <span className="bg-gradient-to-r from-[#4f46e5] via-[#6d5ef0] to-[#7c3aed] bg-clip-text text-transparent">
              SmartCard
            </span>
          </h2>
          <p className="mt-4 font-body-alt text-base text-white/60 sm:text-lg">
            More than a business card. Every SmartCard is a piece of hardware doing real work for your brand.
          </p>
        </motion.div>

        {/* Bento grid — mobile first, 6-col on md, 12-col on lg */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Hero tile — Instant tap */}
          <BentoTile
            className="col-span-2 sm:col-span-6 lg:col-span-7 lg:row-span-2 min-h-[260px] sm:min-h-[300px] lg:min-h-[380px]"
            delay={0}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <IconBadge>
                  <Zap className="h-5 w-5" />
                </IconBadge>
                <ArrowUpRight className="h-5 w-5 text-white/30 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#a5b4fc]" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                  Tap. Share.<br />
                  <span className="text-[#a5b4fc]">In under a second.</span>
                </h3>
                <p className="mt-3 max-w-md font-body-alt text-sm text-white/60 sm:text-base">
                  Your card, sticker or keychain shares everything with one physical tap — no app, no scanning apps, no friction.
                </p>
              </div>
            </div>
            {/* Radiating tap pulse */}
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64">
              <div className="absolute inset-0 animate-ping rounded-full border border-[#4f46e5]/30" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-6 rounded-full border border-[#4f46e5]/40" />
              <div className="absolute inset-14 rounded-full bg-[#4f46e5]/20 blur-2xl" />
            </div>
          </BentoTile>

          {/* Stat tile */}
          <BentoTile
            className="col-span-2 sm:col-span-3 lg:col-span-5 min-h-[160px] sm:min-h-[180px]"
            variant="accent"
            delay={0.05}
          >
            <div className="flex h-full flex-col justify-between">
              <span className="font-body-alt text-xs uppercase tracking-[0.2em] text-white/70">Track every tap</span>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-extrabold text-white sm:text-6xl">340<span className="text-[#c4b5fd]">%</span></span>
                </div>
                <p className="mt-1 font-body-alt text-sm text-white/70">Average link-click lift in the first month</p>
              </div>
            </div>
          </BentoTile>

          {/* Update anytime */}
          <BentoTile
            className="col-span-1 sm:col-span-3 lg:col-span-5 min-h-[160px] sm:min-h-[180px]"
            delay={0.1}
          >
            <IconBadge><Recycle className="h-5 w-5" /></IconBadge>
            <h3 className="mt-4 font-display text-lg font-bold sm:text-xl">Update anytime, free</h3>
            <p className="mt-1 font-body-alt text-xs text-white/55 sm:text-sm">Change your profile, links or offers whenever. Your card never expires.</p>
          </BentoTile>

          {/* Works on any phone */}
          <BentoTile
            className="col-span-1 sm:col-span-3 lg:col-span-3 min-h-[160px] sm:min-h-[180px]"
            delay={0.15}
          >
            <IconBadge><Globe className="h-5 w-5" /></IconBadge>
            <h3 className="mt-4 font-display text-lg font-bold sm:text-xl">Any phone</h3>
            <p className="mt-1 font-body-alt text-xs text-white/55 sm:text-sm">Works natively on modern iPhone &amp; Android.</p>
          </BentoTile>

          {/* Analytics wide */}
          <BentoTile
            className="col-span-2 sm:col-span-6 lg:col-span-6 min-h-[180px]"
            delay={0.2}
          >
            <div className="flex h-full items-center justify-between gap-6">
              <div>
                <IconBadge><BarChart3 className="h-5 w-5" /></IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold sm:text-xl">Real ROI on every handshake</h3>
                <p className="mt-1 font-body-alt text-xs text-white/55 sm:text-sm">See who tapped, what they clicked, and when.</p>
              </div>
              {/* Mini bar chart */}
              <div className="hidden shrink-0 items-end gap-1.5 sm:flex">
                {[38, 62, 44, 78, 55, 90, 72].map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.06 }}
                    className={`w-2 rounded-sm ${i === 5 ? "bg-[#4f46e5]" : "bg-[#4f46e5]/30"}`}
                    style={{ minHeight: 8 }}
                  />
                ))}
              </div>
            </div>
          </BentoTile>

          {/* QR backup */}
          <BentoTile className="col-span-1 sm:col-span-3 lg:col-span-3 min-h-[160px]" delay={0.25}>
            <IconBadge><Smartphone className="h-5 w-5" /></IconBadge>
            <h3 className="mt-4 font-display text-lg font-bold sm:text-xl">QR backup built in</h3>
            <p className="mt-1 font-body-alt text-xs text-white/55 sm:text-sm">Non-NFC devices connect instantly too.</p>
          </BentoTile>

          {/* Built to last */}
          <BentoTile className="col-span-1 sm:col-span-3 lg:col-span-3 min-h-[160px]" delay={0.3}>
            <IconBadge><InfinityIcon className="h-5 w-5" /></IconBadge>
            <h3 className="mt-4 font-display text-lg font-bold sm:text-xl">Built to last</h3>
            <p className="mt-1 font-body-alt text-xs text-white/55 sm:text-sm">Premium PVC, metal &amp; silicone. Lifetime chip.</p>
          </BentoTile>
        </div>
      </div>
    </section>
  );
}

function BentoTile({
  children,
  className = "",
  variant = "default",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -3 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-6 lg:p-7 transition-colors duration-500 ${
        variant === "accent"
          ? "border-[#4f46e5]/40 bg-gradient-to-br from-[#1e1e5a] via-[#1e1e5a]/70 to-[#141432] hover:border-[#4f46e5]/70"
          : "border-white/[0.06] bg-[#141432]/80 hover:border-[#4f46e5]/40"
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#4f46e5]/30 bg-[#4f46e5]/15 text-[#a5b4fc] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
      {children}
    </div>
  );
}
