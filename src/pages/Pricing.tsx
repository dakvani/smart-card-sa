import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Sparkles, Loader2, Clock, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProRequest, type RequestablePlan } from "@/hooks/use-pro-request";
import { usePromoSettings, formatPromoMessage } from "@/hooks/use-promo-settings";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    key: "free" as const,
    price: "SAR 0",
    description: "Perfect for getting started",
    features: ["Unlimited Links", "Basic Themes (5 colors)", "Tip Jar support", "Last 28 days of analytics", "Mobile responsive"],
    cta: "Get started free",
    popular: false,
  },
  {
    name: "Starter",
    key: "starter" as const,
    price: "SAR 19",
    period: "/mo",
    description: "For growing creators",
    features: ["Everything in Free, plus:", "Custom Fonts & Backgrounds", "Spotlight/Highlight Links", "6 Months of analytics", "Priority Help & Support", "Custom button styles"],
    cta: "Request Starter access",
    popular: true,
  },
  {
    name: "Pro",
    key: "pro" as const,
    price: "SAR 56",
    period: "/mo",
    description: "For power users & brands",
    features: ["Everything in Starter, plus:", "Remove SmartCard branding", "Export Email List", "Google Analytics integration", "Facebook Pixel integration", "Custom CSS", "API access"],
    cta: "Request Pro access",
    popular: false,
  },
];

export default function Pricing() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = params.get("returnTo");
  const feature = params.get("feature");

  const [userId, setUserId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState<string>("");

  const { requestPro, status, refresh } = useProRequest(userId);
  const { settings: promo } = usePromoSettings();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const handleSelect = async (planKey: "free" | "starter" | "pro") => {
    if (planKey === "free") {
      // Already on free / get started
      navigate(userId ? "/dashboard" : "/signup");
      return;
    }
    if (!userId) {
      const back = `/pricing?plan=${planKey}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`;
      toast.info("Please sign in to request premium access");
      navigate(`/login?returnTo=${encodeURIComponent(back)}`);
      return;
    }
    setSubmitting(planKey);
    try {
      await requestPro(feature || "pricing-page", planKey as RequestablePlan);
      await refresh();
      setSuccessPlan(planKey);
      setShowSuccess(true);
    } catch (e: any) {
      toast.error(e.message || "Could not send request");
    } finally {
      setSubmitting(null);
    }
  };

  // Auto-trigger from URL param ?plan=pro after login redirect
  useEffect(() => {
    const planParam = params.get("plan");
    if (planParam && userId && (planParam === "starter" || planParam === "pro")) {
      // small delay to ensure auth state hydrated
      const t = setTimeout(() => handleSelect(planParam), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const popupMessage = formatPromoMessage(promo.popup_message, promo.current_count);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        {returnTo && (
          <div className="container mx-auto px-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                You're upgrading to unlock <strong>{feature || "a Pro feature"}</strong>.
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate(returnTo)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </div>
          </div>
        )}

        {promo.enabled && (
          <div className="container mx-auto px-4 pt-6">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 px-4 py-3 text-center text-sm">
              🎉 <strong>Opening promo:</strong> first <strong>{promo.max_count}</strong> customers get premium access free.{" "}
              <span className="text-muted-foreground">
                {promo.current_count} / {promo.max_count} claimed
              </span>
            </div>
          </div>
        )}

        <section className="py-12 text-center">
          <div className="container mx-auto px-4">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-bold mb-6">
              Simple, transparent <span className="gradient-text">pricing</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow.
            </motion.p>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const isPending = status === "pending" && plan.key !== "free";
                const isSubmitting = submitting === plan.key;
                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-2xl p-8 ${plan.popular ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-background text-foreground text-sm font-semibold rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.description}</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.period && <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>{plan.period}</span>}
                    </div>
                    <Button
                      variant={plan.popular ? "heroOutline" : "gradient"}
                      className={`w-full mb-8 ${plan.popular ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}`}
                      onClick={() => handleSelect(plan.key)}
                      disabled={isSubmitting || isPending}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending…</>
                      ) : isPending ? (
                        <><Clock className="w-4 h-4 mr-2" /> Awaiting approval</>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 mt-0.5 shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                          <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : ""}`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-2">
              <PartyPopper className="w-6 h-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-center text-lg">{promo.popup_title}</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {popupMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Plan requested</p>
            <p className="text-lg font-bold capitalize">{successPlan}</p>
            <p className="text-xs text-muted-foreground mt-2">
              You're customer <strong className="text-foreground">#{promo.current_count}</strong> of <strong className="text-foreground">{promo.max_count}</strong>
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="gradient" onClick={() => { setShowSuccess(false); navigate(returnTo || "/dashboard"); }}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
