import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Save, Mail, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";

interface TemplateOverride {
  template_key: string;
  kind: "app" | "auth";
  display_name: string;
  subject_override: string | null;
  body_intro: string | null;
  body_outro: string | null;
  cta_label: string | null;
  enabled: boolean;
  version: number;
  updated_at: string;
}

const HINTS: Record<string, string> = {
  welcome: "Sent to new users after they create an account.",
  "welcome-email-failed": "Internal admin alert when a welcome email permanently fails.",
  signup: "Auth — sent to confirm a new account's email address.",
  magiclink: "Auth — sent when a user requests a passwordless login link.",
  recovery: "Auth — sent when a user requests a password reset.",
  invite: "Auth — sent when a user is invited to the workspace.",
  email_change: "Auth — sent to confirm a change of email address.",
  reauthentication: "Auth — sent with an OTP for sensitive actions.",
};

export function AdminEmailTemplatesEditor() {
  const [rows, setRows] = useState<TemplateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<TemplateOverride>>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_template_overrides" as any)
      .select("*")
      .order("kind", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setDrafts({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const draftFor = (row: TemplateOverride): TemplateOverride => ({ ...row, ...drafts[row.template_key] });

  const setDraft = (key: string, patch: Partial<TemplateOverride>) =>
    setDrafts((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const save = async (key: string) => {
    const row = rows.find((r) => r.template_key === key);
    if (!row) return;
    const merged = draftFor(row);
    setSavingKey(key);
    const { error } = await supabase
      .from("email_template_overrides" as any)
      .update({
        subject_override: merged.subject_override?.trim() || null,
        body_intro: merged.body_intro?.trim() || null,
        body_outro: merged.body_outro?.trim() || null,
        cta_label: merged.cta_label?.trim() || null,
        enabled: merged.enabled,
      })
      .eq("template_key", key);
    setSavingKey(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Saved — ${merged.display_name}`);
    load();
  };

  const reset = async (key: string) => {
    setSavingKey(key);
    const { error } = await supabase
      .from("email_template_overrides" as any)
      .update({
        subject_override: null,
        body_intro: null,
        body_outro: null,
        cta_label: null,
      })
      .eq("template_key", key);
    setSavingKey(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Reset to defaults");
    load();
  };

  const grouped = {
    app: rows.filter((r) => r.kind === "app"),
    auth: rows.filter((r) => r.kind === "auth"),
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Email content editor
        </CardTitle>
        <CardDescription className="text-xs">
          Override subject lines and intro/outro copy for every automated email. Leave any field
          blank to use the default. Each change bumps a version (audit trail).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-4">
        {loading ? (
          <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-muted-foreground" /></div>
        ) : (
          (["app", "auth"] as const).map((kind) => (
            <div key={kind}>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {kind === "app" ? "App emails" : "Authentication emails"}
              </p>
              <Accordion type="multiple" className="space-y-2">
                {grouped[kind].map((row) => {
                  const merged = draftFor(row);
                  const dirty = !!drafts[row.template_key];
                  return (
                    <AccordionItem
                      key={row.template_key}
                      value={row.template_key}
                      className="border rounded-lg px-3 bg-card/40"
                    >
                      <AccordionTrigger className="hover:no-underline py-2.5">
                        <div className="flex items-center justify-between flex-1 pr-2 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant={kind === "auth" ? "secondary" : "outline"} className="text-[10px] h-5">
                              {kind === "auth" ? <Lock className="w-2.5 h-2.5 mr-0.5" /> : null}
                              {kind}
                            </Badge>
                            <span className="text-sm font-medium truncate">{row.display_name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {dirty && <Badge variant="default" className="text-[10px] h-5">Unsaved</Badge>}
                            <span className="text-[10px] text-muted-foreground">v{row.version}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 pt-1 space-y-3">
                        <p className="text-[11px] text-muted-foreground">{HINTS[row.template_key]}</p>

                        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
                          <div>
                            <Label className="text-xs">Overrides enabled</Label>
                            <p className="text-[10px] text-muted-foreground">
                              When off, the email uses the built-in defaults.
                            </p>
                          </div>
                          <Switch
                            checked={merged.enabled}
                            onCheckedChange={(v) => setDraft(row.template_key, { enabled: v })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Subject line</Label>
                          <Input
                            value={merged.subject_override ?? ""}
                            onChange={(e) => setDraft(row.template_key, { subject_override: e.target.value })}
                            placeholder="Leave blank to use default subject"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Intro text (above the button)</Label>
                          <Textarea
                            value={merged.body_intro ?? ""}
                            onChange={(e) => setDraft(row.template_key, { body_intro: e.target.value })}
                            rows={3}
                            className="text-xs"
                            placeholder="Replaces the default intro paragraph."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Outro text (below the button)</Label>
                          <Textarea
                            value={merged.body_outro ?? ""}
                            onChange={(e) => setDraft(row.template_key, { body_outro: e.target.value })}
                            rows={3}
                            className="text-xs"
                            placeholder="Replaces the default footer paragraph."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Button label</Label>
                          <Input
                            value={merged.cta_label ?? ""}
                            onChange={(e) => setDraft(row.template_key, { cta_label: e.target.value })}
                            placeholder="Leave blank for default"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] text-muted-foreground">
                            Updated {new Date(row.updated_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => reset(row.template_key)}
                              disabled={savingKey === row.template_key}
                              className="h-7 text-xs gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Reset
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => save(row.template_key)}
                              disabled={savingKey === row.template_key || !dirty}
                              className="h-7 text-xs gap-1"
                            >
                              {savingKey === row.template_key
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Save className="w-3 h-3" />}
                              Save
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
