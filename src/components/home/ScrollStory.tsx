import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion, MotionValue } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SCROLL_STORY_CONFIG, stageFadeStops, smoothScrollTo } from "./scrollStoryConfig";

/**
 * ScrollStory — scroll-scrubbed hero that walks the visitor through the
 * 4 stages of how a SmartLink NFC card works:
 *   1. Manufacturing — blank chip + antenna
 *   2. Profile created — data → cloud → URL
 *   3. Programming the chip — phone writes NDEF to card
 *   4. The tap — receiver's phone opens the live profile
 *
 * Single tall section, sticky inner stage, framer-motion scroll values.
 * Reverses cleanly on scroll-up. Reduced-motion users get a static summary.
 */

const STAGES = SCROLL_STORY_CONFIG.stages;
const STAGE_LABELS = [
  "01 · Manufactured",
  "02 · Profile created",
  "03 · Chip programmed",
  "04 · Tap to share",
];
const STAGE_TITLES = [
  "A blank chip, waiting.",
  "Your identity, encoded.",
  "Beamed into the card.",
  "One tap. They see you.",
];
const STAGE_COPY = [
  "An NTAG21x microchip wired to a copper antenna coil. No battery. No app. Just a hard-coded UID and an empty EEPROM ready for your story.",
  "You build your profile on smartlink.sa — links, socials, contact, portfolio. Our backend compiles it into a single signed URL: smartlink.sa/you.",
  "We encode that URL as an NDEF URI record (TNF 0x01, RTD 'U', prefix 0x04 for https://) and write it to the chip over magnetic induction.",
  "A receiver taps. Their phone powers the chip at 13.56 MHz, reads the NDEF, and the OS opens your live profile — instantly.",
];

// --- Stage 1: Card with antenna / chip x-ray ---------------------------------
function StageCard({ progress }: { progress: MotionValue<number> }) {
  // 0 → 1 progress within this stage
  const dash = useTransform(progress, [0, 1], [800, 0]);
  const chipScale = useTransform(progress, [0.4, 1], [0.6, 1]);
  const chipOpacity = useTransform(progress, [0.3, 0.7], [0, 1]);
  const glow = useTransform(progress, [0, 1], [0.1, 0.45]);

  return (
    <div className="relative w-full max-w-[460px] aspect-[1.6/1]">
      <motion.div
        className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-2xl"
        style={{ opacity: glow }}
      />
      <div className="relative w-full h-full rounded-[28px] border border-primary/30 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        <svg viewBox="0 0 460 288" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="wire" x1="0" x2="1">
              <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="1" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Antenna coil */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.rect
              key={i}
              x={20 + i * 8}
              y={20 + i * 8}
              width={420 - i * 16}
              height={248 - i * 16}
              rx={24 - i * 2}
              fill="none"
              stroke="url(#wire)"
              strokeWidth="1.2"
              strokeDasharray="800"
              style={{ strokeDashoffset: dash }}
            />
          ))}
          {/* Trace to chip */}
          <motion.path
            d="M 60 60 L 120 60 L 120 120 L 180 120"
            stroke="url(#wire)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="200"
            style={{ strokeDashoffset: useTransform(progress, [0.2, 0.8], [200, 0]) }}
          />
          {/* Chip */}
          <motion.g style={{ scale: chipScale, opacity: chipOpacity, transformOrigin: "230px 144px" }}>
            <rect x="180" y="110" width="100" height="68" rx="6" fill="hsl(var(--primary))" fillOpacity="0.15" stroke="hsl(var(--primary))" strokeWidth="1" />
            <rect x="200" y="128" width="60" height="32" rx="3" fill="hsl(var(--primary))" fillOpacity="0.4" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <line x1={180} y1={120 + i * 14} x2={170} y2={120 + i * 14} stroke="hsl(var(--accent))" strokeWidth="1" />
                <line x1={280} y1={120 + i * 14} x2={290} y2={120 + i * 14} stroke="hsl(var(--accent))" strokeWidth="1" />
              </g>
            ))}
          </motion.g>
        </svg>
        <div className="absolute bottom-4 left-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono">
          NTAG · 13.56 MHz · UID 04:A2:B1:…
        </div>
      </div>
    </div>
  );
}

// --- Stage 2: Profile → cloud → URL -----------------------------------------
function StageProfile({ progress }: { progress: MotionValue<number> }) {
  const phoneY = useTransform(progress, [0, 1], [40, -20]);
  const urlOpacity = useTransform(progress, [0.55, 0.85], [0, 1]);
  const cloudScale = useTransform(progress, [0.2, 0.7], [0.7, 1]);
  const packetT = useTransform(progress, [0.15, 0.65], [0, 1]);

  return (
    <div className="relative w-full max-w-[420px] flex flex-col items-center gap-6">
      {/* Cloud */}
      <motion.div
        style={{ scale: cloudScale }}
        className="relative w-40 h-20 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 border border-primary/30 backdrop-blur-xl flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full blur-2xl bg-primary/20" />
        <span className="relative text-xs font-mono text-foreground/80">smartlink.sa / api</span>
      </motion.div>

      {/* Data packets */}
      <div className="relative h-16 w-full">
        {[0, 1, 2, 3].map((i) => (
          <Packet key={i} packetT={packetT} index={i} />
        ))}
      </div>


      {/* Phone */}
      <motion.div style={{ y: phoneY }} className="relative w-[200px] aspect-[9/19] rounded-[28px] border border-border bg-card/70 backdrop-blur-xl shadow-2xl p-3">
        <div className="w-full h-full rounded-[20px] bg-gradient-to-b from-primary/15 via-background to-accent/10 p-3 flex flex-col gap-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/30 mt-2" />
          <div className="h-2 w-3/4 mx-auto bg-foreground/30 rounded" />
          <div className="h-1.5 w-1/2 mx-auto bg-foreground/15 rounded" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 w-full bg-foreground/10 rounded-md" />
          ))}
        </div>
      </motion.div>

      {/* URL pill */}
      <motion.div
        style={{ opacity: urlOpacity }}
        className="px-4 py-2 rounded-full font-mono text-sm bg-primary/15 border border-primary/40 text-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
      >
        https://smartlink.sa/<span className="font-bold">dakvan</span>
      </motion.div>
    </div>
  );
}

// --- Stage 3: Phone writes NDEF to card -------------------------------------
function StageProgram({ progress }: { progress: MotionValue<number> }) {
  const phoneX = useTransform(progress, [0, 1], [-40, 40]);
  const cardX = useTransform(progress, [0, 1], [40, -40]);
  const ringScale = useTransform(progress, [0, 1], [0.4, 1.8]);
  const ringOpacity = useTransform(progress, [0, 0.4, 1], [0, 0.7, 0]);

  return (
    <div className="relative w-full max-w-[560px] h-[260px] flex items-center justify-center">
      {/* Phone */}
      <motion.div style={{ x: phoneX }} className="relative w-[120px] aspect-[9/19] rounded-[20px] border border-border bg-card/70 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-2 rounded-[14px] bg-gradient-to-b from-primary/30 to-accent/20" />
      </motion.div>

      {/* Pulses */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <Ring key={i} ringScale={ringScale} ringOpacity={ringOpacity} index={i} />
        ))}
        {/* Binary stream */}
        <motion.div
          className="absolute font-mono text-[10px] text-primary/80 tracking-widest"
          style={{ opacity: useTransform(progress, [0.2, 0.7, 1], [0, 1, 0.4]) }}
        >
          01101000 01110100 01110100 01110000 01110011
        </motion.div>
      </div>


      {/* Card */}
      <motion.div style={{ x: cardX }} className="relative w-[180px] aspect-[1.6/1] rounded-2xl border border-primary/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute bottom-2 left-2 text-[9px] font-mono text-primary/80">NDEF · URI · 0x04</div>
      </motion.div>
    </div>
  );
}

// --- Stage 4: Tap → profile opens -------------------------------------------
function StageTap({ progress }: { progress: MotionValue<number> }) {
  const flash = useTransform(progress, [0.3, 0.45, 0.6], [0, 1, 0]);
  const lockOpacity = useTransform(progress, [0, 0.5], [1, 0]);
  const profileOpacity = useTransform(progress, [0.5, 0.8], [0, 1]);
  const profileY = useTransform(progress, [0.5, 1], [20, 0]);

  return (
    <div className="relative w-full max-w-[420px] flex items-center justify-center gap-6">
      {/* Card */}
      <div className="w-[140px] aspect-[1.6/1] rounded-xl border border-primary/40 bg-card/60 backdrop-blur-xl shadow-xl rotate-[-8deg]">
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
      </div>

      {/* Phone */}
      <div className="relative w-[180px] aspect-[9/19] rounded-[26px] border border-border bg-card/80 backdrop-blur-xl shadow-2xl p-2 overflow-hidden">
        {/* Lock screen */}
        <motion.div style={{ opacity: lockOpacity }} className="absolute inset-2 rounded-[20px] bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center gap-2">
          <div className="text-[10px] text-white/60 font-mono">9:41</div>
          <div className="text-xs text-white/80">Tap detected</div>
        </motion.div>
        {/* Flash */}
        <motion.div style={{ opacity: flash }} className="absolute inset-0 bg-white" />
        {/* Profile */}
        <motion.div style={{ opacity: profileOpacity, y: profileY }} className="absolute inset-2 rounded-[20px] bg-gradient-to-b from-primary/30 via-background to-accent/20 p-3 flex flex-col gap-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/50 mt-2" />
          <div className="h-2 w-2/3 mx-auto bg-foreground/40 rounded" />
          <div className="h-1.5 w-1/2 mx-auto bg-foreground/20 rounded" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-full bg-foreground/15 rounded-md" />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// --- Stable child components (avoid useTransform inside .map) ---------------
function Packet({ packetT, index }: { packetT: MotionValue<number>; index: number }) {
  const y = useTransform(packetT, [0, 1], [0, -90]);
  const o = useTransform(packetT, [0, 0.2 + index * 0.1, 0.9], [0, 1, 0]);
  return (
    <motion.div
      style={{ y, opacity: o, left: `${20 + index * 20}%` }}
      className="absolute top-4 w-2 h-2 rounded-sm bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
    />
  );
}

function Ring({
  ringScale,
  ringOpacity,
  index,
}: {
  ringScale: MotionValue<number>;
  ringOpacity: MotionValue<number>;
  index: number;
}) {
  const scale = useTransform(ringScale, (v) => v + index * 0.3);
  return (
    <motion.div
      style={{ scale, opacity: ringOpacity }}
      className="absolute w-32 h-32 rounded-full border border-primary/50"
    />
  );
}

function StageDot({ index, globalProgress }: { index: number; globalProgress: MotionValue<number> }) {
  const start = index / STAGES;
  const end = (index + 1) / STAGES;
  const w = useTransform(globalProgress, [start, Math.min(end - 0.01, 1)], [8, 32]);
  const o = useTransform(
    globalProgress,
    [Math.max(start - 0.05, 0), start, end, Math.min(end + 0.05, 1)],
    [0.3, 1, 1, 0.3],
  );
  return <motion.div style={{ width: w, opacity: o }} className="h-1.5 rounded-full bg-primary" />;
}


// (clampStops moved into scrollStoryConfig as stageFadeStops)

function StageSlot({
  index,
  globalProgress,
  children,
}: {
  index: number;
  globalProgress: MotionValue<number>;
  children: (stageProgress: MotionValue<number>) => React.ReactNode;
}) {
  const stops = stageFadeStops(index);
  const start = index / STAGES;
  const end = (index + 1) / STAGES;
  const opacity = useTransform(globalProgress, stops, [0, 1, 1, 0]);
  const stageProgress = useTransform(globalProgress, [start, end], [0, 1], { clamp: true });
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {children(stageProgress)}
    </motion.div>
  );
}

function StageCopy({
  index,
  globalProgress,
}: {
  index: number;
  globalProgress: MotionValue<number>;
}) {
  const start = index / STAGES;
  const end = (index + 1) / STAGES;
  const stops = clampStops([start - 0.04, start + 0.02, end - 0.02, end + 0.04]);
  const opacity = useTransform(globalProgress, stops, [0, 1, 1, 0]);
  const y = useTransform(globalProgress, stops, [24, 0, 0, -24]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-primary mb-4">
        <span className="w-8 h-px bg-primary" />
        {STAGE_LABELS[index]}
      </div>
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
        {STAGE_TITLES[index]}
      </h2>
      <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
        {STAGE_COPY[index]}
      </p>
    </motion.div>
  );
}

export function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Spring-smoothed scroll progress — keeps scrub responsive but stable at any speed.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.35,
    restDelta: 0.0005,
  });

  // Top scroll progress bar
  const barScale = useTransform(smoothProgress, [0, 1], [0, 1]);

  // Parallax ambient orbs — opposite directions, slow, no rotation (less distracting)
  const orbAY = useTransform(smoothProgress, [0, 1], [0, -160]);
  const orbAX = useTransform(smoothProgress, [0, 1], [0, 40]);
  const orbBY = useTransform(smoothProgress, [0, 1], [0, 140]);
  const orbBX = useTransform(smoothProgress, [0, 1], [0, -40]);
  const orbAOpacity = useTransform(smoothProgress, [0, 0.5, 1], [0.55, 0.7, 0.4]);
  const orbBOpacity = useTransform(smoothProgress, [0, 0.5, 1], [0.4, 0.7, 0.55]);

  // Subtle stage breathing
  const stageScale = useTransform(
    smoothProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0.98, 1, 1, 1, 0.99],
  );

  if (prefersReduced) {
    // Reduced-motion: no scroll scrubbing, no ambient parallax.
    // Show the 4 stages as a simple, static grid summary.
    return (
      <section className="relative py-24 bg-background" aria-label="How a SmartLink card works">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            How a SmartLink card actually works
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
            From silicon to <span className="gradient-text">one tap.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
            Premium NFC cards programmed with your live SmartLink profile. Tap any phone to share everything you are.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {STAGE_TITLES.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card/50">
                <div className="text-xs font-mono text-primary mb-2">{STAGE_LABELS[i]}</div>
                <h3 className="text-xl font-semibold mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground">{STAGE_COPY[i]}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-12">
            <Button asChild size="lg" className="gradient-primary shadow-glow">
              <Link to="/nfc-products">
                Shop SmartCards <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass">
              <Link to="/signup">Create your profile</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: `${STAGES * 100}vh` }}
      aria-label="How a SmartLink card works"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {/* Parallax ambient background — opposite axes, soft, behind everything */}
        <motion.div
          aria-hidden
          style={{ y: orbAY, x: orbAX, opacity: orbAOpacity }}
          className="absolute top-[8%] left-[-8%] w-[520px] h-[520px] rounded-full bg-primary/20 blur-[140px] -z-10 will-change-transform"
        />
        <motion.div
          aria-hidden
          style={{ y: orbBY, x: orbBX, opacity: orbBOpacity }}
          className="absolute bottom-[6%] right-[-8%] w-[520px] h-[520px] rounded-full bg-accent/20 blur-[140px] -z-10 will-change-transform"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.03] to-background"
        />

        {/* Top scroll progress bar */}
        <motion.div
          style={{ scaleX: barScale }}
          className="absolute top-0 left-0 right-0 h-[3px] origin-left bg-gradient-to-r from-primary via-accent to-primary z-30 shadow-[0_0_20px_hsl(var(--primary))]"
        />

        {/* Stage canvas — no hero overlay; motion starts immediately */}
        <motion.div
          style={{ scale: stageScale }}
          className="relative h-full container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center will-change-transform"
        >
          {/* Left column: copy */}
          <div className="relative h-[60vh] md:h-[50vh]">
            {[0, 1, 2, 3].map((i) => (
              <StageCopy key={i} index={i} globalProgress={smoothProgress} />
            ))}
          </div>

          {/* Right column: graphics */}
          <div className="relative h-[60vh] md:h-[60vh] flex items-center justify-center">
            <StageSlot index={0} globalProgress={smoothProgress}>
              {(p) => <StageCard progress={p} />}
            </StageSlot>
            <StageSlot index={1} globalProgress={smoothProgress}>
              {(p) => <StageProfile progress={p} />}
            </StageSlot>
            <StageSlot index={2} globalProgress={smoothProgress}>
              {(p) => <StageProgram progress={p} />}
            </StageSlot>
            <StageSlot index={3} globalProgress={smoothProgress}>
              {(p) => <StageTap progress={p} />}
            </StageSlot>
          </div>
        </motion.div>

        {/* Stage dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {[0, 1, 2, 3].map((i) => (
            <StageDot key={i} index={i} globalProgress={smoothProgress} />
          ))}
        </div>

        {/* Scroll hint — only visible at the very top */}
        <ScrollHint progress={smoothProgress} />
      </div>
    </section>
  );
}

function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.04, 0.08], [1, 1, 0]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-foreground/70 z-20 pointer-events-none"
    >
      ↓ Scroll
    </motion.div>
  );
}

