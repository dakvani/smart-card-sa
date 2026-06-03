import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/form-feedback";
import { PhoneMockup } from "./PhoneMockup";
import { useUsernameCheck } from "@/hooks/use-username-check";

export function Hero() {
  const [username, setUsername] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const navigate = useNavigate();
  
  const { isChecking, isTaken, suggestions, hasChecked } = useUsernameCheck(username);

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);
  const contentScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isTaken || isChecking) return;
    
    setFormStatus("loading");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setFormStatus("success");
    
    setTimeout(() => {
      navigate(`/signup?username=${encodeURIComponent(username.trim())}`);
    }, 600);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Dark gradient background with blur */}
      <motion.div 
        className="absolute inset-0 gradient-dark"
        style={{ y: backgroundY }}
      />

      {/* Subtle blurred orbs */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0.35]) }}
      >
        <motion.div
          animate={{ y: [-12, 12, -12], scale: [1, 1.04, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[5%] w-96 h-96 rounded-full bg-primary/[0.06] blur-[120px]"
        />
        <motion.div
          animate={{ y: [12, -12, 12], scale: [1.04, 1, 1.04] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-[5%] w-[500px] h-[500px] rounded-full bg-accent/[0.08] blur-[140px]"
        />
      </motion.div>

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        style={{ opacity: contentOpacity, scale: contentScale }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-8 text-foreground/80"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Trusted by 30M+ creators worldwide</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance text-foreground/95"
            >
              Everything you are.{" "}
              <span className="gradient-text">In one simple link.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Join millions of creators using SmartCard for their link in bio. One link to help you share everything you create, curate, and sell.
            </motion.p>

            {/* Claim Input */}
            <motion.form
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.3 }}
              onSubmit={handleClaim}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-lg mx-auto lg:mx-0"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-muted-foreground font-medium text-sm sm:text-base">smartcard.online/</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="yourname"
                  disabled={formStatus === "loading" || formStatus === "success"}
                  className="w-full h-14 pl-[140px] sm:pl-[156px] pr-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/30 transition-all disabled:opacity-50"
                />
              </div>
              <SubmitButton
                status={formStatus}
                idleText="Claim your SmartCard"
                loadingText="Claiming..."
                successText="Redirecting..."
                className="w-full sm:w-auto h-14 px-6"
                disabled={isTaken || isChecking}
              />
            </motion.form>

            {/* Username availability feedback */}
            {username.trim().length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 max-w-lg"
              >
                {isChecking ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking availability...</span>
                  </div>
                ) : hasChecked && !isTaken ? (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span><strong>{username}</strong> is available!</span>
                  </div>
                ) : hasChecked && isTaken ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="w-4 h-4" />
                      <span><strong>{username}</strong> is already taken</span>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground">Try:</span>
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setUsername(s)}
                            className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12"
            >
              <p className="text-sm text-muted-foreground mb-4">Trusted by creators at</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-8 text-muted-foreground/40">
                {["TikTok", "Instagram", "YouTube", "Spotify", "Twitch"].map((brand, index) => (
                  <motion.span 
                    key={brand} 
                    className="text-base sm:text-lg font-semibold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    {brand}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right side - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 80, filter: "blur(20px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="order-1 lg:order-2"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
