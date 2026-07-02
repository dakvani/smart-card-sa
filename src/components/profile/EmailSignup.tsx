import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, Check, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email({ message: "Please enter a valid email" });

interface EmailSignupProps {
  profileId: string;
}

export function EmailSignup({ profileId }: EmailSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("email_subscribers").insert({
        profile_id: profileId,
        email: email.toLowerCase().trim(),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You're already subscribed!");
        } else {
          throw error;
        }
        return;
      }

      // Log a share/engagement event for dashboard analytics (fire-and-forget).
      supabase
        .from("profile_share_events")
        .insert({
          profile_id: profileId,
          channel: "subscribe_submit",
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .then(({ error: evErr }) => {
          if (evErr) console.warn("subscribe event failed:", evErr.message);
        });

      setSubscribed(true);
      toast.success("Successfully subscribed!");
    } catch (error: any) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-primary-foreground/15 border border-primary-foreground/20 text-primary-foreground text-[10px]">
        <Check className="w-3 h-3 text-green-400" />
        <span>Subscribed</span>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur border border-primary-foreground/20 text-primary-foreground text-[10px] font-semibold transition-colors"
      >
        <Mail className="w-3 h-3" />
        Subscribe
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="inline-flex items-center h-6 pl-2 pr-0.5 rounded-full bg-primary-foreground/15 backdrop-blur border border-primary-foreground/20"
    >
      <Mail className="w-3 h-3 text-primary-foreground/70 shrink-0" />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        autoFocus
        className="w-32 h-full bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-[10px] px-1.5"
        required
        maxLength={255}
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Submit email"
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-foreground text-background hover:bg-primary-foreground/90 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ArrowRight className="w-2.5 h-2.5" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setExpanded(false);
          setEmail("");
        }}
        aria-label="Cancel"
        className="ml-0.5 p-0.5 text-primary-foreground/60 hover:text-primary-foreground"
      >
        <X className="w-3 h-3" />
      </button>
    </form>
  );
}
