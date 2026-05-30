import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProRequest {
  id: string;
  user_id: string;
  requested_plan: string;
  status: string;
  feature_context: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface ProfileRow {
  user_id: string;
  username: string;
  title: string | null;
  plan: string;
}

export function AdminProRequests() {
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: reqs } = await supabase
      .from("pro_upgrade_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (reqs as ProRequest[]) || [];
    setRequests(list);

    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, title, plan")
        .in("user_id", ids);
      const map: Record<string, ProfileRow> = {};
      (profs as ProfileRow[] | null)?.forEach((p) => (map[p.user_id] = p));
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-pro-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pro_upgrade_requests" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const decide = async (req: ProRequest, decision: "approved" | "rejected", newPlan?: string) => {
    setBusy(req.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const planToApply = newPlan || req.requested_plan;

      const { error: upErr } = await supabase
        .from("pro_upgrade_requests")
        .update({
          status: decision,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          admin_note: decision === "approved" ? `Set plan to ${planToApply}` : "Rejected",
        } as any)
        .eq("id", req.id);
      if (upErr) throw upErr;

      if (decision === "approved") {
        const { error: pErr } = await supabase
          .from("profiles")
          .update({ plan: planToApply } as any)
          .eq("user_id", req.user_id);
        if (pErr) throw pErr;
      }

      toast.success(decision === "approved" ? `Set to ${planToApply}` : "Request rejected");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  const renderCard = (r: ProRequest, allowActions: boolean) => {
    const p = profiles[r.user_id];
    return (
      <Card key={r.id} className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">
                  {p?.title || p?.username || r.user_id.slice(0, 8)}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  current: {p?.plan || "free"}
                </Badge>
                <Badge
                  variant={r.status === "pending" ? "default" : r.status === "approved" ? "secondary" : "destructive"}
                  className="text-[10px] uppercase"
                >
                  {r.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Requested <span className="font-medium">{r.requested_plan}</span>
                {r.feature_context && <> · for <em>{r.feature_context}</em></>}
                {" · "}
                {format(new Date(r.created_at), "MMM d, HH:mm")}
              </p>
              {r.admin_note && (
                <p className="text-xs text-muted-foreground mt-1 italic">Note: {r.admin_note}</p>
              )}
            </div>

            {allowActions && (
              <div className="flex items-center gap-2 flex-wrap">
                <PlanPicker
                  defaultValue={r.requested_plan}
                  onApprove={(plan) => decide(r, "approved", plan)}
                  disabled={busy === r.id}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide(r, "rejected")}
                  disabled={busy === r.id}
                  className="h-8"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Pending Pro requests
            {pending.length > 0 && (
              <Badge variant="default" className="ml-1">{pending.length}</Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={load} className="h-8">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
          ) : (
            pending.map((r) => renderCard(r, true))
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.slice(0, 25).map((r) => renderCard(r, false))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlanPicker({
  defaultValue,
  onApprove,
  disabled,
}: {
  defaultValue: string;
  onApprove: (plan: string) => void;
  disabled: boolean;
}) {
  const [plan, setPlan] = useState(defaultValue || "pro");
  return (
    <div className="flex items-center gap-1">
      <Select value={plan} onValueChange={setPlan}>
        <SelectTrigger className="h-8 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="pro_plus">Pro Plus</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
          <SelectItem value="lifetime">Lifetime</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="gradient"
        onClick={() => onApprove(plan)}
        disabled={disabled}
        className="h-8"
      >
        <Check className="w-3.5 h-3.5" /> Approve
      </Button>
    </div>
  );
}
