import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PromoSettings {
  enabled: boolean;
  start_count: number;
  max_count: number;
  current_count: number;
  popup_title: string;
  popup_message: string;
}

const DEFAULTS: PromoSettings = {
  enabled: true,
  start_count: 10,
  max_count: 100,
  current_count: 10,
  popup_title: "Premium request received!",
  popup_message:
    "Your request for premium access has been sent to SmartCard. You're #{n} of our limited free upgrade slots — first 100 customers get premium free!",
};

export function usePromoSettings() {
  const [settings, setSettings] = useState<PromoSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("promo_settings" as any)
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) setSettings(data as unknown as PromoSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("promo-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promo_settings" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const update = async (patch: Partial<PromoSettings>) => {
    const { error } = await supabase
      .from("promo_settings" as any)
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq("id", 1);
    if (error) throw error;
    await refresh();
  };

  return { settings, loading, refresh, update };
}

export function formatPromoMessage(template: string, n: number) {
  return template.replace(/#\{n\}|\{n\}/g, String(n));
}
