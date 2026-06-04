import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface PlanStatusBadgeProps {
  userId?: string;
  className?: string;
}

const PRICING_TARGET = "/smartlink-bio#pricing";

export function PlanStatusBadge({ userId, className }: PlanStatusBadgeProps) {
  const { plan, planLabel, loading } = usePlan(userId);
  const navigate = useNavigate();
  const location = useLocation();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!userId || loading) return null;

  const handleClick = () => {
    trackEvent("plan_badge_click", {
      plan,
      authed: !!authed,
      from: `${location.pathname}${location.search}`,
    });

    if (!authed) {
      navigate(`/login?returnTo=${encodeURIComponent(PRICING_TARGET)}`);
      return;
    }
    navigate(PRICING_TARGET);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer",
        plan === "free" && "bg-muted text-muted-foreground hover:bg-muted/80",
        plan === "starter" && "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
        plan !== "free" && plan !== "starter" && "gradient-primary text-primary-foreground shadow-glow",
        className,
      )}
      title={plan === "free" ? "View SmartLink Bio pricing — unlock premium" : `Plan: ${planLabel}`}
      aria-label={`Plan: ${planLabel}. Click to view pricing.`}
    >
      <Sparkles className="w-2.5 h-2.5" /> {planLabel}
    </button>
  );
}
