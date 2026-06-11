import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { sendWelcomeEmailWithRetry } from "@/lib/welcome-email";

export function AccountSecuritySection() {
  const [user, setUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [welcomeSentAt, setWelcomeSentAt] = useState<string | null>(null);
  const [welcomeError, setWelcomeError] = useState<string | null>(null);
  const [resendingWelcome, setResendingWelcome] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("profiles")
          .select("welcome_email_sent_at, welcome_email_last_error")
          .eq("user_id", data.user.id)
          .maybeSingle()
          .then(({ data: p }) => {
            setWelcomeSentAt(p?.welcome_email_sent_at ?? null);
            setWelcomeError(p?.welcome_email_last_error ?? null);
          });
      }
    });
  }, []);

  if (!user) return null;
  const verified = !!user.email_confirmed_at;

  const handleResendWelcome = async () => {
    if (!user.email) return;
    setResendingWelcome(true);
    try {
      const result = await sendWelcomeEmailWithRetry(user.id, user.email, undefined, { force: true });
      if (result.ok) {
        toast.success("Welcome email sent");
        setWelcomeSentAt(new Date().toISOString());
        setWelcomeError(null);
      } else {
        toast.error(`Couldn't send welcome email: ${result.error || "unknown error"}`);
        setWelcomeError(result.error || "Unknown error");
      }
    } finally {
      setResendingWelcome(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) return toast.error("Enter a valid email");
    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to your new address");
      setNewEmail("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be 6+ chars");
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    setUpdatingPassword(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: currentPassword,
      });
      if (signInErr) {
        toast.error("Current password is incorrect");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleResend = async () => {
    if (!user.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Verification email sent");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email status */}
      <div className="bg-background rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4" /> Email
        </h3>
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-3 min-w-0">
            {verified ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">{verified ? "Verified" : "Not verified"}</p>
            </div>
          </div>
          {!verified && (
            <Button size="sm" variant="outline" onClick={handleResend} disabled={resending}>
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Welcome email status */}
      <div className="bg-background rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" /> Welcome email
        </h3>
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {welcomeSentAt ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : welcomeError ? (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {welcomeSentAt
                  ? "Sent"
                  : welcomeError
                    ? "Last attempt failed"
                    : "Not sent yet"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {welcomeSentAt
                  ? new Date(welcomeSentAt).toLocaleString()
                  : welcomeError || "Click resend to receive it now"}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleResendWelcome} disabled={resendingWelcome}>
            {resendingWelcome ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
            <span className="text-xs">{welcomeSentAt ? "Resend" : "Send"}</span>
          </Button>
        </div>
      </div>

      {/* Change email */}
      <form onSubmit={handleUpdateEmail} className="bg-background rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Mail className="w-4 h-4" /> Change email
        </h3>
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@email.com"
        />
        <Button type="submit" variant="gradient" size="sm" disabled={updatingEmail || !newEmail}>
          {updatingEmail && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          Update email
        </Button>
      </form>

      {/* Change password */}
      <form onSubmit={handleUpdatePassword} className="bg-background rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change password
        </h3>
        <div className="relative">
          <Input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <Input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            minLength={6}
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
        <Button type="submit" variant="gradient" size="sm" disabled={updatingPassword || !currentPassword || !newPassword}>
          {updatingPassword && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
