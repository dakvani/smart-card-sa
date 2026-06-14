
-- 1. email_settings singleton
CREATE TABLE public.email_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  help_text text NOT NULL DEFAULT 'Need help? Reach us at info@smartcardsa.shop — we read every message.',
  support_email text NOT NULL DEFAULT 'info@smartcardsa.shop',
  footer_version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT email_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.email_settings TO anon, authenticated;
GRANT ALL ON public.email_settings TO service_role;

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read email settings"
  ON public.email_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update email settings"
  ON public.email_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email settings"
  ON public.email_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bump footer_version on every update + maintain updated_at
CREATE OR REPLACE FUNCTION public.bump_email_settings_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF (OLD.help_text IS DISTINCT FROM NEW.help_text)
     OR (OLD.support_email IS DISTINCT FROM NEW.support_email) THEN
    NEW.footer_version = COALESCE(OLD.footer_version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_email_settings_version
BEFORE UPDATE ON public.email_settings
FOR EACH ROW EXECUTE FUNCTION public.bump_email_settings_version();

INSERT INTO public.email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. marketing_email_unsubscribes
CREATE TABLE public.marketing_email_unsubscribes (
  email text PRIMARY KEY,
  token text NOT NULL UNIQUE,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.marketing_email_unsubscribes TO service_role;
-- No anon/authenticated grants: only edge functions (service role) access this.

ALTER TABLE public.marketing_email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read marketing unsubscribes"
  ON public.marketing_email_unsubscribes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.marketing_email_unsubscribes TO authenticated;

-- 3. profile footer-version audit column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_footer_version integer;

-- 4. SECURITY DEFINER RPC so client can mint/get a marketing-unsubscribe token
CREATE OR REPLACE FUNCTION public.ensure_marketing_unsubscribe_token(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_token text;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email required';
  END IF;

  SELECT token INTO v_token FROM public.marketing_email_unsubscribes WHERE email = v_email;
  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.marketing_email_unsubscribes (email, token)
  VALUES (v_email, v_token)
  ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_marketing_unsubscribe_token(text) TO anon, authenticated, service_role;
