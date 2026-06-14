import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface EmailSettings {
  help_text: string;
  support_email: string;
  footer_version: number;
  updated_at: string;
}

export function AdminEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [helpText, setHelpText] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_settings" as any)
      .select("help_text, support_email, footer_version, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      const s = data as unknown as EmailSettings;
      setSettings(s);
      setHelpText(s.help_text);
      setSupportEmail(s.support_email);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!supportEmail.trim() || !helpText.trim()) {
      toast.error("Both fields are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("email_settings" as any)
      .update({ help_text: helpText.trim(), support_email: supportEmail.trim() })
      .eq("id", 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Footer settings saved");
    load();
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" /> Welcome email footer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {loading ? (
          <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="support-email" className="text-xs">Support email</Label>
              <Input
                id="support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="info@smartcardsa.shop"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="help-text" className="text-xs">Help footer text</Label>
              <Textarea
                id="help-text"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                rows={3}
                className="text-xs"
                placeholder="Need help? Reach us at info@smartcardsa.shop — we read every message."
              />
              <p className="text-[10px] text-muted-foreground">Shown in the footer of welcome emails.</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground">
                Footer version: <span className="font-medium">v{settings?.footer_version ?? 1}</span>
                {settings?.updated_at && <> · updated {new Date(settings.updated_at).toLocaleString()}</>}
              </p>
              <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span className="text-xs">Save</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
