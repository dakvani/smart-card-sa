ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;
GRANT SELECT (welcome_email_sent_at), UPDATE (welcome_email_sent_at) ON public.profiles TO authenticated;