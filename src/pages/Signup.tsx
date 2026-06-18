import { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { SignupVisual } from "@/components/auth/SignupVisual";


export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillUsername = searchParams.get("username") || "";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) navigate("/dashboard");
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual */}
      <SignupVisual />

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-background">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '20px 20px',
        }} />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-10 text-sm transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">SmartCard</span>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="text-muted-foreground mb-8 text-[15px] leading-relaxed">
              Get started for free. No credit card required.
            </p>
          </motion.div>

          {/* Social Auth */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <SocialAuthButtons />
          </motion.div>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wider">
                or sign up with email
              </span>
            </div>
          </div>

          {/* Email Auth */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <EmailAuthForm mode="signup" onToggleMode={() => navigate("/login")} />
          </motion.div>

          {/* Terms */}
          <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" & "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
