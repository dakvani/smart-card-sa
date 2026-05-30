import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/form-feedback";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";
import { useUsernameCheck } from "@/hooks/use-username-check";

interface ClaimSmartCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClaimSmartCardDialog({ open, onOpenChange }: ClaimSmartCardDialogProps) {
  const [username, setUsername] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const navigate = useNavigate();
  const { isChecking, isTaken, suggestions, hasChecked } = useUsernameCheck(username);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isTaken || isChecking) return;
    setFormStatus("loading");
    await new Promise((r) => setTimeout(r, 600));
    setFormStatus("success");
    setTimeout(() => {
      onOpenChange(false);
      navigate(`/signup?username=${encodeURIComponent(username.trim())}`);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/40 bg-transparent">
        <div className="relative gradient-dark p-6 sm:p-8">
          {/* Blurred orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-accent/10 blur-[90px]" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-5 text-foreground/80"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Free forever · No credit card</span>
            </motion.div>

            <div className="flex items-center gap-2 mb-3">
              <SmartCardLogo className="w-6 h-6" />
              <span className="text-sm font-semibold text-foreground/80">SmartCard</span>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-balance text-foreground/95">
              Everything you are.{" "}
              <span className="gradient-text">In one simple link.</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2 mb-5">
              Claim your handle in seconds and start sharing.
            </DialogDescription>

            <form onSubmit={handleClaim} className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground font-medium text-xs sm:text-sm">smartcard.online/</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                  placeholder="yourname"
                  autoFocus
                  disabled={formStatus === "loading" || formStatus === "success"}
                  className="w-full h-12 pl-[124px] sm:pl-[136px] pr-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/30 transition-all disabled:opacity-50"
                />
              </div>

              {username.trim().length >= 3 && (
                <div className="text-xs">
                  {isChecking ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking availability...</span>
                    </div>
                  ) : hasChecked && !isTaken ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span><strong>{username}</strong> is available!</span>
                    </div>
                  ) : hasChecked && isTaken ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="w-3.5 h-3.5" />
                        <span><strong>{username}</strong> is taken</span>
                      </div>
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setUsername(s)}
                              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              <SubmitButton
                status={formStatus}
                idleText="Claim your SmartCard"
                loadingText="Claiming..."
                successText="Redirecting..."
                className="w-full h-12"
                disabled={isTaken || isChecking}
              />
            </form>

            <p className="text-[11px] text-muted-foreground/70 text-center mt-4">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
