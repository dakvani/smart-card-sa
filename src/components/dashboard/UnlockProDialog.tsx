import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Lock, Check, Loader2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProRequest } from "@/hooks/use-pro-request";
import { toast } from "sonner";

interface UnlockProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  returnTo?: string;
}

const benefits = [
  "Profession-categorized premium templates",
  "Advanced theme customizer & animations",
  "Link scheduling, featured links & thumbnails",
  "Detailed analytics & email capture",
];

export function UnlockProDialog({ open, onOpenChange, featureName, returnTo }: UnlockProDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const { status, requestPro, refresh } = useProRequest(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleRequest = async () => {
    if (!userId) {
      const back = returnTo || `${location.pathname}${location.search}${location.hash}`;
      onOpenChange(false);
      navigate(`/login?returnTo=${encodeURIComponent(back)}`);
      return;
    }
    setSubmitting(true);
    try {
      await requestPro(featureName);
      toast.success("Request sent! An admin will review your upgrade shortly.");
    } catch (e: any) {
      toast.error(e.message || "Could not send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPricing = () => {
    const back = returnTo || `${location.pathname}${location.search}${location.hash}`;
    onOpenChange(false);
    navigate(`/pricing?returnTo=${encodeURIComponent(back)}&feature=${encodeURIComponent(featureName || "pro")}`);
  };

  const pending = status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-2">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Unlock {featureName || "this Pro feature"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {pending
              ? "Your upgrade request is pending admin approval. You'll get Pro access as soon as it's reviewed."
              : "Request Pro access — an admin will be notified instantly and can grant you the upgrade."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="sm:justify-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleViewPricing}>
            View pricing
          </Button>
          {pending ? (
            <Button variant="gradient" size="sm" disabled>
              <Clock className="w-4 h-4" /> Awaiting approval
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={handleRequest} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Request Pro access
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
