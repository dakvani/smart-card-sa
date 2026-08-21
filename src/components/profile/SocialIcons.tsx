import { Instagram, Twitter, Youtube, Facebook, Linkedin, Github, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { BRAND_LOGOS } from "@/lib/brand-logos";

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

interface SocialIconsProps {
  socialLinks: SocialLinks;
}

const socialConfig = [
  { key: "instagram", icon: Instagram, getUrl: (v: string) => `https://instagram.com/${v}` },
  { key: "twitter", icon: Twitter, getUrl: (v: string) => `https://twitter.com/${v}` },
  { key: "youtube", icon: Youtube, getUrl: (v: string) => `https://youtube.com/@${v}` },
  { key: "facebook", icon: Facebook, getUrl: (v: string) => `https://facebook.com/${v}` },
  { key: "linkedin", icon: Linkedin, getUrl: (v: string) => `https://linkedin.com/in/${v}` },
  { key: "github", icon: Github, getUrl: (v: string) => `https://github.com/${v}` },
  { key: "website", icon: Globe, getUrl: (v: string) => v.startsWith("http") ? v : `https://${v}` },
] as const;

export function SocialIcons({ socialLinks }: SocialIconsProps) {
  const activeLinks = socialConfig.filter(
    ({ key }) => (socialLinks as Record<string, string>)[key]
  );

  if (activeLinks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center justify-center gap-4 mt-6"
    >
      {activeLinks.map(({ key, icon: Icon, getUrl }) => {
        const value = (socialLinks as Record<string, string>)[key];
        const brandLogo = BRAND_LOGOS[key];

        return (
          <a
            key={key}
            href={getUrl(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all shadow-lg"
          >
            {brandLogo ? (
              <img src={brandLogo} alt={key} className="w-5 h-5 object-contain" />
            ) : (
              <Icon className="w-5 h-5 text-primary-foreground" />
            )}
          </a>
        );
      })}
    </motion.div>
  );
}
