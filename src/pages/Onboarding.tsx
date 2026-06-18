import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useUsernameCheck } from "@/hooks/use-username-check";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { Check, Instagram, Twitter, Youtube, Facebook, Linkedin, Github, Music, MessageCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";
import { SEO } from "@/components/SEO";

interface ProfileLite {
  id: string;
  user_id: string;
  username: string;
  title: string;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
}

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "twitter", label: "X / Twitter", icon: Twitter },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "tiktok", label: "TikTok", icon: Music },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "github", label: "GitHub", icon: Github },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [username, setUsername] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isChecking, isTaken, suggestions, hasChecked } = useUsernameCheck(username);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      if (cancelled) return;
      if (!data) {
        // Should not happen — handle_new_user trigger creates the row
        navigate("/admin/links");
        return;
      }
      if (data.onboarded) {
        navigate("/admin/links");
        return;
      }
      setProfile(data as any);
      setUsername(data.username || "");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const saveStep = async (patch: Partial<ProfileLite>) => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(patch as any).eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    setProfile({ ...profile, ...patch });
    return true;
  };

  const finish = async () => {
    const social = picked.reduce<Record<string, string>>((acc, p) => ({ ...acc, [p]: "" }), {});
    const { error } = await supabase.from("profiles").update({ onboarded: true, social_links: social } as any).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }
    navigate("/admin/links");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEO title="Set up your SmartCard" description="Welcome to SmartCard" path="/onboarding" />
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2"><SmartCardLogo className="w-7 h-7" /><span className="font-semibold">SmartCard</span></div>
        <button onClick={() => navigate("/admin/links")} className="text-xs text-muted-foreground hover:text-foreground">Skip</button>
      </header>

      <div className="max-w-md mx-auto px-6 pt-6 pb-24">
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold text-center">Pick your SmartCard URL</h1>
            <p className="text-sm text-muted-foreground text-center">This is your shareable link.</p>
            <div className="rounded-lg border border-input bg-background p-3 flex items-center text-sm">
              <span className="text-muted-foreground">smartcardsa.shop/</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="flex-1 bg-transparent focus:outline-none ml-1"
                placeholder="yourname"
                autoFocus
              />
              {hasChecked && username.length > 2 && (
                isTaken ? <span className="text-xs text-destructive">Taken</span> : <Check className="w-4 h-4 text-emerald-500" />
              )}
              {isChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {isTaken && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((s) => (
                  <button key={s} onClick={() => setUsername(s)} className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={!username || isChecking || isTaken || saving}
              onClick={async () => {
                if (await saveStep({ username })) next();
              }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold text-center">Which platforms are you on?</h1>
            <p className="text-sm text-muted-foreground text-center">Pick a few — you can edit them later.</p>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const active = picked.includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => setPicked((v) => (active ? v.filter((x) => x !== p.key) : [...v, p.key]))}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      active ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${active ? "text-primary" : ""}`} />
                    <span className="text-[10px] font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={back} className="flex-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
              <Button variant="gradient" onClick={next} className="flex-1">Continue <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold text-center">Add a profile photo</h1>
            <p className="text-sm text-muted-foreground text-center">First impressions matter.</p>
            <div className="flex justify-center py-4">
              <AvatarUpload
                userId={profile.user_id}
                username={profile.username}
                currentAvatarUrl={profile.avatar_url}
                onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
              />
            </div>
            <input
              value={profile.title || ""}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              placeholder="Your display name"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-center"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={back} className="flex-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
              <Button
                variant="gradient"
                onClick={async () => { if (await saveStep({ avatar_url: profile.avatar_url, title: profile.title })) next(); }}
                disabled={saving}
                className="flex-1"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 text-center">
            <h1 className="text-2xl font-semibold">Looking good!</h1>
            <p className="text-sm text-muted-foreground">Your SmartCard is off to a great start.</p>
            <div className="mx-auto w-[260px] rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6 text-white">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto object-cover ring-2 ring-white/40" />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto bg-white/10 ring-2 ring-white/30" />
              )}
              <div className="mt-3 font-semibold">{profile.title || `@${profile.username}`}</div>
              <div className="text-xs text-white/70">smartcardsa.shop/{profile.username}</div>
            </div>
            <Button variant="gradient" size="lg" className="w-full" onClick={finish}>
              Continue building
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
