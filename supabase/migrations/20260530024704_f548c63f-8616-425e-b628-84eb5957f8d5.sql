CREATE TABLE IF NOT EXISTS public.admin_notification_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_user_id, entity_type, entity_id)
);

GRANT SELECT, INSERT, DELETE ON public.admin_notification_dismissals TO authenticated;
GRANT ALL ON public.admin_notification_dismissals TO service_role;

ALTER TABLE public.admin_notification_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their own dismissals" ON public.admin_notification_dismissals;
CREATE POLICY "Admins can view their own dismissals"
ON public.admin_notification_dismissals FOR SELECT TO authenticated
USING (admin_user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can create their own dismissals" ON public.admin_notification_dismissals;
CREATE POLICY "Admins can create their own dismissals"
ON public.admin_notification_dismissals FOR INSERT TO authenticated
WITH CHECK (admin_user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete their own dismissals" ON public.admin_notification_dismissals;
CREATE POLICY "Admins can delete their own dismissals"
ON public.admin_notification_dismissals FOR DELETE TO authenticated
USING (admin_user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_admin_dismissals_lookup
  ON public.admin_notification_dismissals (admin_user_id, entity_type);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfc_orders;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notification_dismissals;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;