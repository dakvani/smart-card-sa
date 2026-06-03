import { Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

interface PlanStatusBadgeProps {
  userId?: string;
  className?: string;
}

export function PlanStatusBadge({ userId, className }: PlanStatusBadgeProps) {
  const { plan, planLabel, loading } = usePlan(userId);
  if (!userId || loading) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
        plan === "free" && "bg-muted text-muted-foreground",
        plan === "starter" && "bg-blue-500/15 text-blue-400",
        plan !== "free" && plan !== "starter" && "gradient-primary text-primary-foreground shadow-glow",
        className,
      )}
      title={`Account status: ${planLabel}`}
      aria-label={`Plan: ${planLabel}`}
    >
      <Sparkles className="w-2.5 h-2.5" /> {planLabel}
    </span>
  );
}
