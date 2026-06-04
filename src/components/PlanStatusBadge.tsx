import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

interface PlanStatusBadgeProps {
  userId?: string;
  className?: string;
}

export function PlanStatusBadge({ userId, className }: PlanStatusBadgeProps) {
  const { plan, planLabel, loading } = usePlan(userId);
  const navigate = useNavigate();
  if (!userId || loading) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/smartlink-bio#pricing")}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer",
        plan === "free" && "bg-muted text-muted-foreground hover:bg-muted/80",
        plan === "starter" && "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
        plan !== "free" && plan !== "starter" && "gradient-primary text-primary-foreground shadow-glow",
        className,
      )}
      title={plan === "free" ? "View pricing — unlock premium" : `Plan: ${planLabel}`}
      aria-label={`Plan: ${planLabel}. Click to view pricing.`}
    >
      <Sparkles className="w-2.5 h-2.5" /> {planLabel}
    </button>
  );
}
