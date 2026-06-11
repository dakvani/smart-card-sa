import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmailWithRetry } from "@/lib/welcome-email";

/**
 * Mount once at the app root. When a user signs in (including via Google OAuth)
 * and has not yet received the welcome email, this hook invokes the
 * `send-transactional-email` edge function (with retry) and records delivery
 * state on the user's profile.
 */
export function WelcomeEmailTrigger() {
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    const trySend = async (userId: string, userEmail: string | undefined) => {
      if (!userEmail || inFlight.current.has(userId)) return;
      inFlight.current.add(userId);
      try {
        const result = await sendWelcomeEmailWithRetry(userId, userEmail);
        if (!result.ok) {
          console.error("Welcome email exhausted retries", result.error);
        }
      } finally {
        // allow a future SIGNED_IN of the same session to retry if needed
        setTimeout(() => inFlight.current.delete(userId), 60_000);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) trySend(session.user.id, session.user.email ?? undefined);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Defer so handle_new_user trigger has time to create the profile row.
        setTimeout(
          () => trySend(session.user.id, session.user.email ?? undefined),
          1500
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
