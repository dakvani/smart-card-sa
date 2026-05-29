import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Star } from "lucide-react";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";
import { SocialIcons } from "@/components/profile/SocialIcons";
import { EmailSignup } from "@/components/profile/EmailSignup";
import { AnimatedBackground } from "@/components/profile/AnimatedBackground";
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
  if (link.scheduled_start && new Date(link.scheduled_start) > now) {
    return false;
  }
  if (link.scheduled_end && new Date(link.scheduled_end) <= now) {
    return false;
  }
  return true;
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
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

        // Record view
        await supabase.from("profile_views").insert({
          profile_id: profileData.id,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });

        // Fetch visible links (including scheduled ones - we filter client-side)
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", profileData.user_id)
          .eq("visible", true)
          .order("position", { ascending: true });

        if (linksError) throw linksError;
        
        // Filter to only show active links based on schedule
        const activeLinks = (linksData || []).filter(isLinkActive);
        setLinks(activeLinks);

        // Fetch groups for visible links
        const groupIds = [...new Set(activeLinks.filter(l => l.group_id).map(l => l.group_id))];
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

  const handleLinkClick = async (linkId: string, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");

    if (!profile) return;

    // Fire-and-forget but reliable: atomic RPC + detailed click row in parallel
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

  // Compute background style
  const bgStyle = profile.custom_bg_color ? {
    background: profile.custom_accent_color
      ? `linear-gradient(to bottom, ${profile.custom_bg_color}, ${profile.custom_accent_color})`
      : profile.custom_bg_color,
  } : undefined;

  const bgClass = !profile.custom_bg_color 
    ? `bg-gradient-${profile.gradient_direction || 'to-b'} ${profile.theme_gradient}`
    : '';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 sm:py-10 sm:px-4 flex items-start sm:items-center justify-center">
      {/* Desktop: phone-frame wrapper. Mobile: full-bleed. */}
      <div className="w-full sm:w-auto">
        <div
          className={`
            relative w-full min-h-screen overflow-hidden
            sm:min-h-0 sm:w-[390px] sm:h-[820px] sm:rounded-[3rem]
            sm:border-[10px] sm:border-slate-800
            sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.04)_inset]
            sm:ring-1 sm:ring-white/5
          `}
        >
          {/* Notch (desktop only) */}
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-30" />

          <div
            className={`relative h-full overflow-y-auto pt-8 pb-10 px-4 sm:pt-12 ${bgClass}`}
            style={bgStyle}
          >
            <AnimatedBackground
              animationType={profile.animation_type}
              config={{ speed: profile.animation_speed || 1, intensity: profile.animation_intensity || 1 }}
            />

            <div className="max-w-md mx-auto relative z-10">

        {/* Profile Header — compact link-in-bio */}
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

          {/* Social Icons */}
          <SocialIcons socialLinks={profile.social_links || {}} />
        </motion.div>

        {/* Links */}
        <div className="space-y-2.5">
          {/* Featured Links - Always at top with special styling */}
          {links.filter(l => l.is_featured).length > 0 && (
            <div className="space-y-3">
              <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </p>
              {links.filter(l => l.is_featured).map((link, index) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  className="w-full flex items-center gap-3 py-3.5 px-5 rounded-2xl bg-primary-foreground/30 backdrop-blur border border-primary-foreground/20 hover:bg-primary-foreground/40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  {link.thumbnail_url && (
                    <img 
                      src={link.thumbnail_url} 
                      alt="" 
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-primary-foreground/30" 
                    />
                  )}
                  <span className="flex-1 text-primary-foreground font-bold text-center text-lg">
                    {link.title}
                  </span>
                  {link.thumbnail_url && <div className="w-12" />}
                </motion.button>
              ))}
            </div>
          )}

          {/* Ungrouped Links (non-featured) */}
          {links.filter(l => !l.group_id && !l.is_featured).length > 0 && (
            <div className="space-y-2.5">
              {links.filter(l => !l.group_id && !l.is_featured).map((link, index) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  className="w-full flex items-center gap-3 py-3 px-5 rounded-2xl bg-primary-foreground/20 backdrop-blur hover:bg-primary-foreground/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {link.thumbnail_url && (
                    <img 
                      src={link.thumbnail_url} 
                      alt="" 
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0" 
                    />
                  )}
                  <span className="flex-1 text-primary-foreground font-semibold text-center">
                    {link.title}
                  </span>
                  {link.thumbnail_url && <div className="w-10" />}
                </motion.button>
              ))}
            </div>
          )}

          {/* Grouped Links */}
          {groups.map((group, groupIndex) => {
            const groupLinks = links.filter(l => l.group_id === group.id);
            if (groupLinks.length === 0) return null;
            
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + groupIndex * 0.1 }}
              >
                <p className="text-primary-foreground/60 text-sm font-medium mb-3 text-center">
                  {group.name}
                </p>
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
                        <img 
                          src={link.thumbnail_url} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0" 
                        />
                      )}
                      <span className="flex-1 text-primary-foreground font-semibold text-center">
                        {link.title}
                      </span>
                      {link.thumbnail_url && <div className="w-10" />}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Email Signup */}
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

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground transition-colors text-sm"
          >
            <SmartCardLogo className="w-4 h-4" />
            Made with SmartCard
          </Link>
        </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
