import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSAR } from "@/lib/currency";

export type AdminNotificationKind =
  | "pro_request"
  | "order"
  | "new_account"
  | "contact";

export interface AdminNotification {
  id: string; // entity id
  kind: AdminNotificationKind;
  title: string;
  description: string;
  created_at: string;
  meta?: Record<string, any>;
}

interface ProRequestRow {
  id: string;
  user_id: string;
  requested_plan: string;
  feature_context: string | null;
  created_at: string;
  status: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  shipping_info: any;
}

/**
 * Loads pending Pro upgrade requests and pending NFC orders, minus the items
 * the current admin has dismissed. Subscribes to realtime changes on all three
 * source tables so the bell stays in sync.
 */
export function useAdminNotifications(isAdmin: boolean) {
  const { toast } = useToast();
  const [adminId, setAdminId] = useState<string | undefined>();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id));
  }, []);

  const refresh = useCallback(async () => {
    if (!isAdmin || !adminId) return;
    setLoading(true);

    // Look-back window for new-account / contact notifications so the bell
    // doesn't fill up with historical rows.
    const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [proRes, orderRes, accountRes, contactRes, dismissRes] = await Promise.all([
      supabase
        .from("pro_upgrade_requests")
        .select("id,user_id,requested_plan,feature_context,created_at,status")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("nfc_orders")
        .select("id,order_number,total,status,created_at,shipping_info")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id,user_id,username,title,created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("contact_submissions")
        .select("id,name,email,inquiry_type,status,created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("admin_notification_dismissals")
        .select("entity_type,entity_id")
        .eq("admin_user_id", adminId),
    ]);

    const dismissed = new Set(
      ((dismissRes.data as any[]) || []).map((d) => `${d.entity_type}:${d.entity_id}`),
    );

    // Load usernames for pro requests
    const proRows = ((proRes.data as ProRequestRow[]) || []).filter(
      (r) => !dismissed.has(`pro_request:${r.id}`),
    );
    let usernameMap: Record<string, string> = {};
    if (proRows.length) {
      const ids = [...new Set(proRows.map((r) => r.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,username")
        .in("user_id", ids);
      (profs as any[] | null)?.forEach((p) => (usernameMap[p.user_id] = p.username));
    }

    const proNotifs: AdminNotification[] = proRows.map((r) => ({
      id: r.id,
      kind: "pro_request",
      title: `Pro request from @${usernameMap[r.user_id] || r.user_id.slice(0, 6)}`,
      description: `Wants ${r.requested_plan}${r.feature_context ? ` · ${r.feature_context}` : ""}`,
      created_at: r.created_at,
      meta: { user_id: r.user_id, requested_plan: r.requested_plan },
    }));

    const orderNotifs: AdminNotification[] = ((orderRes.data as OrderRow[]) || [])
      .filter((o) => !dismissed.has(`order:${o.id}`))
      .map((o) => {
        const ship =
          typeof o.shipping_info === "string"
            ? (() => {
                try { return JSON.parse(o.shipping_info); } catch { return {}; }
              })()
            : o.shipping_info || {};
        return {
          id: o.id,
          kind: "order" as const,
          title: `New order #${o.order_number}`,
          description: `${ship?.name || "Customer"} · ${formatSAR(Number(o.total))}`,
          created_at: o.created_at,
          meta: { order_number: o.order_number, total: o.total },
        };
      });

    const accountNotifs: AdminNotification[] = ((accountRes.data as any[]) || [])
      .filter((p) => !dismissed.has(`new_account:${p.id}`))
      .map((p) => ({
        id: p.id,
        kind: "new_account" as const,
        title: `New account @${p.username}`,
        description: p.title || "Just signed up",
        created_at: p.created_at,
        meta: { user_id: p.user_id, username: p.username },
      }));

    const contactNotifs: AdminNotification[] = ((contactRes.data as any[]) || [])
      .filter((c) => !dismissed.has(`contact:${c.id}`))
      .map((c) => ({
        id: c.id,
        kind: "contact" as const,
        title: `New contact: ${c.name}`,
        description: `${c.inquiry_type || "general"} · ${c.email}`,
        created_at: c.created_at,
        meta: { email: c.email, inquiry_type: c.inquiry_type },
      }));

    const all = [...proNotifs, ...orderNotifs, ...accountNotifs, ...contactNotifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    knownIdsRef.current = new Set(all.map((n) => `${n.kind}:${n.id}`));
    setItems(all);
    setLoading(false);
  }, [isAdmin, adminId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Helper: fire a browser/web notification if permission granted
  const webNotify = (title: string, body: string) => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico", tag: title });
      }
    } catch {}
  };

  // Realtime: any change to source tables or dismissals triggers a refresh.
  // Toast + browser notification on truly new pending items (not seen before).
  useEffect(() => {
    if (!isAdmin || !adminId) return;

    const channel = supabase
      .channel(`admin-notifications-${adminId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pro_upgrade_requests" },
        (payload) => {
          const row: any = payload.new || payload.old;
          if (
            payload.eventType === "INSERT" &&
            row?.status === "pending" &&
            !knownIdsRef.current.has(`pro_request:${row.id}`)
          ) {
            toast({
              title: "✨ New Pro upgrade request",
              description: "Open the bell to review.",
            });
            webNotify("✨ New Pro upgrade request", `Plan: ${row.requested_plan}`);
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nfc_orders" },
        (payload) => {
          const row: any = payload.new || payload.old;
          if (
            payload.eventType === "INSERT" &&
            row?.status === "pending" &&
            !knownIdsRef.current.has(`order:${row.id}`)
          ) {
            toast({
              title: "🛒 New order",
              description: `Order #${row.order_number} · ${formatSAR(Number(row.total))}`,
            });
            webNotify("🛒 New order", `#${row.order_number} · ${formatSAR(Number(row.total))}`);
          } else if (
            payload.eventType === "UPDATE" &&
            (payload.new as any)?.status !== (payload.old as any)?.status
          ) {
            const ord = payload.new as any;
            toast({
              title: `📦 Order #${ord.order_number} → ${ord.status}`,
              description: `${formatSAR(Number(ord.total))}`,
            });
            webNotify(`Order #${ord.order_number} updated`, `Now ${ord.status}`);
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const row: any = payload.new;
          if (row && !knownIdsRef.current.has(`new_account:${row.id}`)) {
            toast({
              title: "👤 New account",
              description: `@${row.username} just signed up`,
            });
            webNotify("👤 New account", `@${row.username}`);
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_submissions" },
        (payload) => {
          const row: any = payload.new;
          if (row && !knownIdsRef.current.has(`contact:${row.id}`)) {
            toast({
              title: "✉️ New contact submission",
              description: `${row.name} · ${row.inquiry_type || "general"}`,
            });
            webNotify("✉️ New contact submission", `${row.name} — ${row.email}`);
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_notification_dismissals",
          filter: `admin_user_id=eq.${adminId}`,
        },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, adminId, refresh, toast]);

  const dismiss = useCallback(
    async (n: AdminNotification) => {
      if (!adminId) return;
      // Optimistic
      setItems((prev) => prev.filter((it) => !(it.id === n.id && it.kind === n.kind)));
      const { error } = await supabase.from("admin_notification_dismissals").insert({
        admin_user_id: adminId,
        entity_type: n.kind,
        entity_id: n.id,
      } as any);
      if (error && !error.message.includes("duplicate")) {
        toast({ title: "Could not dismiss", description: error.message, variant: "destructive" });
        refresh();
      }
    },
    [adminId, refresh, toast],
  );

  const dismissAll = useCallback(async () => {
    if (!adminId || items.length === 0) return;
    const rows = items.map((n) => ({
      admin_user_id: adminId,
      entity_type: n.kind,
      entity_id: n.id,
    }));
    setItems([]);
    const { error } = await supabase
      .from("admin_notification_dismissals")
      .insert(rows as any);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Could not clear", description: error.message, variant: "destructive" });
      refresh();
    }
  }, [adminId, items, refresh, toast]);

  const proCount = items.filter((i) => i.kind === "pro_request").length;
  const orderCount = items.filter((i) => i.kind === "order").length;

  return {
    items,
    loading,
    total: items.length,
    proCount,
    orderCount,
    dismiss,
    dismissAll,
    refresh,
  };
}
