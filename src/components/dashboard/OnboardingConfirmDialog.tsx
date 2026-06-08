import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";
import type { OnboardingPrefill } from "@/lib/onboarding";

interface Props {
  open: boolean;
  prefill: OnboardingPrefill | null;
  email?: string;
  onConfirm: (values: { username: string; title: string; avatar_url: string | null }, edited: boolean) => void;
  onSkip: () => void;
  saving?: boolean;
}

export function OnboardingConfirmDialog({ open, prefill, email, onConfirm, onSkip, saving }: Props) {
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const initial = prefill?.fields;

  useEffect(() => {
    if (open && prefill) {
      setUsername(prefill.fields.username ?? "");
      setTitle(prefill.fields.title ?? "");
      setAvatarUrl(prefill.fields.avatar_url ?? null);
    }
  }, [open, prefill]);

  if (!prefill) return null;

  const edited =
    username !== (initial?.username ?? "") ||
    title !== (initial?.title ?? "") ||
    avatarUrl !== (initial?.avatar_url ?? null);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onSkip(); }}>
      <DialogContent className="sm:max-w-md" aria-describedby="onboarding-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Welcome — confirm your SmartCard
          </DialogTitle>
          <DialogDescription id="onboarding-desc">
            We pre-filled your profile from your Google account{email ? ` (${email})` : ""}. Confirm or tweak before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
              <AvatarFallback>{(title || username || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-xs text-muted-foreground">
              {prefill.sources.avatar_url === "oauth" ? "Avatar from Google" : "Default avatar"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onb-username">Username</Label>
            <Input
              id="onb-username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/gi, ""))}
              placeholder="your-handle"
            />
            <p className="text-[11px] text-muted-foreground">
              Source: {prefill.sources.username}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onb-title">Display name</Label>
            <Input
              id="onb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your name"
            />
            <p className="text-[11px] text-muted-foreground">
              Source: {prefill.sources.title}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={saving}>Skip for now</Button>
          <Button
            onClick={() => onConfirm({ username, title, avatar_url: avatarUrl }, edited)}
            disabled={saving || !username}
          >
            {saving ? "Saving…" : edited ? "Save changes" : "Looks good"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
