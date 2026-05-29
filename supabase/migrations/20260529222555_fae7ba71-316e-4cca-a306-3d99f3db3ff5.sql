
-- Pro upgrade requests table
CREATE TABLE public.pro_upgrade_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  requested_plan text NOT NULL DEFAULT 'pro',
  status text NOT NULL DEFAULT 'pending',
  feature_context text,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pro_upgrade_requests_one_pending_per_user
  ON public.pro_upgrade_requests(user_id) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE ON public.pro_upgrade_requests TO authenticated;
GRANT ALL ON public.pro_upgrade_requests TO service_role;

ALTER TABLE public.pro_upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own pro requests"
  ON public.pro_upgrade_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pro requests"
  ON public.pro_upgrade_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pro requests"
  ON public.pro_upgrade_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pro requests"
  ON public.pro_upgrade_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pro requests"
  ON public.pro_upgrade_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pro_upgrade_requests_updated_at
  BEFORE UPDATE ON public.pro_upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.pro_upgrade_requests;

-- Atomic click counter
CREATE OR REPLACE FUNCTION public.increment_link_click(link_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.increment_link_click(uuid) TO anon, authenticated;
