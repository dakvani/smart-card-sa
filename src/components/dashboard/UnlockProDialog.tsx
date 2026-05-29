import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Lock, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnlockProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  /** Where to send the user back to after upgrading. Defaults to current URL. */
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

  const handleUpgrade = () => {
    const back = returnTo || `${location.pathname}${location.search}${location.hash}`;
    onOpenChange(false);
    navigate(`/pricing?returnTo=${encodeURIComponent(back)}&feature=${encodeURIComponent(featureName || "pro")}`, {
      state: { returnTo: back, feature: featureName },
    });
  };

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
            Upgrade to SmartCard Pro to unlock this template and every premium builder tool. We'll bring you right
            back here when you're done.
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

        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button variant="gradient" size="sm" onClick={handleUpgrade}>
            <Sparkles className="w-4 h-4" /> Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
