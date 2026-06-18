
CREATE TABLE public.profile_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL,
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_share_events_profile_id ON public.profile_share_events(profile_id);
CREATE INDEX idx_profile_share_events_created_at ON public.profile_share_events(created_at);

GRANT INSERT ON public.profile_share_events TO anon, authenticated;
GRANT SELECT ON public.profile_share_events TO authenticated;
GRANT ALL ON public.profile_share_events TO service_role;

ALTER TABLE public.profile_share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a share event"
  ON public.profile_share_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_share_events.profile_id));

CREATE POLICY "Profile owners can view their share events"
  ON public.profile_share_events FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_share_events.profile_id AND profiles.user_id = auth.uid()));

CREATE POLICY "Admins can view all share events"
  ON public.profile_share_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete share events"
  ON public.profile_share_events FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
