import {
  Instagram, Youtube, Twitter, Linkedin, Github, Music2,
  Facebook, Globe, Mail, MessageCircle, Twitch, Camera,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";

/* ---------------- Zod schemas ---------------- */

/** Schema for the user-editable bio content in the live editor. */
export const bioInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Display name is required" })
    .max(40, { message: "Keep it under 40 characters" }),
  username: z
    .string()
    .trim()
    .min(2, { message: "Username must be at least 2 characters" })
    .max(30, { message: "Username must be under 30 characters" })
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: "Only letters, numbers, dots, dashes and underscores",
    }),
  bio: z
    .string()
    .trim()
    .max(160, { message: "Bio must be 160 characters or fewer" }),
});
export type BioInput = z.infer<typeof bioInputSchema>;

/* ---------------- Type-safe schema ---------------- */

export const SOCIAL_ICONS = [
  "instagram", "youtube", "x", "tiktok", "linkedin", "github",
  "facebook", "website", "email", "whatsapp", "twitch", "spotify",
] as const;
export type SocialIcon = (typeof SOCIAL_ICONS)[number];

export const BUTTON_SHAPES = ["pill", "square", "torn", "outline", "shadow-hard"] as const;
export type ButtonShape = (typeof BUTTON_SHAPES)[number];

export const FONT_FAMILIES = ["sans", "serif", "mono", "display"] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];

export const TEXT_TONE = ["light", "dark"] as const;
export type TextTone = (typeof TEXT_TONE)[number];

export type TemplateProfile = {
  name: string;
  username: string;
  category: string;
  bio: string;
  bgImage: string;
  bgTint?: string;
  avatarImage: string;
  font: FontFamily;
  /** Semantic hint used by consumers that need to know if surface is light or dark. */
  textOnDark: TextTone;
  nameColor: string;
  bioColor: string;
  buttonShape: ButtonShape;
  buttonBg: string;
  socialColor: string;
  links: string[];
  socials: SocialIcon[];
};

export const iconMap: Record<SocialIcon, LucideIcon> = {
  instagram: Instagram,
  youtube: Youtube,
  x: Twitter,
  tiktok: Music2,
  linkedin: Linkedin,
  github: Github,
  facebook: Facebook,
  website: Globe,
  email: Mail,
  whatsapp: MessageCircle,
  twitch: Twitch,
  spotify: Camera,
};

/**
 * Dev-time runtime validator so a bad template shape fails loudly instead of
 * showing up as a silent visual glitch or a broken build later.
 */
export function assertTemplate(t: TemplateProfile, ctx = "template"): void {
  const req: (keyof TemplateProfile)[] = [
    "name", "username", "category", "bio",
    "bgImage", "avatarImage", "font", "textOnDark",
    "nameColor", "bioColor", "buttonShape", "buttonBg",
    "socialColor", "links", "socials",
  ];
  for (const k of req) {
    if (t[k] === undefined || t[k] === null || t[k] === "") {
      throw new Error(`[${ctx}:${t.username ?? "?"}] missing field "${String(k)}"`);
    }
  }
  if (!FONT_FAMILIES.includes(t.font)) throw new Error(`bad font: ${t.font}`);
  if (!BUTTON_SHAPES.includes(t.buttonShape)) throw new Error(`bad buttonShape: ${t.buttonShape}`);
  if (!TEXT_TONE.includes(t.textOnDark)) throw new Error(`bad textOnDark: ${t.textOnDark}`);
  if (!Array.isArray(t.links) || t.links.length === 0) throw new Error("links must be non-empty");
  for (const s of t.socials) {
    if (!SOCIAL_ICONS.includes(s)) throw new Error(`bad social icon: ${s}`);
  }
}

/** Helper: build a template with full type-checking via `satisfies`. */
export const defineTemplate = <T extends TemplateProfile>(t: T): T => {
  if (import.meta.env.DEV) assertTemplate(t);
  return t;
};

/* ---------------- Style helpers ---------------- */

export const shapeClassFor = (s: ButtonShape): string => {
  switch (s) {
    case "pill": return "rounded-full";
    case "square": return "rounded-none";
    case "outline": return "rounded-full";
    case "shadow-hard": return "rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]";
    case "torn": return "rounded-2xl [clip-path:polygon(2%_10%,98%_4%,100%_88%,4%_96%)]";
  }
};

export const fontClassFor = (f: FontFamily): string => {
  switch (f) {
    case "serif": return "font-serif tracking-tight";
    case "mono": return "font-mono tracking-tighter";
    case "display": return "font-black uppercase tracking-wide";
    case "sans": return "font-semibold";
  }
};

/* ---------------- Templates ---------------- */

export const templates: TemplateProfile[] = [
  defineTemplate({
    name: "Matthew Hugh", username: "matthew.skates", category: "Social Media",
    bio: "Aspiring skater with a taste for cooking.",
    bgImage: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=70",
    font: "serif", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/90",
    buttonShape: "torn", buttonBg: "bg-orange-200/95 text-neutral-900",
    socialColor: "text-white",
    links: ["Youtube Channel", "Tiktok Account", "Instagram"],
    socials: ["tiktok", "youtube", "x", "instagram"],
  }),
  defineTemplate({
    name: "Timothy Teodor", username: "timothy.teo", category: "Music",
    bio: "Online most people know me as Teodor, so that's what I prefer to go by.",
    bgImage: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=70",
    font: "mono", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "pill", buttonBg: "bg-orange-500 text-white",
    socialColor: "text-white",
    links: ["Twitch Account", "Merch Store", "Contact"],
    socials: ["tiktok", "youtube", "x", "instagram"],
  }),
  defineTemplate({
    name: "Gabrielle Lacey", username: "gabby.hoops", category: "Health & Fitness",
    bio: "Basketball today, tomorrow and forever.",
    bgImage: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=70",
    font: "sans", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/90",
    buttonShape: "pill", buttonBg: "bg-white text-neutral-900",
    socialColor: "text-white",
    links: ["Favourite Courts", "Donate to our team", "Team store"],
    socials: ["tiktok", "youtube", "x", "instagram"],
  }),
  defineTemplate({
    name: "Sara Al-Otaibi", username: "sara.designs", category: "Creator",
    bio: "Brand & visual identity designer — Riyadh",
    bgImage: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=70",
    font: "display", textOnDark: "dark",
    nameColor: "text-neutral-900", bioColor: "text-neutral-800/80",
    buttonShape: "shadow-hard", buttonBg: "bg-white text-neutral-900 border-2 border-neutral-900",
    socialColor: "text-neutral-900",
    links: ["Portfolio", "Book a Project", "Case Studies", "Shop Prints"],
    socials: ["instagram", "youtube", "x", "website"],
  }),
  defineTemplate({
    name: "Omar Khaled", username: "omar.dev", category: "Tech",
    bio: "Full-stack engineer • React, Node, Postgres",
    bgImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=70",
    font: "mono", textOnDark: "light",
    nameColor: "text-emerald-300", bioColor: "text-emerald-100/80",
    buttonShape: "outline", buttonBg: "bg-transparent text-emerald-200 border border-emerald-300/60",
    socialColor: "text-emerald-200",
    links: ["GitHub", "Hire Me", "Open Source", "Read Blog"],
    socials: ["github", "linkedin", "x", "website"],
  }),
  defineTemplate({
    name: "Layla Hassan", username: "layla.sings", category: "Music",
    bio: "Indie pop • New single 'Golden Hour' out now",
    bgImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=70",
    font: "display", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "pill", buttonBg: "bg-fuchsia-500 text-white",
    socialColor: "text-white",
    links: ["Listen on Spotify", "New Music Video", "Tour Tickets", "Merch Store"],
    socials: ["spotify", "youtube", "instagram", "tiktok"],
  }),
  defineTemplate({
    name: "Faisal Aziz", username: "faisal.fit", category: "Health & Fitness",
    bio: "Certified coach • Strength & nutrition",
    bgImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&q=70",
    font: "sans", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/90",
    buttonShape: "square", buttonBg: "bg-neutral-900 text-white",
    socialColor: "text-white",
    links: ["8-Week Program", "Book 1:1 Session", "Free Workout PDF", "Supplements"],
    socials: ["instagram", "youtube", "tiktok", "whatsapp"],
  }),
  defineTemplate({
    name: "Noura Salem", username: "noura.style", category: "Fashion",
    bio: "Editorial & personal styling — Dubai",
    bgImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=70",
    font: "serif", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "outline", buttonBg: "bg-transparent text-white border border-white/70",
    socialColor: "text-white",
    links: ["Shop My Looks", "Lookbook 2026", "Book Styling", "Newsletter"],
    socials: ["instagram", "tiktok", "youtube", "website"],
  }),
  defineTemplate({
    name: "Yousef Rahman", username: "chef.yousef", category: "Food",
    bio: "Modern Middle Eastern kitchen",
    bgImage: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&q=70",
    font: "serif", textOnDark: "light",
    nameColor: "text-amber-50", bioColor: "text-amber-50/80",
    buttonShape: "torn", buttonBg: "bg-amber-100 text-neutral-900",
    socialColor: "text-amber-50",
    links: ["Reserve a Table", "Order Catering", "Recipe Book", "Cooking Classes"],
    socials: ["instagram", "youtube", "tiktok", "website"],
  }),
  defineTemplate({
    name: "Reem Al-Fahad", username: "reem.consults", category: "Business",
    bio: "GTM strategy for early-stage founders",
    bgImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=70",
    font: "sans", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "square", buttonBg: "bg-white text-neutral-900",
    socialColor: "text-white",
    links: ["Book a Call", "Case Studies", "Newsletter", "Podcast"],
    socials: ["linkedin", "x", "youtube", "email"],
  }),
  defineTemplate({
    name: "Ustadha Hana", username: "hana.tutor", category: "Education",
    bio: "IELTS, Arabic & English tutoring",
    bgImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=70",
    font: "serif", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "pill", buttonBg: "bg-white text-neutral-900",
    socialColor: "text-white",
    links: ["Book a Lesson", "Free Worksheet", "Group Classes", "YouTube Lessons"],
    socials: ["youtube", "instagram", "tiktok", "email"],
  }),
  defineTemplate({
    name: "Khalid Majed", username: "khalid.realty", category: "Real Estate",
    bio: "Residential & investment listings — KSA",
    bgImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70",
    avatarImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=70",
    font: "sans", textOnDark: "light",
    nameColor: "text-white", bioColor: "text-white/85",
    buttonShape: "shadow-hard", buttonBg: "bg-amber-400 text-neutral-900 border-2 border-neutral-900",
    socialColor: "text-white",
    links: ["View Listings", "Schedule Viewing", "Market Report", "Sell Your Home"],
    socials: ["whatsapp", "linkedin", "instagram", "website"],
  }),
];

export const templateCategories = [
  "All templates",
  "Fashion",
  "Health & Fitness",
  "Creator",
  "Business",
  "Music",
  "Social Media",
  "Tech",
  "Food",
  "Education",
  "Real Estate",
] as const;
