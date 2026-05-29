import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface EmailAuthFormProps {
  mode: "login" | "signup";
  onToggleMode: () => void;
}

export function EmailAuthForm({ mode, onToggleMode }: EmailAuthFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username || undefined },
          },
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Check your email to confirm your account!");
        }
        setLoading(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          toast.error(error.message);
          setLoading(false);
        } else if (data?.session) {
          setRedirecting(true);
          // Brief delay so the overlay renders before navigation
          setTimeout(() => navigate("/dashboard", { replace: true }), 150);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent! Check your email.");
        setShowForgot(false);
      }
    } catch {
      toast.error("Failed to send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgot) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-sm text-muted-foreground">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10 h-12 rounded-xl bg-card/50 border-border/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={forgotLoading}
          className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-pink-500 hover:opacity-90 transition-opacity"
        >
          {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Send Reset Link
        </Button>
        <button
          type="button"
          onClick={() => setShowForgot(false)}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <>
      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin text-primary-foreground" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Signing you in…</p>
              <p className="text-sm text-muted-foreground mt-1">Taking you to your dashboard</p>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm text-muted-foreground">
            Username
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="pl-10 h-12 rounded-xl bg-card/50 border-border/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm text-muted-foreground">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-10 h-12 rounded-xl bg-card/50 border-border/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm text-muted-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-10 pr-10 h-12 rounded-xl bg-card/50 border-border/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => setShowForgot(true)}
          className="text-xs text-primary hover:underline"
        >
          Forgot password?
        </button>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-pink-500 hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        {mode === "signup" ? "Create Account" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={onToggleMode}
          className="text-primary font-medium hover:underline"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
    </>
  );
}
