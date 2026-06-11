import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Mail, CheckCircle2, AlertCircle, Clock, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";

interface ProfileRow {
  id: string;
  user_id: string;
  username: string | null;
  welcome_email_sent_at: string | null;
  welcome_email_attempts: number | null;
  welcome_email_last_error: string | null;
  welcome_email_last_attempt_at: string | null;
  created_at: string;
}

interface LogRow {
  id: string;
  message_id: string | null;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

type StatusFilter = "all" | "sent" | "failed" | "pending";

export function AdminWelcomeEmails() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [logsById, setLogsById] = useState<Record<string, LogRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select(
          "id, user_id, username, welcome_email_sent_at, welcome_email_attempts, welcome_email_last_error, welcome_email_last_attempt_at, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500);

      const { data: logRows } = await supabase
        .from("email_send_log")
        .select("id, message_id, recipient_email, status, error_message, created_at")
        .eq("template_name", "welcome")
        .order("created_at", { ascending: false })
        .limit(1000);

      // Dedupe by message_id - keep newest. We'll key the lookup map by recipient_email.
      const byEmail: Record<string, LogRow> = {};
      (logRows || []).forEach((r) => {
        const key = r.recipient_email.toLowerCase();
        if (!byEmail[key]) byEmail[key] = r as LogRow;
      });

      setProfiles((profileRows as ProfileRow[]) || []);
      setLogsById(byEmail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    let sent = 0;
    let failed = 0;
    let pending = 0;
    profiles.forEach((p) => {
      if (p.welcome_email_sent_at) sent++;
      else if (p.welcome_email_last_error) failed++;
      else pending++;
    });
    return { total: profiles.length, sent, failed, pending };
  }, [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (statusFilter === "sent" && !p.welcome_email_sent_at) return false;
      if (statusFilter === "failed" && !p.welcome_email_last_error) return false;
      if (statusFilter === "pending" && (p.welcome_email_sent_at || p.welcome_email_last_error))
        return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(p.username || "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [profiles, statusFilter, search]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total users" value={stats.total} icon={Mail} color="text-primary" />
        <StatCard label="Delivered" value={stats.sent} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="Failed" value={stats.failed} icon={AlertCircle} color="text-destructive" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="text-amber-500" />
      </div>

      <Card>
        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Welcome email delivery
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-7 gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-xs">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "sent", "failed", "pending"] as StatusFilter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={statusFilter === f ? "default" : "outline"}
                  className="h-8 px-2 text-xs capitalize"
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin inline" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No matching users</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Attempts</TableHead>
                    <TableHead className="text-xs">Last attempt</TableHead>
                    <TableHead className="text-xs">Sent at</TableHead>
                    <TableHead className="text-xs">Error / Recipient</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const sent = !!p.welcome_email_sent_at;
                    const failed = !sent && !!p.welcome_email_last_error;
                    const log = Object.values(logsById).find(
                      (l) =>
                        l.recipient_email &&
                        // best-effort match: any log with this username slug
                        false
                    );
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.username || "—"}</TableCell>
                        <TableCell>
                          {sent ? (
                            <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/20 text-[10px] h-5">
                              Sent
                            </Badge>
                          ) : failed ? (
                            <Badge variant="destructive" className="text-[10px] h-5">
                              Failed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-5">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          {p.welcome_email_attempts ?? 0}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {p.welcome_email_last_attempt_at
                            ? format(new Date(p.welcome_email_last_attempt_at), "MMM d, HH:mm")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {p.welcome_email_sent_at
                            ? format(new Date(p.welcome_email_sent_at), "MMM d, HH:mm")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[280px] truncate text-muted-foreground">
                          {p.welcome_email_last_error || log?.recipient_email || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2.5">
        <div className={`p-2 rounded-lg bg-muted ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
          <p className="text-lg font-bold leading-tight">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
