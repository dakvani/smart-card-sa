import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SocialAuthButtons() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const anyLoading = googleLoading || appleLoading;

  const describeOAuthError = (err: unknown, provider: string): string => {
    const raw =
      (err as any)?.message ||
      (err as any)?.error_description ||
      (typeof err === "string" ? err : "");
    const msg = String(raw).toLowerCase();

    if (!navigator.onLine || msg.includes("failed to fetch") || msg.includes("network") || msg.includes("networkerror")) {
      return "Network issue — please check your connection and try again.";
    }
    if (msg.includes("popup") && (msg.includes("block") || msg.includes("closed"))) {
      return `${provider} sign-in popup was blocked. Please allow popups for this site and try again.`;
    }
    if (msg.includes("popup_closed") || msg.includes("window closed") || msg.includes("user closed")) {
      return `${provider} sign-in was canceled before completing.`;
    }
    if (msg.includes("access_denied") || msg.includes("consent") || msg.includes("denied") || msg.includes("cancel")) {
      return `${provider} sign-in was canceled. You need to grant access to continue.`;
    }
    if (msg.includes("missing oauth secret") || msg.includes("provider is not enabled")) {
      return `${provider} sign-in isn't configured yet. Please contact support.`;
    }
    if (msg.includes("redirect") && msg.includes("uri")) {
      return `${provider} sign-in misconfiguration (invalid redirect). Please contact support.`;
    }
    return raw || `Couldn't sign in with ${provider}. Please try again.`;
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      if (!navigator.onLine) {
        toast.error("You appear to be offline. Please check your connection.");
        return;
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/login`,
      });

      if (result.error) {
        toast.error(describeOAuthError(result.error, "Google"));
        return;
      }
      if (result.redirected) return;
      window.location.href = "/login";
    } catch (error) {
      console.error("Google sign-in failed:", error);
      toast.error(describeOAuthError(error, "Google"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      if (!navigator.onLine) {
        toast.error("You appear to be offline. Please check your connection.");
        return;
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/login` },
      });
      if (error) {
        toast.error(describeOAuthError(error, "Apple"));
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error("Apple sign-in failed:", error);
      toast.error(describeOAuthError(error, "Apple"));
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-medium rounded-xl border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent/60 hover:border-primary/30 transition-all duration-300"
        onClick={handleGoogleLogin}
        disabled={anyLoading}
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-3" />
        ) : (
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-medium rounded-xl border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent/60 hover:border-primary/30 transition-all duration-300"
        onClick={handleAppleLogin}
        disabled={anyLoading}
      >
        {appleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-3" />
        ) : (
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        )}
        Continue with Apple
      </Button>
    </div>
  );
}
