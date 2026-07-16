DROP POLICY IF EXISTS "Anyone can subscribe to a profile" ON public.email_subscribers;

CREATE POLICY "Anyone can subscribe to an opted-in profile"
  ON public.email_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = email_subscribers.profile_id
        AND profiles.email_collection_enabled = true
    )
  );
