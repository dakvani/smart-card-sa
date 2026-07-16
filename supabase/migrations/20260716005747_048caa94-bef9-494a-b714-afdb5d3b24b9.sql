
-- Restrict anonymous SELECT on profiles to only public-safe columns.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, username, title, bio, avatar_url,
  theme_name, theme_gradient, gradient_direction,
  social_links, custom_bg_color, custom_accent_color,
  animation_type, animation_speed, animation_intensity,
  motion_enabled, custom_background_url, custom_background_type,
  email_collection_enabled, plan, wallpaper_style, wallpaper_value,
  created_at, updated_at
) ON public.profiles TO anon;
