
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_email_last_error text,
  ADD COLUMN IF NOT EXISTS welcome_email_last_attempt_at timestamptz;

GRANT SELECT (welcome_email_sent_at, welcome_email_attempts, welcome_email_last_error, welcome_email_last_attempt_at),
      UPDATE (welcome_email_sent_at, welcome_email_attempts, welcome_email_last_error, welcome_email_last_attempt_at)
  ON public.profiles TO authenticated;
