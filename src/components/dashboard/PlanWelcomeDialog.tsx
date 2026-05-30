import { useEffect, useState } from "react";
import { Sparkles, Check, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS, type UserPlan } from "@/hooks/use-plan";

interface PlanWelcomeDialogProps {
  userId?: string;
  plan: UserPlan;
  loading: boolean;
}

const PERKS: Partial<Record<UserPlan, string[]>> = {
  starter: [
    "Custom theme colors & gradients",
    "Link thumbnails & featured links",
    "Basic analytics dashboard",
  ],
  pro: [
    "All premium profile templates",
    "Advanced animations & customizer",
    "Link scheduling & email capture",
    "Detailed analytics",
  ],
};

export function PlanWelcomeDialog({ userId, plan, loading }: PlanWelcomeDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !userId) return;
    if (plan === "free") return;
    const key = `smartcard:welcomed:${userId}:${plan}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    setOpen(true);
    localStorage.setItem(key, "1");
  }, [userId, plan, loading]);

  const perks = PERKS[plan] ?? PERKS.pro!;
  const label = PLAN_LABELS[plan] ?? "Pro";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-2">
            <PartyPopper className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Welcome to {label}!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your account is now on the <span className="font-semibold text-foreground">{label}</span> plan. Here's what just unlocked for you:
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {perks.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="sm:justify-center">
          <Button variant="gradient" size="sm" onClick={() => setOpen(false)}>
            <Sparkles className="w-4 h-4" /> Start exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
