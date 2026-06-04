import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Sparkles, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePromoSettings, formatPromoMessage } from "@/hooks/use-promo-settings";

export function AdminPromoSettings() {
  const { settings, loading, update } = usePromoSettings();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await update({
        enabled: draft.enabled,
        start_count: Math.max(0, Number(draft.start_count) || 0),
        max_count: Math.max(1, Number(draft.max_count) || 100),
        current_count: Math.max(0, Number(draft.current_count) || 0),
        popup_title: draft.popup_title,
        popup_message: draft.popup_message,
      });
      toast.success("Promo settings updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const bump = (delta: number) =>
    setDraft((d) => ({ ...d, current_count: Math.min(d.max_count, Math.max(0, d.current_count + delta)) }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const preview = formatPromoMessage(draft.popup_message, draft.current_count);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-primary" />
          Premium Promo (free upgrade for first {draft.max_count})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">Promo enabled</p>
            <p className="text-xs text-muted-foreground">When off, the popup is hidden and the counter pauses.</p>
          </div>
          <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Start count</Label>
            <Input
              type="number"
              value={draft.start_count}
              onChange={(e) => setDraft({ ...draft, start_count: Number(e.target.value) })}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Max count</Label>
            <Input
              type="number"
              value={draft.max_count}
              onChange={(e) => setDraft({ ...draft, max_count: Number(e.target.value) })}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Current count</Label>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => bump(-1)}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="number"
                value={draft.current_count}
                onChange={(e) => setDraft({ ...draft, current_count: Number(e.target.value) })}
                className="h-9 text-center"
              />
              <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => bump(1)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Popup title</Label>
          <Input
            value={draft.popup_title}
            onChange={(e) => setDraft({ ...draft, popup_title: e.target.value })}
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-xs">Popup message (use <code>#{`{n}`}</code> for the customer number)</Label>
          <Textarea
            value={draft.popup_message}
            onChange={(e) => setDraft({ ...draft, popup_message: e.target.value })}
            rows={3}
          />
        </div>

        <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Preview</p>
          <p className="text-sm font-semibold">{draft.popup_title}</p>
          <p className="text-xs text-muted-foreground mt-1">{preview}</p>
        </div>

        <Button onClick={save} disabled={saving} variant="gradient" className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save promo settings
        </Button>
      </CardContent>
    </Card>
  );
}
