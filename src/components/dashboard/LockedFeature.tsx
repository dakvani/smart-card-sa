import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LockedFeatureProps {
  title: string;
  description: string;
  isPro: boolean;
  children: React.ReactNode;
}

export function LockedFeature({ title, description, isPro, children }: LockedFeatureProps) {
  if (isPro) return <>{children}</>;
  return (
    <div className="relative rounded-xl border border-border/60 bg-secondary/30 overflow-hidden">
      <div className="pointer-events-none select-none blur-sm opacity-60 max-h-64 overflow-hidden">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 bg-background/70 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center mb-2 shadow-glow">
          <Lock className="w-4 h-4 text-primary-foreground" />
        </div>
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
        <Link to="/pricing" className="mt-3">
          <Button variant="gradient" size="sm" className="h-8 text-xs">Upgrade to Pro</Button>
        </Link>
      </div>
    </div>
  );
}
