import { motion } from "framer-motion";
import {
  iconMap,
  shapeClassFor,
  fontClassFor,
  type TemplateProfile,
} from "@/lib/smartlink-templates";

export interface TemplatePhoneCardProps {
  template: TemplateProfile;
  /** Optional overrides applied on top of the template (used by live preview). */
  overrides?: Partial<Pick<TemplateProfile, "name" | "bio" | "username" | "links" | "socials" | "avatarImage">>;
  /** Compact = smaller aspect for grid; full = tall preview. */
  size?: "compact" | "full";
  className?: string;
}

export function TemplatePhoneCard({
  template,
  overrides,
  size = "compact",
  className = "",
}: TemplatePhoneCardProps) {
  const t: TemplateProfile = { ...template, ...overrides };
  const aspect = size === "full" ? "aspect-[9/18]" : "aspect-[9/17]";
  const shapeClass = shapeClassFor(t.buttonShape);
  const fontClass = fontClassFor(t.font);

  return (
    <div
      className={`relative rounded-[36px] overflow-hidden ${aspect} shadow-elevated ring-1 ring-black/10 ${className}`}
    >
      <img
        src={t.bgImage}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {t.bgTint && <div className={`absolute inset-0 ${t.bgTint}`} />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/40" />

      <div className="relative h-full flex flex-col items-center px-5 pt-8 pb-6">
        <img
          src={t.avatarImage}
          alt={t.name}
          loading="lazy"
          className="w-20 h-20 rounded-full object-cover ring-2 ring-white/70 shadow-lg"
        />

        <motion.h3
          key={t.name}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 text-lg text-center ${fontClass} ${t.nameColor}`}
        >
          {t.name}
        </motion.h3>
        {t.username && (
          <p className={`text-[10px] mt-0.5 ${t.bioColor}`}>@{t.username}</p>
        )}
        <motion.p
          key={t.bio}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-[11px] text-center leading-snug mt-1 line-clamp-3 max-w-[85%] ${t.bioColor}`}
        >
          {t.bio}
        </motion.p>

        <div className="w-full mt-5 space-y-2.5">
          {t.links.map((label, i) => (
            <div
              key={`${label}-${i}`}
              className={`w-full text-center text-[11px] font-semibold py-3 ${shapeClass} ${t.buttonBg}`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 flex items-center gap-4">
          {t.socials.map((s) => {
            const Icon = iconMap[s];
            return <Icon key={s} className={`w-4 h-4 ${t.socialColor}`} />;
          })}
        </div>
      </div>
    </div>
  );
}
