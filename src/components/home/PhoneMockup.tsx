import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

const demoProfiles = [
  {
    name: "@creator",
    title: "Digital creator & artist",
    links: ["My Portfolio", "Latest Video", "Shop Merch", "Tip Jar"],
    gradient: "from-primary/60 to-accent/60",
    bgGradient: "from-primary/20 to-accent/30",
  },
  {
    name: "@musicprod",
    title: "Music producer · LA",
    links: ["New Album", "Spotify", "Book a Session", "Beats Store"],
    gradient: "from-rose-500/60 to-orange-500/60",
    bgGradient: "from-rose-500/20 to-orange-500/30",
  },
  {
    name: "@fitcoach",
    title: "Fitness coach & nutritionist",
    links: ["Workout Plans", "1:1 Coaching", "YouTube", "Free Guide"],
    gradient: "from-emerald-500/60 to-teal-500/60",
    bgGradient: "from-emerald-500/20 to-teal-500/30",
  },
  {
    name: "@designer",
    title: "UI/UX designer · Freelance",
    links: ["Dribbble", "Case Studies", "Hire Me", "Newsletter"],
    gradient: "from-violet-500/60 to-indigo-500/60",
    bgGradient: "from-violet-500/20 to-indigo-500/30",
  },
];

export function PhoneMockup() {
  const [phase, setPhase] = useState<"nfc" | "reveal" | "profiles">("nfc");
  const [activeProfile, setActiveProfile] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tilt interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Animation sequence: NFC tap → reveal → cycling profiles
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1800);
    const t2 = setTimeout(() => setPhase("profiles"), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Cycle profiles
  useEffect(() => {
    if (phase !== "profiles") return;
    const interval = setInterval(() => {
      setActiveProfile((p) => (p + 1) % demoProfiles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [phase]);

  const profile = demoProfiles[activeProfile];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex justify-center lg:justify-end"
      style={{ perspective: 800 }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative"
      >
        {/* NFC Card animation */}
        <AnimatePresence>
          {phase === "nfc" && (
            <motion.div
              initial={{ opacity: 0, y: -120, x: 40, rotate: -15 }}
              animate={{ opacity: 1, y: -20, x: 0, rotate: -5 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
            >
              <div className="w-[180px] sm:w-[200px] h-[110px] sm:h-[125px] rounded-2xl bg-gradient-to-br from-card via-muted to-card border border-border/50 shadow-elevated p-4 flex flex-col justify-between backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-6 rounded bg-primary/30" />
                  <span className="text-[10px] text-muted-foreground font-medium tracking-wider">NFC</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/80">SmartCard</div>
                  <div className="text-[10px] text-muted-foreground">Tap to connect</div>
                </div>
              </div>
              {/* Tap ripple */}
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: 2, ease: "easeOut" }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-primary/40"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone frame */}
        <motion.div
          className="w-[260px] sm:w-[300px] h-[520px] sm:h-[600px] rounded-[40px] bg-card/80 backdrop-blur-xl p-3 shadow-elevated border border-border/30 cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0.3, scale: 0.95 }}
          animate={{
            opacity: phase === "nfc" ? 0.6 : 1,
            scale: phase === "nfc" ? 0.97 : 1,
          }}
          transition={{ duration: 0.6 }}
          whileHover={{ y: -6 }}
        >
          <div className="w-full h-full rounded-[32px] overflow-hidden relative">
            {/* Background gradient that transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProfile}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className={`absolute inset-0 bg-gradient-to-b ${profile.bgGradient}`}
              />
            </AnimatePresence>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-card rounded-b-2xl z-10" />

            {/* Profile content */}
            <AnimatePresence mode="wait">
              {phase === "nfc" ? (
                <motion.div
                  key="loading"
                  className="flex items-center justify-center h-full"
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`profile-${activeProfile}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="pt-12 px-6 text-center relative z-[1]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${profile.gradient} mb-4 shadow-glow`}
                  />
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-foreground font-bold text-lg"
                  >
                    {profile.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-muted-foreground text-sm mt-1"
                  >
                    {profile.title}
                  </motion.p>

                  <div className="mt-6 space-y-3">
                    {profile.links.map((link, i) => (
                      <motion.div
                        key={link}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="w-full py-3 px-4 rounded-xl glass text-foreground/80 text-sm font-medium"
                      >
                        {link}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Profile indicator dots */}
        {phase === "profiles" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-2 mt-4"
          >
            {demoProfiles.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveProfile(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activeProfile
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </motion.div>
        )}

        {/* Glow effect */}
        <div className="absolute -inset-8 bg-primary/10 blur-[80px] -z-10 rounded-full" />
      </motion.div>
    </div>
  );
}
