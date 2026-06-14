CREATE TABLE public.email_template_overrides (
  template_key text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('app','auth')),
  display_name text NOT NULL,
  subject_override text,
  body_intro text,
  body_outro text,
  cta_label text,
  enabled boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_overrides TO authenticated;
GRANT ALL ON public.email_template_overrides TO service_role;

ALTER TABLE public.email_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template overrides"
  ON public.email_template_overrides
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.bump_email_template_override_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.subject_override IS DISTINCT FROM NEW.subject_override)
       OR (OLD.body_intro IS DISTINCT FROM NEW.body_intro)
       OR (OLD.body_outro IS DISTINCT FROM NEW.body_outro)
       OR (OLD.cta_label IS DISTINCT FROM NEW.cta_label)
       OR (OLD.enabled IS DISTINCT FROM NEW.enabled) THEN
      NEW.version = COALESCE(OLD.version, 1) + 1;
      NEW.updated_by = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_email_template_override_version
  BEFORE UPDATE ON public.email_template_overrides
  FOR EACH ROW EXECUTE FUNCTION public.bump_email_template_override_version();

-- Seed rows for all known templates
INSERT INTO public.email_template_overrides (template_key, kind, display_name) VALUES
  ('welcome', 'app', 'Welcome email'),
  ('welcome-email-failed', 'app', 'Welcome email failed (admin alert)'),
  ('signup', 'auth', 'Confirm signup'),
  ('magiclink', 'auth', 'Magic link sign-in'),
  ('recovery', 'auth', 'Password reset'),
  ('invite', 'auth', 'Team invite'),
  ('email_change', 'auth', 'Confirm email change'),
  ('reauthentication', 'auth', 'Reauthentication OTP')
ON CONFLICT (template_key) DO NOTHING;