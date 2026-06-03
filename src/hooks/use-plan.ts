import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserPlan = "free" | "starter" | "pro" | "pro_plus" | "business" | "enterprise" | "lifetime";

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  pro_plus: "Pro Plus",
  business: "Business",
  enterprise: "Enterprise",
  lifetime: "Lifetime",
};

export function usePlan(userId?: string) {
  const [plan, setPlan] = useState<UserPlan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPlan("free");
      setLoading(false);
      return;
    }
    let active = true;

    const fetchPlan = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", userId)
        .maybeSingle();
      if (active) {
        setPlan(((data as any)?.plan as UserPlan) || "free");
        setLoading(false);
      }
    };

    fetchPlan();

    // Realtime: react instantly when admin updates this user's plan
    const channel = supabase
      .channel(`profile-plan-${userId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = ((payload.new as any)?.plan as UserPlan) || "free";
          if (active) setPlan(next);
        },
      )
      .subscribe();

    // Poll as a safety net (covers cases where realtime isn't enabled on the table)
    const interval = window.setInterval(fetchPlan, 20000);

    // Re-fetch when the tab becomes visible (e.g. user returns after admin approval)
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchPlan();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);

  return { plan, planLabel: PLAN_LABELS[plan] ?? "Free", isPro: plan !== "free", loading };
}
