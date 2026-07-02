import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, ExternalLink, LogOut, BarChart3, Palette, Settings as SettingsIcon, Link2, Loader2, Copy, Check, Folder, Eye, MousePointerClick, Sparkles, Undo2, Redo2, Save } from "lucide-react";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { SocialLinksEditor, SocialLinks } from "@/components/dashboard/SocialLinksEditor";
import { SortableLinkItem } from "@/components/dashboard/SortableLinkItem";
import { SocialIcons } from "@/components/profile/SocialIcons";
const AnalyticsCharts = lazy(() =>
  import("@/components/dashboard/AnalyticsCharts").then((m) => ({ default: m.AnalyticsCharts }))
);
import { AnimatedBackground } from "@/components/profile/AnimatedBackground";
import { ThemeCustomizer } from "@/components/dashboard/ThemeCustomizer";
import { QRCodeGenerator } from "@/components/dashboard/QRCodeGenerator";
import { ProfileShareCard } from "@/components/dashboard/ProfileShareCard";
import { EmailSubscribers } from "@/components/dashboard/EmailSubscribers";
import { ProfileTemplates } from "@/components/dashboard/ProfileTemplates";
import { LinkGroupManager, LinkGroup } from "@/components/dashboard/LinkGroupManager";
import { FavoritePresets } from "@/components/dashboard/FavoritePresets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlan } from "@/hooks/use-plan";
import { PlanWelcomeDialog } from "@/components/dashboard/PlanWelcomeDialog";
// AccountSecuritySection removed — managed in /settings

import { OnboardingConfirmDialog } from "@/components/dashboard/OnboardingConfirmDialog";
import { MobileTabBar } from "@/components/dashboard/MobileTabBar";
import { computeOnboardingPrefill, trackOnboarding, type OnboardingPrefill } from "@/lib/onboarding";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  theme_name: string;
  theme_gradient: string;
  social_links: SocialLinks;
  custom_bg_color: string | null;
  custom_accent_color: string | null;
  gradient_direction: string;
  email_collection_enabled: boolean;
  animation_type: string | null;
  animation_speed: number;
  animation_intensity: number;
  custom_background_url?: string | null;
  custom_background_type?: "image" | "video" | null;
  motion_enabled?: boolean;
}

interface LinkItem {
  id: string;
  user_id: string;
  title: string;
  url: string;
  visible: boolean;
  position: number;
  click_count: number;
  thumbnail_url: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  group_id: string | null;
  is_featured: boolean;
}

const tabs = [
  { id: "links", label: "Links", icon: Link2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const presetThemes = [
  { name: "Midnight", gradient: "from-indigo-900 via-purple-900 to-pink-900" },
  { name: "Sunset", gradient: "from-orange-500 via-pink-500 to-purple-600" },
  { name: "Ocean", gradient: "from-cyan-500 via-blue-500 to-indigo-600" },
  { name: "Forest", gradient: "from-green-600 via-emerald-500 to-teal-500" },
  { name: "Minimal", gradient: "from-gray-100 via-gray-200 to-gray-300" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const initialTab = searchParams.get("tab") || "links";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onboarding, setOnboarding] = useState<{ open: boolean; prefill: OnboardingPrefill | null; saving: boolean }>({ open: false, prefill: null, saving: false });
  const [onboardingEmail, setOnboardingEmail] = useState<string | undefined>();

  // Sync URL when tab changes (so deep links to ?tab=settings work)
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      if (activeTab === "links") next.delete("tab");
      else next.set("tab", activeTab);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [analytics, setAnalytics] = useState({ views: 0, clicks: 0 });
  const { plan, planLabel, isPro, loading: planLoading } = usePlan(user?.id);

  // History stack for undo/redo of profile changes
  const [past, setPast] = useState<Profile[]>([]);
  const [future, setFuture] = useState<Profile[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);



  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load user data
  const loadData = useCallback(async (userId: string, userEmail?: string, userMetadata?: Record<string, any>) => {
    try {
      // Load profile
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const provider = (userMetadata?.provider as string) || (userMetadata?.iss?.includes("google") ? "google" : "unknown");
      const isOAuth = !!(userMetadata && (userMetadata.full_name || userMetadata.name || userMetadata.avatar_url || userMetadata.picture));

      // Compute the prefill suggestion using the pure helper (testable).
      const prefill = computeOnboardingPrefill({
        userId,
        email: userEmail,
        metadata: userMetadata as any,
        existing: profileData
          ? { username: profileData.username, title: profileData.title, avatar_url: profileData.avatar_url }
          : null,
      });

      const isNewUser = !profileData;

      // For a brand-new user, create the row immediately with the prefill so they
      // have a valid profile; then offer the confirm step on top.
      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            username: prefill.fields.username ?? `user_${userId.slice(0, 8)}`,
            title: prefill.fields.title ?? `@${prefill.fields.username ?? "creator"}`,
            avatar_url: prefill.fields.avatar_url ?? null,
          })
          .select()
          .single();
        if (createError) throw createError;
        profileData = newProfile;
        trackOnboarding("onboarding_started", { isNewUser: true, provider, prefill });
      }

      if (profileData) {
        setProfile({
          ...profileData,
          social_links: (profileData.social_links as SocialLinks) || {},
        } as Profile);
      }

      // Decide whether to open the confirm dialog (only when there's something to
      // confirm and the source is OAuth metadata — never for plain email signups
      // returning to the dashboard).
      const hasFieldsToConfirm = Object.keys(prefill.fields).length > 0;
      if (isOAuth && hasFieldsToConfirm) {
        setOnboardingEmail(userEmail);
        setOnboarding({ open: true, prefill, saving: false });
        trackOnboarding("onboarding_prefilled", { isNewUser, provider, prefill });
      } else if (isOAuth && isNewUser) {
        // OAuth user with nothing to prefill (rare) — still record completion.
        trackOnboarding("onboarding_started", { isNewUser: true, provider, prefill });
      }

      // Load links
      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (linksError) throw linksError;
      setLinks(linksData || []);

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("link_groups")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Load analytics
      if (profileData) {
        const { count: viewCount } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileData.id);

        const totalClicks = (linksData || []).reduce((sum, link) => sum + (link.click_count || 0), 0);
        setAnalytics({ views: viewCount || 0, clicks: totalClicks });
      }
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else if (session.user) {
        setTimeout(() => loadData(session.user.id, session.user.email, session.user.user_metadata as Record<string, any>), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else if (session.user) {
        loadData(session.user.id, session.user.email, session.user.user_metadata as Record<string, any>);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Profile operations
  const persistProfile = async (next: Profile, opts?: { silent?: boolean }) => {
    if (!user) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const dbUpdates = { ...next } as Record<string, unknown>;
      delete (dbUpdates as any).created_at;
      delete (dbUpdates as any).updated_at;
      const { error } = await supabase
        .from("profiles")
        .update(dbUpdates as never)
        .eq("id", next.id);
      if (error) throw error;
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      if (!opts?.silent) toast.success("Saved to your live page");
    } catch (error: any) {
      setSaveStatus("error");
      toast.error("Failed to update: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Debounced save: keeps the builder snappy by writing to the DB at most
  // once per idle window (600ms) instead of on every keystroke / toggle.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProfileRef = useRef<Profile | null>(null);

  const flushPendingProfile = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingProfileRef.current;
    pendingProfileRef.current = null;
    if (pending) await persistProfile(pending, { silent: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const queueProfileSave = useCallback((next: Profile) => {
    pendingProfileRef.current = next;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void flushPendingProfile(); }, 600);
  }, [flushPendingProfile]);

  // Flush on unmount / tab hide so nothing is lost.
  useEffect(() => {
    const onHide = () => { void flushPendingProfile(); };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
      void flushPendingProfile();
    };
  }, [flushPendingProfile]);

  const updateProfile = (updates: Partial<Profile>) => {
    if (!profile || !user) return;
    setPast((p) => [...p.slice(-29), profile]);
    setFuture([]);
    const next = { ...profile, ...updates } as Profile;
    setProfile(next); // optimistic UI
    queueProfileSave(next); // debounced DB write
  };

  const handleUndo = async () => {
    if (!profile || past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [profile, ...f].slice(0, 30));
    setProfile(prev);
    queueProfileSave(prev);
    toast.success("Undid last change");
  };

  const handleRedo = async () => {
    if (!profile || future.length === 0) return;
    const nxt = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p.slice(-29), profile]);
    setProfile(nxt);
    queueProfileSave(nxt);
    toast.success("Redid change");
  };

  const handleSaveNow = async () => {
    if (!profile) return;
    await flushPendingProfile();
    await persistProfile(profile);
  };


  // Link operations
  const addLink = async () => {
    if (!user) return;
    
    const newPosition = links.length;
    const { data, error } = await supabase
      .from("links")
      .insert({
        user_id: user.id,
        title: "New Link",
        url: "",
        position: newPosition,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add link: " + error.message);
      return;
    }

    setLinks([...links, data]);
    toast.success("Link added!");
  };

  const updateLink = async (id: string, updates: Partial<LinkItem>) => {
    const { error } = await supabase
      .from("links")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update link");
      return;
    }

    setLinks(links.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete link");
      return;
    }

    setLinks(links.filter(l => l.id !== id));
    toast.success("Link deleted!");
  };

  // Group operations
  const addGroup = async (name: string) => {
    if (!user) return;
    
    const newPosition = groups.length;
    const { data, error } = await supabase
      .from("link_groups")
      .insert({
        user_id: user.id,
        name,
        position: newPosition,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add group: " + error.message);
      return;
    }

    setGroups([...groups, data]);
    toast.success("Group created!");
  };

  const updateGroup = async (id: string, updates: Partial<LinkGroup>) => {
    const { error } = await supabase
      .from("link_groups")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update group");
      return;
    }

    setGroups(groups.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGroup = async (id: string) => {
    const { error } = await supabase
      .from("link_groups")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete group");
      return;
    }

    // Clear group_id from links that were in this group
    setLinks(links.map(l => l.group_id === id ? { ...l, group_id: null } : l));
    setGroups(groups.filter(g => g.id !== id));
    toast.success("Group deleted!");
  };

  // Drag and drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);

    const reorderedLinks = arrayMove(links, oldIndex, newIndex);
    
    // Update positions
    const updatedLinks = reorderedLinks.map((link, index) => ({
      ...link,
      position: index,
    }));

    setLinks(updatedLinks);

    // Persist to database
    try {
      const updates = updatedLinks.map(link => 
        supabase.from("links").update({ position: link.position }).eq("id", link.id)
      );
      await Promise.all(updates);
    } catch (error) {
      toast.error("Failed to save order");
      loadData(user!.id); // Reload to restore state
    }
  };

  const copyProfileUrl = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
    setCopied(true);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const selectedTheme = presetThemes.find(t => t.name === profile.theme_name) || presetThemes[0];
  
  // Compute preview gradient
  const previewGradient = profile.custom_bg_color 
    ? undefined 
    : profile.theme_gradient || selectedTheme.gradient;
  
  const previewStyle = profile.custom_bg_color ? {
    background: profile.custom_accent_color
      ? `linear-gradient(to bottom, ${profile.custom_bg_color}, ${profile.custom_accent_color})`
      : profile.custom_bg_color,
  } : undefined;

  const visibleLinks = links.filter(l => l.visible).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <PlanWelcomeDialog userId={user?.id} plan={plan} loading={planLoading} />
      <OnboardingConfirmDialog
        open={onboarding.open}
        prefill={onboarding.prefill}
        email={onboardingEmail}
        saving={onboarding.saving}
        onSkip={() => {
          trackOnboarding("onboarding_skipped", { isNewUser: false, provider: "google", prefill: onboarding.prefill ?? undefined });
          setOnboarding({ open: false, prefill: null, saving: false });
        }}
        onConfirm={async (values, edited) => {
          if (!user) return;
          setOnboarding((s) => ({ ...s, saving: true }));
          const { data: updated, error } = await supabase
            .from("profiles")
            .update({
              username: values.username,
              title: values.title,
              avatar_url: values.avatar_url,
            })
            .eq("user_id", user.id)
            .select()
            .single();
          if (error) {
            toast.error(error.message || "Could not save your profile");
            setOnboarding((s) => ({ ...s, saving: false }));
            return;
          }
          if (updated) {
            setProfile({ ...(updated as any), social_links: (updated.social_links as SocialLinks) || {} });
          }
          trackOnboarding(edited ? "onboarding_edited" : "onboarding_confirmed", {
            isNewUser: false,
            provider: "google",
            prefill: onboarding.prefill ?? undefined,
          });
          setOnboarding({ open: false, prefill: null, saving: false });
          toast.success("Profile saved");
        }}
      />
      {/* Header */}
      <header className="bg-background/70 backdrop-blur-xl border-b border-border/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <span className="text-primary-foreground font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-base tracking-tight">SmartCard</span>
            <span
              className={`hidden md:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                plan === "free"
                  ? "bg-muted text-muted-foreground"
                  : plan === "starter"
                  ? "bg-blue-500/15 text-blue-400"
                  : "gradient-primary text-primary-foreground shadow-glow"
              }`}
              title={`Account status: ${planLabel}`}
            >
              <Sparkles className="w-2.5 h-2.5" /> {planLabel}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="gradient" size="sm" onClick={copyProfileUrl} className="h-8 text-xs px-3">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
            </Button>
            <QRCodeGenerator username={profile.username} />
            <Link to={`/${profile.username}`} target="_blank">
              <Button variant="outline" size="sm" className="h-8 text-xs px-3">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-5">
        {/* Compact Stats Bar */}
        <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 sm:gap-2.5 mb-3 sm:mb-4">
          {[
            { label: "Views", value: analytics.views, icon: Eye, color: "text-blue-400", bg: "from-blue-500/10 to-blue-500/0" },
            { label: "Clicks", value: analytics.clicks, icon: MousePointerClick, color: "text-pink-400", bg: "from-pink-500/10 to-pink-500/0" },
            { label: "Links", value: visibleLinks, icon: Link2, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/0" },
            { label: "Groups", value: groups.length, icon: Folder, color: "text-amber-400", bg: "from-amber-500/10 to-amber-500/0" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className={`relative overflow-hidden rounded-lg sm:rounded-xl border border-border/60 bg-gradient-to-br ${stat.bg} bg-background/40 backdrop-blur-sm px-2 py-2 sm:p-3`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">{stat.label}</p>
                  <p className="text-base sm:text-xl font-bold mt-0.5 tabular-nums leading-none">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`hidden sm:flex w-8 h-8 rounded-lg bg-background/60 border border-border/40 items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <stat.icon className={`sm:hidden w-3.5 h-3.5 shrink-0 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>


        {/* Profile Share Card — desktop/tablet only; reduces mobile clutter */}
        <div className="hidden md:block">
          <ProfileShareCard username={profile.username} />
        </div>

        {/* Builder Layout: Left Nav | Edit Panel | Live Preview */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4 pb-20 md:pb-0">
          {/* Left: Vertical Builder Nav — hidden on mobile (replaced by bottom tab bar) */}
          <aside className="hidden md:flex lg:w-16 lg:flex-col gap-1 p-1.5 bg-background/60 backdrop-blur-sm rounded-xl border border-border/60 lg:sticky lg:top-20 lg:h-fit shadow-sm">
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`group relative flex-1 lg:flex-none flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{tab.label}</span>
                  {active && <span className="hidden lg:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary" />}
                </button>
              );
            })}
          </aside>

          {/* Middle: Edit / Builder Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-background/60 backdrop-blur-sm rounded-xl border border-border/60 shadow-sm overflow-hidden">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/60 bg-secondary/30 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {(() => {
                    const t = tabs.find(x => x.id === activeTab)!;
                    return <t.icon className="w-3.5 h-3.5 text-primary shrink-0" />;
                  })()}
                  <h2 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
                    {tabs.find(x => x.id === activeTab)?.label}
                    <span className="hidden sm:inline"> Builder</span>
                  </h2>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Autosave status pill — icon only on mobile */}
                  <div
                    data-testid="autosave-status"
                    className={`flex items-center gap-1 text-[10px] font-medium px-1.5 sm:px-2 py-1 rounded-full border transition-colors ${
                      saveStatus === "saving"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : saveStatus === "error"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : saveStatus === "saved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-secondary/60 text-muted-foreground border-border/60"
                    }`}
                  >
                    {saveStatus === "saving" && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="hidden sm:inline">Saving…</span>
                      </>
                    )}
                    {saveStatus === "saved" && (
                      <>
                        <Check className="w-3 h-3" />
                        <span className="hidden sm:inline">
                          {lastSavedAt
                            ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : "Saved"}
                        </span>
                      </>
                    )}
                    {saveStatus === "error" && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        <span className="hidden sm:inline">Save failed</span>
                      </>
                    )}
                    {saveStatus === "idle" && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        <span className="hidden sm:inline">Not saved yet</span>
                      </>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hidden sm:inline-flex"
                    onClick={handleUndo}
                    disabled={past.length === 0 || saving}
                    title="Undo (last profile change)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hidden sm:inline-flex"
                    onClick={handleRedo}
                    disabled={future.length === 0 || saving}
                    title="Redo"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    className="h-7 text-[11px] px-2 sm:px-2.5"
                    onClick={handleSaveNow}
                    disabled={saving}
                    title="Save & publish to your live page"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>

              </div>
              <div className="p-3 sm:p-4">

              {activeTab === "links" && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Group Manager */}
                  <LinkGroupManager
                    groups={groups}
                    onAddGroup={addGroup}
                    onUpdateGroup={updateGroup}
                    onDeleteGroup={deleteGroup}
                  />

                  <div className="border-t border-border pt-6">
                    <Button onClick={addLink} variant="gradient" className="w-full">
                      <Plus className="w-5 h-5" /> Add New Link
                    </Button>
                  </div>
                  
                  {links.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No links yet. Add your first link above!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Ungrouped Links */}
                      {links.filter(l => !l.group_id).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <Link2 className="w-4 h-4" />
                            Ungrouped Links
                          </p>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis]}
                          >
                            <SortableContext 
                              items={links.filter(l => !l.group_id).map(l => l.id)} 
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-3">
                                {links.filter(l => !l.group_id).map(link => (
                                  <SortableLinkItem
                                    key={link.id}
                                    link={link}
                                    onUpdate={updateLink}
                                    onDelete={deleteLink}
                                    groups={groups}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}

                      {/* Grouped Links */}
                      {groups.map(group => {
                        const groupLinks = links.filter(l => l.group_id === group.id);
                        if (groupLinks.length === 0 && !group.is_collapsed) return null;
                        
                        return (
                          <div key={group.id}>
                            <button
                              onClick={() => updateGroup(group.id, { is_collapsed: !group.is_collapsed })}
                              className="w-full flex items-center gap-2 text-sm font-medium mb-3 hover:text-primary transition-colors"
                            >
                              <Folder className="w-4 h-4 text-primary" />
                              <span>{group.name}</span>
                              <span className="text-xs text-muted-foreground">({groupLinks.length})</span>
                            </button>
                            
                            {!group.is_collapsed && groupLinks.length > 0 && (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis]}
                              >
                                <SortableContext 
                                  items={groupLinks.map(l => l.id)} 
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-3 ml-4 border-l-2 border-primary/20 pl-4">
                                    {groupLinks.map(link => (
                                      <SortableLinkItem
                                        key={link.id}
                                        link={link}
                                        onUpdate={updateLink}
                                        onDelete={deleteLink}
                                        groups={groups}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Avatar Upload */}
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={profile.avatar_url}
                    username={profile.username}
                    onUpload={(url) => updateProfile({ avatar_url: url })}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Profile Title</label>
                    <input 
                      value={profile.title} 
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      onBlur={(e) => updateProfile({ title: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-input bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Bio</label>
                    <textarea 
                      value={profile.bio || ""} 
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      onBlur={(e) => updateProfile({ bio: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-input bg-background text-sm resize-none" 
                      rows={2} 
                      maxLength={80} 
                      placeholder="Tell your audience about yourself..."
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{(profile.bio || "").length}/80 characters</p>
                  </div>

                  
                  {/* Social Links */}
                  <SocialLinksEditor
                    socialLinks={profile.social_links || {}}
                    onChange={(links) => setProfile({ ...profile, social_links: links })}
                    onBlur={() => updateProfile({ social_links: profile.social_links })}
                  />

                  {/* Theme Customizer */}
                  <ThemeCustomizer
                    themeName={profile.theme_name}
                    themeGradient={profile.theme_gradient}
                    customBgColor={profile.custom_bg_color}
                    customAccentColor={profile.custom_accent_color}
                    gradientDirection={profile.gradient_direction || "to-b"}
                    animationType={profile.animation_type}
                    animationSpeed={profile.animation_speed || 1}
                    animationIntensity={profile.animation_intensity || 1}
                    onUpdate={(updates) => {
                      setProfile({ ...profile, ...updates } as Profile);
                      updateProfile(updates as Partial<Profile>);
                    }}
                  />

                  {/* Favorite Presets */}
                  <div className="border-t border-border pt-6">
                    <FavoritePresets
                      userId={user.id}
                      currentTheme={{
                        theme_name: profile.theme_name,
                        theme_gradient: profile.theme_gradient,
                        custom_bg_color: profile.custom_bg_color,
                        custom_accent_color: profile.custom_accent_color,
                        gradient_direction: profile.gradient_direction || "to-b",
                        animation_type: profile.animation_type,
                        animation_speed: profile.animation_speed || 1,
                        animation_intensity: profile.animation_intensity || 1,
                      }}
                      onApply={(preset) => {
                        setProfile({ ...profile, ...preset } as Profile);
                        updateProfile(preset as Partial<Profile>);
                      }}
                    />
                  </div>

                  {/* Profile Templates */}
                  <div className="border-t border-border pt-6">
                    <ProfileTemplates
                      isPro={isPro}
                      plan={plan}
                      userId={profile.user_id}
                      currentThemeName={profile.theme_name}
                      initialAnimationSpeed={profile.animation_speed ?? 1}
                      initialMotionEnabled={profile.motion_enabled ?? true}
                      initialCustomBackground={
                        profile.custom_background_url
                          ? { url: profile.custom_background_url, type: (profile.custom_background_type as "image" | "video") || "image" }
                          : null
                      }
                      onPersist={(u) => setProfile({ ...profile, ...u } as Profile)}
                      onApply={(updates) => {
                        setProfile({ ...profile, ...updates } as Profile);
                        updateProfile(updates as Partial<Profile>);
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "analytics" && (
                <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading analytics…</div>}>
                  <AnalyticsCharts profileId={profile.id} links={links} />
                </Suspense>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 bg-secondary/50 rounded-xl">
                    <p className="font-medium mb-1.5 text-sm">Your SmartCard URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] sm:text-sm text-muted-foreground bg-background px-2.5 py-2 rounded-lg truncate">
                        {window.location.origin}/{profile.username}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyProfileUrl} className="shrink-0">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Username</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm text-muted-foreground shrink-0">smartcard.online/</span>
                      <input 
                        value={profile.username} 
                        onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                        onBlur={(e) => updateProfile({ username: e.target.value })}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-input bg-background text-sm" 
                      />
                    </div>
                  </div>


                  {/* Email Collection */}
                  <EmailSubscribers
                    profileId={profile.id}
                    emailCollectionEnabled={profile.email_collection_enabled || false}
                    onToggle={(enabled) => {
                      setProfile({ ...profile, email_collection_enabled: enabled });
                      updateProfile({ email_collection_enabled: enabled } as Partial<Profile>);
                    }}
                  />

                  {/* Account & Security moved to /settings */}
                </div>
              )}
              </div>
            </div>
          </div>


          {/* Preview Panel - iPhone Frame */}
          <div className="hidden lg:block lg:w-[360px] lg:sticky lg:top-20 lg:h-fit">
            <div className="bg-background/60 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Live Preview</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                  </span>
                  <Link to={`/${profile.username}`} target="_blank" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-2.5 h-2.5" /> Open
                  </Link>
                </div>
              </div>

              {/* iPhone Frame */}
              <div className="mx-auto" style={{ width: 280 }}>
                <div className="relative rounded-[2.75rem] bg-neutral-900 p-[10px] shadow-2xl ring-1 ring-white/10">
                  {/* Side buttons */}
                  <div className="absolute -left-[3px] top-24 w-[3px] h-8 rounded-l-md bg-neutral-700" />
                  <div className="absolute -left-[3px] top-36 w-[3px] h-12 rounded-l-md bg-neutral-700" />
                  <div className="absolute -left-[3px] top-52 w-[3px] h-12 rounded-l-md bg-neutral-700" />
                  <div className="absolute -right-[3px] top-32 w-[3px] h-16 rounded-r-md bg-neutral-700" />

                  {/* Screen */}
                  <div
                    className={`relative rounded-[2.25rem] overflow-hidden ${!previewStyle ? `bg-gradient-${profile.gradient_direction || 'to-b'} ${previewGradient}` : ''}`}
                    style={{ ...previewStyle, height: 560 }}
                  >
                    {/* Status bar */}
                    <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 pt-2 pb-1 text-[10px] font-semibold text-primary-foreground">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <span>●●●</span>
                        <span>􀙇</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Dynamic Island / Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-24 h-6 rounded-full bg-black" />

                    {/* Custom background media — instant preview of uploads */}
                    {profile.custom_background_url && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        {profile.custom_background_type === "video" ? (
                          <video
                            key={profile.custom_background_url}
                            src={profile.custom_background_url}
                            autoPlay muted loop playsInline
                            className="w-full h-full object-cover"
                            ref={(el) => { if (el) el.playbackRate = profile.animation_speed || 1; }}
                            onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
                          />
                        ) : (
                          <img
                            key={profile.custom_background_url}
                            src={profile.custom_background_url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/35" />
                      </div>
                    )}

                    {/* Animated bg — respects motion toggle */}
                    {profile.motion_enabled !== false && (
                      <div className="absolute inset-0 overflow-hidden">
                        <AnimatedBackground
                          animationType={profile.animation_type}
                          config={{ speed: profile.animation_speed || 1, intensity: profile.animation_intensity || 1 }}
                        />
                      </div>
                    )}

                    {/* Content - scrollable */}
                    <div className="absolute inset-0 pt-10 pb-4 px-4 overflow-y-auto scrollbar-hide">
                      <div className="text-center mb-4 relative z-10">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary-foreground/20 backdrop-blur mb-2 flex items-center justify-center overflow-hidden ring-2 ring-primary-foreground/20">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-primary-foreground">
                              {profile.username[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-bold text-primary-foreground">{profile.title}</h2>
                        {profile.bio && (
                          <p className="text-primary-foreground/70 text-[11px] mt-1 px-2">{profile.bio}</p>
                        )}
                        <SocialIcons socialLinks={profile.social_links || {}} />
                      </div>
                      <div className="space-y-2 relative z-10">
                        {links.filter(l => l.visible).map(link => (
                          <div key={link.id} className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-primary-foreground/20 backdrop-blur">
                            {link.thumbnail_url && (
                              <img src={link.thumbnail_url} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                            )}
                            <span className="flex-1 text-primary-foreground font-medium text-center text-[11px]">
                              {link.title || "Untitled Link"}
                            </span>
                            {link.thumbnail_url && <div className="w-6" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-primary-foreground/70 z-30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileTabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
