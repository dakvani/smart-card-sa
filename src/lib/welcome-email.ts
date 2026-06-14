import { supabase } from "@/integrations/supabase/client";

const MAX_ATTEMPTS = 3;

export interface WelcomeSendResult {
  ok: boolean;
  error?: string;
  attempts: number;
}

/**
 * Attempt to send the welcome email with retry + exponential backoff.
 * Records attempt count, last error, timestamps, and the footer version used.
 */
export async function sendWelcomeEmailWithRetry(
  userId: string,
  recipientEmail: string,
  username?: string | null,
  opts: { force?: boolean } = {}
): Promise<WelcomeSendResult> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("welcome_email_sent_at, welcome_email_attempts, username")
    .eq("user_id", userId)
    .maybeSingle();

  if (!opts.force && profile?.welcome_email_sent_at) {
    return { ok: true, attempts: profile.welcome_email_attempts ?? 0 };
  }

  // Load editable footer settings + mint a marketing unsubscribe token.
  let helpText: string | undefined;
  let supportEmail: string | undefined;
  let footerVersion: number | undefined;
  let marketingUnsubscribeUrl: string | undefined;

  try {
    const { data: settings } = await supabase
      .from("email_settings" as any)
      .select("help_text, support_email, footer_version")
      .eq("id", 1)
      .maybeSingle();
    if (settings) {
      const s = settings as any;
      helpText = s.help_text;
      supportEmail = s.support_email;
      footerVersion = s.footer_version;
    }
  } catch (e) {
    console.warn("Could not load email_settings; using defaults", e);
  }

  try {
    const { data: token } = await supabase.rpc("ensure_marketing_unsubscribe_token" as any, {
      p_email: recipientEmail,
    });
    if (token) {
      marketingUnsubscribeUrl = `${window.location.origin}/marketing-unsubscribe?token=${encodeURIComponent(
        token as string
      )}`;
    }
  } catch (e) {
    console.warn("Could not mint marketing-unsubscribe token", e);
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
            helpText,
            supportEmail,
            footerVersion,
            marketingUnsubscribeUrl,
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
          welcome_email_footer_version: footerVersion ?? null,
        } as any)
        .eq("user_id", userId);

      return { ok: true, attempts: attemptNumber };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error(`Welcome email attempt ${attemptNumber} failed`, err);
      if (i < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }

  const finalError = lastError?.slice(0, 500) || "Unknown error";
  await supabase
    .from("profiles")
    .update({ welcome_email_last_error: finalError })
    .eq("user_id", userId);

  try {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "welcome-email-failed",
        recipientEmail,
        idempotencyKey: `welcome-failed-${userId}-${Date.now()}`,
        templateData: {
          userEmail: recipientEmail,
          username: username || profile?.username || "",
          userId,
          errorMessage: finalError,
          attempts: baseAttempts + MAX_ATTEMPTS,
          adminUrl: `${window.location.origin}/admin`,
        },
      },
    });
  } catch (alertErr) {
    console.error("Failed to dispatch admin failure alert", alertErr);
  }

  return { ok: false, error: lastError, attempts: baseAttempts + MAX_ATTEMPTS };
}
