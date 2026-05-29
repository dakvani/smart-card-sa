import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserPlan = "free" | "pro";

export function usePlan(userId?: string) {
  const [plan, setPlan] = useState<UserPlan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", userId)
        .maybeSingle();
      if (active) {
        setPlan(((data as any)?.plan as UserPlan) || "free");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return { plan, isPro: plan === "pro", loading };
}
