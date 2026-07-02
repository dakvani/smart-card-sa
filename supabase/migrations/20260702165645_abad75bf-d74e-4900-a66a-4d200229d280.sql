
-- 1) profiles: restrict anon SELECT to a safe column allow-list
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, username, title, bio, avatar_url,
  theme_name, theme_gradient, gradient_direction,
  social_links, custom_bg_color, custom_accent_color,
  animation_type, animation_speed, animation_intensity,
  custom_background_url, custom_background_type, motion_enabled,
  email_collection_enabled, plan,
  created_at, updated_at
) ON public.profiles TO anon;

-- 2) profile_blocks: scope public reads to blocks whose owning profile exists.
--    Public exposure of contact blocks is intentional (they render on the bio
--    page), but the join makes intent explicit and prevents orphan rows.
DROP POLICY IF EXISTS "Public can read visible blocks" ON public.profile_blocks;
CREATE POLICY "Public can read visible blocks of existing profiles"
  ON public.profile_blocks
  FOR SELECT
  TO anon, authenticated
  USING (
    visible = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = profile_blocks.user_id
    )
  );

-- 3) marketing_email_unsubscribes: block all client writes explicitly.
--    Writes still happen via SECURITY DEFINER function
--    public.ensure_marketing_unsubscribe_token and the marketing-unsubscribe
--    edge function (service_role bypasses RLS).
DROP POLICY IF EXISTS "No client inserts" ON public.marketing_email_unsubscribes;
DROP POLICY IF EXISTS "No client updates" ON public.marketing_email_unsubscribes;
DROP POLICY IF EXISTS "No client deletes" ON public.marketing_email_unsubscribes;

CREATE POLICY "No client inserts"
  ON public.marketing_email_unsubscribes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates"
  ON public.marketing_email_unsubscribes
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No client deletes"
  ON public.marketing_email_unsubscribes
  FOR DELETE
  TO anon, authenticated
  USING (false);
