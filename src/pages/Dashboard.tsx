import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Plus, ExternalLink, LogOut, BarChart3, Palette, Settings as SettingsIcon, Link2, Loader2, Copy, Check, Folder } from "lucide-react";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { SocialLinksEditor, SocialLinks } from "@/components/dashboard/SocialLinksEditor";
import { SortableLinkItem } from "@/components/dashboard/SortableLinkItem";
import { SocialIcons } from "@/components/profile/SocialIcons";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { AnimatedBackground } from "@/components/profile/AnimatedBackground";
import { ThemeCustomizer } from "@/components/dashboard/ThemeCustomizer";
import { QRCodeGenerator } from "@/components/dashboard/QRCodeGenerator";
import { ProfileShareCard } from "@/components/dashboard/ProfileShareCard";
import { EmailSubscribers } from "@/components/dashboard/EmailSubscribers";
import { ProfileTemplates } from "@/components/dashboard/ProfileTemplates";
import { LinkGroupManager, LinkGroup } from "@/components/dashboard/LinkGroupManager";
import { FavoritePresets } from "@/components/dashboard/FavoritePresets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState("links");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [analytics, setAnalytics] = useState({ views: 0, clicks: 0 });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load user data
  const loadData = useCallback(async (userId: string, userEmail?: string) => {
    try {
      // Load profile
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // If no profile exists, create one
      if (!profileData) {
        const username = userEmail?.split('@')[0]?.replace(/[^a-z0-9-_]/gi, '') || `user_${userId.slice(0, 8)}`;
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            username,
            title: `@${username}`,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        profileData = newProfile;
      }
      
      if (profileData) {
        setProfile({
          ...profileData,
          social_links: (profileData.social_links as SocialLinks) || {},
        });
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
        setTimeout(() => loadData(session.user.id, session.user.email), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else if (session.user) {
        loadData(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Profile operations
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile || !user) return;
    setSaving(true);
    
    try {
      // Convert social_links to JSON-compatible format for Supabase
      const dbUpdates = { ...updates } as Record<string, unknown>;
      if (updates.social_links) {
        dbUpdates.social_links = updates.social_links as Record<string, string>;
      }

      const { error } = await supabase
        .from("profiles")
        .update(dbUpdates as never)
        .eq("id", profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...updates });
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl">SmartCard</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="gradient" size="sm" onClick={copyProfileUrl}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
            </Button>
            <QRCodeGenerator username={profile.username} />
            <Link to={`/${profile.username}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Share Card - Prominent at top */}
        <ProfileShareCard username={profile.username} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Editor Panel */}
          <div className="flex-1 lg:w-[60%]">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-background rounded-xl border border-border mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-background rounded-2xl border border-border p-6">
              {activeTab === "links" && (
                <div className="space-y-6">
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
                    <div className="space-y-6">
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
                <div className="space-y-6">
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
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea 
                      value={profile.bio || ""} 
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      onBlur={(e) => updateProfile({ bio: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background resize-none" 
                      rows={2} 
                      maxLength={80} 
                      placeholder="Tell your audience about yourself..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">{(profile.bio || "").length}/80 characters</p>
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
                      currentThemeName={profile.theme_name}
                      onApply={(updates) => {
                        setProfile({ ...profile, ...updates } as Profile);
                        updateProfile(updates as Partial<Profile>);
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "analytics" && (
                <AnalyticsCharts profileId={profile.id} links={links} />
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <p className="font-medium mb-1">Your SmartCard URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-muted-foreground bg-background px-3 py-2 rounded-lg">
                        {window.location.origin}/{profile.username}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyProfileUrl}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">smartcard.online/</span>
                      <input 
                        value={profile.username} 
                        onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                        onBlur={(e) => updateProfile({ username: e.target.value })}
                        className="flex-1 px-4 py-2 rounded-lg border border-input bg-background" 
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

                  {/* Account Settings Link */}
                  <div className="border-t border-border pt-6">
                    <Link to="/settings">
                      <Button variant="outline" className="w-full">
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Account Settings (Email & Password)
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:w-[40%] lg:sticky lg:top-24 lg:h-fit">
            <div className="bg-background rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground text-center mb-4">Live Preview</p>
              <div 
                className={`rounded-[2rem] p-6 min-h-[600px] overflow-hidden relative ${!previewStyle ? `bg-gradient-${profile.gradient_direction || 'to-b'} ${previewGradient}` : ''}`}
                style={previewStyle}
              >
                {/* Animated Background Preview */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
                  <AnimatedBackground 
                    animationType={profile.animation_type} 
                    config={{ speed: profile.animation_speed || 1, intensity: profile.animation_intensity || 1 }}
                  />
                </div>
                
                <div className="text-center mb-6 relative z-10">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary-foreground/20 backdrop-blur mb-3 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary-foreground">
                        {profile.username[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-primary-foreground">{profile.title}</h2>
                  {profile.bio && (
                    <p className="text-primary-foreground/70 text-sm mt-1">{profile.bio}</p>
                  )}
                  <SocialIcons socialLinks={profile.social_links || {}} />
                </div>
                <div className="space-y-3 relative z-10">
                  {links.filter(l => l.visible).map(link => (
                    <div key={link.id} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-primary-foreground/20 backdrop-blur">
                      {link.thumbnail_url && (
                        <img src={link.thumbnail_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <span className="flex-1 text-primary-foreground font-medium text-center text-sm">
                        {link.title || "Untitled Link"}
                      </span>
                      {link.thumbnail_url && <div className="w-8" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
