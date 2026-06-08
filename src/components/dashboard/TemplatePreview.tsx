import { motion } from "framer-motion";
import {
  Stethoscope, Home, Trophy, Music, UtensilsCrossed, Dumbbell,
  Code, Star, GraduationCap, Briefcase, Camera, Palette,
  Play, Heart, MessageCircle, MapPin, Calendar, Activity,
} from "lucide-react";

interface TemplatePreviewProps {
  category: string;
  gradientClass: string; // e.g. "from-... via-... to-..."
  direction: string;     // e.g. "to-b" / "to-br"
  animationType: string | null;
  name: string;
}

/**
 * Renders a category-specific mini mockup as the template thumbnail.
 * Each category has its own layout, iconography and motion accent so
 * the grid stops looking like 24 identical gradient swatches.
 */
export function TemplatePreview({
  category,
  gradientClass,
  direction,
  animationType,
  name,
}: TemplatePreviewProps) {
  return (
    <div
      className={`relative h-32 overflow-hidden bg-gradient-${direction} ${gradientClass}`}
    >
      {/* Ambient animation layer (per template animation_type) */}
      <AmbientLayer type={animationType} />

      {/* Category-specific scene */}
      <div className="absolute inset-0 z-10">
        <CategoryScene category={category} name={name} />
      </div>

      {/* Soft vignette for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

/* ---------------- Ambient animations ---------------- */

function AmbientLayer({ type }: { type: string | null }) {
  if (!type) return null;

  switch (type) {
    case "shimmer":
      return (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
        />
      );
    case "pulse":
      return (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-white/10"
          animate={{ opacity: [0, 0.35, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      );
    case "glow":
      return (
        <motion.div
          aria-hidden
          className="absolute -inset-10 rounded-full blur-3xl bg-white/30"
          animate={{ opacity: [0.15, 0.45, 0.15], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      );
    case "neon":
      return (
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ boxShadow: "inset 0 0 40px rgba(236,72,153,0.6)" }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      );
    case "wave":
      return (
        <motion.div
          aria-hidden
          className="absolute -bottom-6 left-0 right-0 h-16 bg-white/15 rounded-[50%]"
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      );
    case "gradient-shift":
      return (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      );
    case "orbs":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute rounded-full bg-white/25 blur-xl"
              style={{ width: 60, height: 60, left: `${20 + i * 25}%`, top: `${10 + i * 15}%` }}
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}
        </>
      );
    case "particles":
      return (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute w-1 h-1 rounded-full bg-white/70"
              style={{ left: `${(i * 53) % 100}%`, top: `${(i * 31) % 100}%` }}
              animate={{ opacity: [0, 1, 0], y: [0, -12, 0] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </>
      );
    default:
      return null;
  }
}

/* ---------------- Category scenes ---------------- */

function CategoryScene({ category, name }: { category: string; name: string }) {
  switch (category) {
    case "creator":
    case "influencer":
      return <CreatorScene name={name} />;
    case "business":
      return <BusinessScene name={name} />;
    case "developer":
      return <DeveloperScene />;
    case "musician":
      return <MusicianScene />;
    case "photographer":
      return <PhotographerScene />;
    case "doctor":
      return <DoctorScene name={name} />;
    case "fitness":
    case "coach":
      return <FitnessScene category={category} />;
    case "restaurant":
      return <RestaurantScene />;
    case "realtor":
      return <RealtorScene />;
    case "educator":
      return <EducatorScene name={name} />;
    case "portfolio":
      return <PortfolioScene />;
    default:
      return <DefaultScene name={name} />;
  }
}

/* ---- Individual scenes ---- */

function CreatorScene({ name }: { name: string }) {
  // Phone-style profile: avatar + handle + reel tiles
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur ring-2 ring-white/60" />
        <motion.div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <Heart className="w-2 h-2 text-white" />
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white/95 text-[11px] font-bold truncate">@{name.toLowerCase().replace(/\s+/g, "")}</div>
        <div className="flex gap-1 mt-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-7 h-9 rounded-md bg-white/25 backdrop-blur flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-white fill-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessScene({ name }: { name: string }) {
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="w-12 h-12 rounded-lg bg-white/15 border border-white/40 flex items-center justify-center">
        <Briefcase className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-white text-[11px] font-bold tracking-wide">{name}</div>
        <div className="text-white/70 text-[9px] uppercase tracking-widest">CEO · Founder</div>
        <div className="mt-1.5 flex gap-1">
          <div className="h-1 w-10 rounded-full bg-white/40" />
          <div className="h-1 w-6 rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}

function DeveloperScene() {
  // Terminal window
  return (
    <div className="h-full w-full px-4 py-3 flex items-center">
      <div className="w-full rounded-md bg-black/55 border border-white/15 overflow-hidden font-mono">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
        <div className="px-2 py-1.5 text-[9px] leading-tight">
          <div className="text-emerald-300">$ whoami</div>
          <div className="text-white/90">&gt; developer<motion.span className="inline-block w-1 h-2 bg-emerald-300 ml-0.5" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} /></div>
        </div>
      </div>
    </div>
  );
}

function MusicianScene() {
  // Equalizer bars
  return (
    <div className="h-full w-full flex items-end justify-center gap-1 pb-5 px-4">
      <Music className="absolute top-3 left-3 w-4 h-4 text-white/80" />
      {[0.6, 1, 0.4, 0.85, 0.5, 0.95, 0.7, 0.45, 0.8, 0.55, 0.9, 0.4].map((h, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-sm bg-white/80"
          animate={{ scaleY: [h, h * 0.4, h] }}
          transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ height: 40 * h, transformOrigin: "bottom" }}
        />
      ))}
    </div>
  );
}

function PhotographerScene() {
  return (
    <div className="h-full w-full grid grid-cols-3 gap-1 p-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="rounded-sm bg-white/15 border border-white/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <Camera className="absolute bottom-2 right-2 w-4 h-4 text-white/80" />
    </div>
  );
}

function DoctorScene({ name }: { name: string }) {
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center">
        <Stethoscope className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-white text-[11px] font-semibold">Dr. {name.split(" ")[0]}</div>
        <div className="text-white/80 text-[9px]">Verified Practitioner</div>
        <motion.div
          className="mt-1.5 flex items-center gap-1"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <Activity className="w-2.5 h-2.5 text-white" />
          <div className="h-0.5 w-12 bg-white/50 rounded" />
        </motion.div>
      </div>
    </div>
  );
}

function FitnessScene({ category }: { category: string }) {
  const Icon = category === "coach" ? Trophy : Dumbbell;
  return (
    <div className="h-full w-full flex flex-col justify-center items-center px-4">
      <motion.div
        animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="mb-1"
      >
        <Icon className="w-9 h-9 text-white drop-shadow-lg" />
      </motion.div>
      <div className="text-white font-black text-[12px] tracking-widest uppercase">No Limits</div>
      <div className="flex gap-1 mt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-0.5 w-4 bg-white/70 rounded" />
        ))}
      </div>
    </div>
  );
}

function RestaurantScene() {
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="w-12 h-12 rounded-full bg-white/15 border border-white/40 flex items-center justify-center">
        <UtensilsCrossed className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-white text-[11px] font-serif italic">Chef's Table</div>
        <div className="flex items-center gap-1 mt-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-2 h-2 fill-yellow-300 text-yellow-300" />
          ))}
        </div>
        <div className="text-white/70 text-[9px] mt-0.5">Open · Reserve</div>
      </div>
    </div>
  );
}

function RealtorScene() {
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="w-14 h-12 rounded-md bg-white/20 border border-white/40 flex items-center justify-center">
        <Home className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-white text-[11px] font-semibold">Listed · $1.2M</div>
        <div className="flex items-center gap-1 text-white/80 text-[9px]">
          <MapPin className="w-2.5 h-2.5" /> Downtown · 4 bd
        </div>
        <div className="mt-1 h-1 rounded-full bg-white/20 overflow-hidden">
          <motion.div
            className="h-full bg-white/80"
            animate={{ width: ["20%", "80%", "20%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}

function EducatorScene({ name }: { name: string }) {
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="w-12 h-12 rounded-lg bg-white/15 border border-white/40 flex items-center justify-center">
        <GraduationCap className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-white text-[11px] font-semibold">{name}</div>
        <div className="flex items-center gap-1 text-white/80 text-[9px] mt-0.5">
          <Calendar className="w-2.5 h-2.5" /> Next class · 10:00
        </div>
        <div className="flex gap-1 mt-1">
          <span className="px-1.5 rounded bg-white/20 text-white text-[8px]">Math</span>
          <span className="px-1.5 rounded bg-white/20 text-white text-[8px]">AI</span>
        </div>
      </div>
    </div>
  );
}

function PortfolioScene() {
  return (
    <div className="h-full w-full grid grid-cols-2 gap-1.5 p-3">
      <div className="rounded-md bg-white/15 border border-white/30 flex items-center justify-center">
        <Palette className="w-4 h-4 text-white" />
      </div>
      <div className="row-span-2 rounded-md bg-white/25 border border-white/30" />
      <div className="rounded-md bg-white/15 border border-white/30 flex items-center justify-center text-white text-[9px] font-bold">2026</div>
    </div>
  );
}

function DefaultScene({ name }: { name: string }) {
  return (
    <div className="h-full w-full flex items-center gap-3 px-4">
      <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-white text-[11px] font-semibold">{name}</div>
        <div className="text-white/70 text-[9px]">smartcard.sa</div>
      </div>
    </div>
  );
}
