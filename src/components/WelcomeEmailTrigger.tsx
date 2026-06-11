import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mount once at the app root. When a user signs in (including via Google OAuth)
 * and has not yet received the welcome email, this hook invokes the
 * `send-transactional-email` edge function and marks the profile so we never
 * send it again.
 */
export function WelcomeEmailTrigger() {
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    const trySend = async (userId: string, userEmail: string | undefined) => {
      if (!userEmail || inFlight.current.has(userId)) return;
      inFlight.current.add(userId);
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("welcome_email_sent_at, username")
          .eq("user_id", userId)
          .maybeSingle();

        if (error || !profile || profile.welcome_email_sent_at) return;

        const { error: fnError } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "welcome",
              recipientEmail: userEmail,
              idempotencyKey: `welcome-${userId}`,
              templateData: {
                name: profile.username || "",
                siteUrl: window.location.origin,
              },
            },
          }
        );

        if (fnError) {
          console.error("Welcome email send failed", fnError);
          return;
        }

        await supabase
          .from("profiles")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("user_id", userId);
      } catch (err) {
        console.error("Welcome email trigger error", err);
      }
    };

    // Run on initial mount for already-authenticated sessions.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) trySend(session.user.id, session.user.email ?? undefined);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Defer so handle_new_user trigger has time to create the profile row.
          setTimeout(
            () => trySend(session.user.id, session.user.email ?? undefined),
            1500
          );
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
