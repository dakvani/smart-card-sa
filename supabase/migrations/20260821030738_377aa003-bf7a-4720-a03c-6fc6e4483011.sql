-- Restrict anonymous column access on profiles to public display fields only
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, username, title, bio, avatar_url, theme_name, theme_gradient,
  gradient_direction, social_links, custom_bg_color, custom_accent_color,
  animation_type, animation_speed, animation_intensity, motion_enabled,
  custom_background_url, custom_background_type, email_collection_enabled,
  plan, created_at, updated_at
) ON public.profiles TO anon;

-- Company invoice settings: authenticated only
DROP POLICY IF EXISTS "Anyone can read company info" ON public.invoice_company_settings;
CREATE POLICY "Authenticated users can read company info"
ON public.invoice_company_settings
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.invoice_company_settings FROM anon;
GRANT SELECT ON public.invoice_company_settings TO authenticated;
GRANT ALL ON public.invoice_company_settings TO service_role;