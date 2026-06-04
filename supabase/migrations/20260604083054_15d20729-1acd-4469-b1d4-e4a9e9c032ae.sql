
CREATE TABLE public.promo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT true,
  start_count INTEGER NOT NULL DEFAULT 10,
  max_count INTEGER NOT NULL DEFAULT 100,
  current_count INTEGER NOT NULL DEFAULT 10,
  popup_title TEXT NOT NULL DEFAULT 'Premium request received!',
  popup_message TEXT NOT NULL DEFAULT 'Your request for premium access has been sent to SmartCard. You''re #{n} of our limited free upgrade slots — first 100 customers get premium free!',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.promo_settings TO anon, authenticated;
GRANT UPDATE ON public.promo_settings TO authenticated;
GRANT ALL ON public.promo_settings TO service_role;

ALTER TABLE public.promo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read promo settings" ON public.promo_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update promo settings" ON public.promo_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.promo_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Auto-increment counter when a new pending pro request comes in (capped at max_count)
CREATE OR REPLACE FUNCTION public.bump_promo_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_settings
     SET current_count = LEAST(current_count + 1, max_count),
         updated_at = now()
   WHERE id = 1 AND enabled = true AND current_count < max_count;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_promo_counter ON public.pro_upgrade_requests;
CREATE TRIGGER trg_bump_promo_counter
  AFTER INSERT ON public.pro_upgrade_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.bump_promo_counter();

-- Ensure prevent_plan_self_escalation trigger exists on profiles so admins (and only admins) can change plan
DROP TRIGGER IF EXISTS trg_prevent_plan_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_plan_self_escalation
  BEFORE UPDATE OF plan ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_self_escalation();
