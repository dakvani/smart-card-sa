import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePendingProRequests(isAdmin: boolean) {
  const { toast } = useToast();
  const [count, setCount] = useState(0);
  const lastNotifiedRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    const { count: c } = await supabase
      .from("pro_upgrade_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setCount(c || 0);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    refresh();

    const channel = supabase
      .channel("admin-pro-pending")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pro_upgrade_requests" },
        (payload) => {
          refresh();
          if (payload.eventType === "INSERT") {
            toast({
              title: "✨ New Pro upgrade request",
              description: "A user is requesting Pro access — review it now.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, refresh, toast]);

  // Re-notify periodically while there are pending requests so admin keeps seeing it
  useEffect(() => {
    if (!isAdmin || count === 0) return;
    // Initial reminder on login (after small delay)
    const initial = setTimeout(() => {
      toast({
        title: `⚠️ ${count} pending Pro request${count > 1 ? "s" : ""}`,
        description: "Action needed — open the Pro tab to review.",
      });
      lastNotifiedRef.current = Date.now();
    }, 1200);

    const interval = setInterval(() => {
      toast({
        title: `⏰ Still ${count} pending Pro request${count > 1 ? "s" : ""}`,
        description: "Approve, modify or reject from the Pro tab.",
      });
    }, 60_000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [isAdmin, count, toast]);

  return { count, refresh };
}
