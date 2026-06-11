import { supabase } from "@/integrations/supabase/client";

const MAX_ATTEMPTS = 3;

export interface WelcomeSendResult {
  ok: boolean;
  error?: string;
  attempts: number;
}

/**
 * Attempt to send the welcome email with retry + exponential backoff.
 * Records attempt count, last error, and timestamps on the user's profile so
 * the admin dashboard and the user portal can surface delivery status.
 */
export async function sendWelcomeEmailWithRetry(
  userId: string,
  recipientEmail: string,
  username?: string | null,
  opts: { force?: boolean } = {}
): Promise<WelcomeSendResult> {
  // Read current state.
  const { data: profile } = await supabase
    .from("profiles")
    .select("welcome_email_sent_at, welcome_email_attempts, username")
    .eq("user_id", userId)
    .maybeSingle();

  if (!opts.force && profile?.welcome_email_sent_at) {
    return { ok: true, attempts: profile.welcome_email_attempts ?? 0 };
  }

  const baseAttempts = profile?.welcome_email_attempts ?? 0;
  let lastError: string | undefined;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const attemptNumber = baseAttempts + i + 1;
    try {
      await supabase
        .from("profiles")
        .update({
          welcome_email_attempts: attemptNumber,
          welcome_email_last_attempt_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome",
          recipientEmail,
          idempotencyKey: `welcome-${userId}${opts.force ? `-r${attemptNumber}` : ""}`,
          templateData: {
            name: username || profile?.username || "",
            siteUrl: window.location.origin,
          },
        },
      });

      if (error) throw new Error(error.message || String(error));
      if (data && (data as any).success === false) {
        throw new Error((data as any).reason || "send_failed");
      }

      await supabase
        .from("profiles")
        .update({
          welcome_email_sent_at: new Date().toISOString(),
          welcome_email_last_error: null,
        })
        .eq("user_id", userId);

      return { ok: true, attempts: attemptNumber };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error(`Welcome email attempt ${attemptNumber} failed`, err);
      if (i < MAX_ATTEMPTS - 1) {
        // exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }

  // All retries exhausted — record failure.
  await supabase
    .from("profiles")
    .update({
      welcome_email_last_error: lastError?.slice(0, 500) || "Unknown error",
    })
    .eq("user_id", userId);

  return { ok: false, error: lastError, attempts: baseAttempts + MAX_ATTEMPTS };
}
