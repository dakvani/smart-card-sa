import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Star, Smartphone, Maximize2 } from "lucide-react";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { SocialIcons } from "@/components/profile/SocialIcons";
import { EmailSignup } from "@/components/profile/EmailSignup";
import { AnimatedBackground } from "@/components/profile/AnimatedBackground";
import { ClaimSmartCardDialog } from "@/components/profile/ClaimSmartCardDialog";
import { parseUserAgent } from "@/lib/userAgentParser";

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  theme_gradient: string;
  social_links: SocialLinks;
  custom_bg_color: string | null;
  custom_accent_color: string | null;
  gradient_direction: string;
  email_collection_enabled: boolean;
  animation_type: string | null;
  animation_speed: number;
  animation_intensity: number;
  plan?: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  visible: boolean;
  thumbnail_url: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  group_id: string | null;
  is_featured: boolean;
}

interface LinkGroup {
  id: string;
  name: string;
  position: number;
}

// Check if link is currently active based on schedule
const isLinkActive = (link: LinkItem): boolean => {
  const now = new Date();
  if (link.scheduled_start && new Date(link.scheduled_start) > now) return false;
  if (link.scheduled_end && new Date(link.scheduled_end) <= now) return false;
  return true;
};

// ---- Color helpers for QR contrast ----
const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = hex.replace("#", "").match(/^([\da-f]{3}|[\da-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const relLuminance = (rgb: [number, number, number]) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/**
 * Derive QR fg/bg from theme while guaranteeing WCAG-safe contrast for scanners.
 * Strategy: keep bg pure white (best scan reliability across devices),
 * tint the fg with the user's accent color only if it's dark enough.
 */
const getQrColors = (accent: string | null | undefined) => {
  const bg = "#FFFFFF";
  if (accent) {
    const rgb = hexToRgb(accent);
    if (rgb && relLuminance(rgb) < 0.35) {
      return { fg: accent, bg };
    }
  }
  return { fg: "#0F172A", bg };
};

type PreviewMode = "phone" | "compact";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchParams] = useSearchParams();
  const forceMobile = searchParams.get("mobile") === "1" || searchParams.get("m") === "1";
  const [previewMode, setPreviewMode] = useState<PreviewMode>("phone");
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id,user_id,username,title,bio,avatar_url,theme_name,theme_gradient,gradient_direction,social_links,custom_bg_color,custom_accent_color,animation_type,animation_speed,animation_intensity,email_collection_enabled,created_at,updated_at")
          .eq("username", username.toLowerCase())
          .maybeSingle();


        if (profileError) throw profileError;
        if (!profileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile({
          ...profileData,
          social_links: (profileData.social_links as SocialLinks) || {},
        });

        await supabase.from("profile_views").insert({
          profile_id: profileData.id,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });

        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", profileData.user_id)
          .eq("visible", true)
          .order("position", { ascending: true });

        if (linksError) throw linksError;
        const activeLinks = (linksData || []).filter(isLinkActive);
        setLinks(activeLinks);

        const groupIds = [...new Set(activeLinks.filter((l) => l.group_id).map((l) => l.group_id))];
        if (groupIds.length > 0) {
          const { data: groupsData } = await supabase
            .from("link_groups")
            .select("id, name, position")
            .in("id", groupIds)
            .order("position", { ascending: true });
          setGroups(groupsData || []);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  // QR value: always points to the dedicated tracked redirect for this username.
  // Recomputes whenever the username changes, so the QR stays correct after username updates.
  const qrValue = useMemo(() => {
    if (typeof window === "undefined" || !profile?.username) return "";
    return `${window.location.origin}/qr/${profile.username}`;
  }, [profile?.username]);

  const qrColors = useMemo(
    () => getQrColors(profile?.custom_accent_color),
    [profile?.custom_accent_color]
  );

  const handleLinkClick = async (linkId: string, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    if (!profile) return;
    const ua = parseUserAgent(navigator.userAgent);
    void supabase.rpc("increment_link_click", { link_uuid: linkId }).then(({ error }) => {
      if (error) console.warn("increment_link_click failed:", error.message);
    });
    void supabase
      .from("link_clicks")
      .insert({
        link_id: linkId,
        profile_id: profile.id,
        device_type: ua.device_type,
        browser: ua.browser,
        os: ua.os,
        referrer: document.referrer || null,
      })
      .then(({ error }) => {
        if (error) console.warn("link_clicks insert failed:", error.message);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">This SmartCard doesn't exist yet.</p>
          <Link
            to={`/auth?signup=true&username=${username}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold"
          >
            Claim @{username}
          </Link>
        </div>
        <Link to="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground">
          ← Back to SmartCard
        </Link>
      </div>
    );
  }

  const bgStyle = profile.custom_bg_color
    ? {
        background: profile.custom_accent_color
          ? `linear-gradient(to bottom, ${profile.custom_bg_color}, ${profile.custom_accent_color})`
          : profile.custom_bg_color,
      }
    : undefined;

  const bgClass = !profile.custom_bg_color
    ? `bg-gradient-${profile.gradient_direction || "to-b"} ${profile.theme_gradient}`
    : "";

  const isCompact = previewMode === "compact";
  // Any paid tier (pro, pro_plus, business, enterprise, lifetime) removes the SmartCard badge
  const isPro = !!profile.plan && profile.plan !== "free";

  // Reusable QR block (inline in footer for compact mode and small screens)
  const InlineQR = (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className="rounded-lg p-2" style={{ background: qrColors.bg }}>
        <QRCodeSVG value={qrValue} size={104} level="M" fgColor={qrColors.fg} bgColor={qrColors.bg} />
      </div>
      <p className="text-[11px] font-medium text-primary-foreground/80">View on mobile</p>
      <p className="text-[10px] text-primary-foreground/50 leading-tight text-center max-w-[180px]">
        Scan to open on your phone
      </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 sm:py-10 sm:px-4 flex items-start sm:items-center justify-center">
      {/* Preview-mode toggle (tablet/desktop only — hidden when ?mobile=1 forces mobile layout) */}
      {!forceMobile && (
        <div className="hidden sm:flex fixed top-4 right-4 z-40 items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 backdrop-blur p-1 shadow-lg">
          <button
            onClick={() => setPreviewMode("phone")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              previewMode === "phone"
                ? "bg-white text-slate-900"
                : "text-white/70 hover:text-white"
            }`}
            aria-pressed={previewMode === "phone"}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Phone
          </button>
          <button
            onClick={() => setPreviewMode("compact")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              previewMode === "compact"
                ? "bg-white text-slate-900"
                : "text-white/70 hover:text-white"
            }`}
            aria-pressed={previewMode === "compact"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Compact
          </button>
        </div>
      )}

      <div className="w-full sm:w-auto">
        <div
          className={
            isCompact
              ? "relative w-full sm:w-[480px] min-h-screen sm:min-h-0 overflow-hidden sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl"
              : "relative w-full min-h-screen overflow-hidden sm:min-h-0 sm:w-[390px] sm:h-[820px] sm:rounded-[3rem] sm:border-[10px] sm:border-slate-800 sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.04)_inset] sm:ring-1 sm:ring-white/5"
          }
        >
          {/* Notch (phone mode, desktop only) */}
          {!isCompact && (
            <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-30" />
          )}

          <div
            className={`relative h-full overflow-y-auto pt-8 pb-10 px-4 ${
              isCompact ? "" : "sm:pt-12"
            } ${bgClass}`}
            style={bgStyle}
          >
            <AnimatedBackground
              animationType={profile.animation_type}
              config={{ speed: profile.animation_speed || 1, intensity: profile.animation_intensity || 1 }}
            />

            <div className="max-w-md mx-auto relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-5 sm:mb-6"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-primary-foreground/20 backdrop-blur mb-3 flex items-center justify-center overflow-hidden ring-2 ring-primary-foreground/20">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-primary-foreground">
                      {profile.username[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground leading-tight">{profile.title}</h1>
                {profile.bio && (
                  <p className="text-sm text-primary-foreground/70 mt-1.5 max-w-xs mx-auto leading-snug">{profile.bio}</p>
                )}
                <SocialIcons socialLinks={profile.social_links || {}} />
              </motion.div>

              <div className="space-y-2.5">
                {links.filter((l) => l.is_featured).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </p>
                    {links.filter((l) => l.is_featured).map((link, index) => (
                      <motion.button
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleLinkClick(link.id, link.url)}
                        className="w-full flex items-center gap-3 py-3.5 px-5 rounded-2xl bg-primary-foreground/30 backdrop-blur border border-primary-foreground/20 hover:bg-primary-foreground/40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                      >
                        {link.thumbnail_url && (
                          <img src={link.thumbnail_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-primary-foreground/30" />
                        )}
                        <span className="flex-1 text-primary-foreground font-bold text-center text-lg">{link.title}</span>
                        {link.thumbnail_url && <div className="w-12" />}
                      </motion.button>
                    ))}
                  </div>
                )}

                {links.filter((l) => !l.group_id && !l.is_featured).length > 0 && (
                  <div className="space-y-2.5">
                    {links.filter((l) => !l.group_id && !l.is_featured).map((link, index) => (
                      <motion.button
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleLinkClick(link.id, link.url)}
                        className="w-full flex items-center gap-3 py-3 px-5 rounded-2xl bg-primary-foreground/20 backdrop-blur hover:bg-primary-foreground/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        {link.thumbnail_url && (
                          <img src={link.thumbnail_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        )}
                        <span className="flex-1 text-primary-foreground font-semibold text-center">{link.title}</span>
                        {link.thumbnail_url && <div className="w-10" />}
                      </motion.button>
                    ))}
                  </div>
                )}

                {groups.map((group, groupIndex) => {
                  const groupLinks = links.filter((l) => l.group_id === group.id);
                  if (groupLinks.length === 0) return null;
                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + groupIndex * 0.1 }}
                    >
                      <p className="text-primary-foreground/60 text-sm font-medium mb-3 text-center">{group.name}</p>
                      <div className="space-y-3">
                        {groupLinks.map((link, index) => (
                          <motion.button
                            key={link.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            onClick={() => handleLinkClick(link.id, link.url)}
                            className="w-full flex items-center gap-3 py-3 px-5 rounded-2xl bg-primary-foreground/20 backdrop-blur hover:bg-primary-foreground/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            {link.thumbnail_url && (
                              <img src={link.thumbnail_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                            )}
                            <span className="flex-1 text-primary-foreground font-semibold text-center">{link.title}</span>
                            {link.thumbnail_url && <div className="w-10" />}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {profile.email_collection_enabled && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <EmailSignup profileId={profile.id} />
                </motion.div>
              )}

              {/* Inline QR — always on mobile, and on sm+ when in Compact mode */}
              <div className={isCompact ? "block" : "block sm:hidden"}>{InlineQR}</div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 sm:mt-12 text-center"
              >
                {!isPro && (
                  <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground transition-colors text-xs sm:text-sm"
                    >
                      <SmartCardLogo className="w-4 h-4" />
                      Made with SmartCard
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setClaimOpen(true)}
                      className="h-7 px-2.5 text-[11px] rounded-full bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      Join free
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Side QR badge — only phone mode on sm+ */}
          {!isCompact && (
            <div className="hidden sm:flex absolute -right-44 top-6 w-40 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur p-3 shadow-xl">
              <div className="rounded-lg p-2" style={{ background: qrColors.bg }}>
                <QRCodeSVG value={qrValue} size={120} level="M" fgColor={qrColors.fg} bgColor={qrColors.bg} />
              </div>
              <p className="text-[11px] font-medium text-primary-foreground/80 text-center leading-tight">
                View on mobile
              </p>
              <p className="text-[10px] text-primary-foreground/50 text-center leading-tight">
                Scan to open on your phone
              </p>
            </div>
          )}
        </div>
      </div>
      <ClaimSmartCardDialog open={claimOpen} onOpenChange={setClaimOpen} />
    </div>
  );
}
