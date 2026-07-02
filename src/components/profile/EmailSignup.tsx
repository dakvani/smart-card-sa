import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, Check, X } from "lucide-react";
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
      const { error } = await supabase
        .from("email_subscribers")
        .insert({
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
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-[11px]">
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur border border-primary-foreground/20 text-primary-foreground text-[11px] font-medium transition-colors"
      >
        <Mail className="w-3 h-3" />
        Subscribe
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="inline-flex items-center gap-1 p-1 rounded-full bg-primary-foreground/15 backdrop-blur border border-primary-foreground/20"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        autoFocus
        className="w-40 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-[11px] px-2.5"
        required
        maxLength={255}
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-foreground text-background text-[11px] font-semibold hover:bg-primary-foreground/90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
      </button>
      <button
        type="button"
        onClick={() => {
          setExpanded(false);
          setEmail("");
        }}
        className="p-1 text-primary-foreground/60 hover:text-primary-foreground"
        aria-label="Cancel"
      >
        <X className="w-3 h-3" />
      </button>
    </form>
  );
}
