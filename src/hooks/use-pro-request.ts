import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProRequestStatus = "pending" | "approved" | "rejected" | null;

export function useProRequest(userId?: string) {
  const [status, setStatus] = useState<ProRequestStatus>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("pro_upgrade_requests")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setStatus(((data as any)?.status as ProRequestStatus) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPro = async (feature?: string) => {
    if (!userId) throw new Error("Not signed in");
    const { error } = await supabase.from("pro_upgrade_requests").insert({
      user_id: userId,
      requested_plan: "pro",
      status: "pending",
      feature_context: feature ?? null,
    } as any);
    if (error && !error.message.includes("duplicate")) throw error;
    setStatus("pending");
  };

  return { status, loading, requestPro, refresh };
}
