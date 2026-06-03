
-- Switch views to security_invoker=on so they enforce caller's RLS
ALTER VIEW public.profiles_public SET (security_invoker = on);
ALTER VIEW public.nfc_catalog_products_public SET (security_invoker = on);

-- Re-allow anon to SELECT rows from base tables (needed for invoker views).
-- Sensitive columns remain hidden by column-level GRANTs below.
CREATE POLICY "Public can read base profiles"
ON public.profiles FOR SELECT TO anon
USING (true);

CREATE POLICY "Public can read active products"
ON public.nfc_catalog_products FOR SELECT TO anon
USING (is_active = true);

-- Lock down column access for anon: only safe columns are readable.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, username, title, bio, avatar_url, theme_name, theme_gradient,
  gradient_direction, social_links, custom_bg_color, custom_accent_color,
  animation_type, animation_speed, animation_intensity, email_collection_enabled,
  created_at, updated_at
) ON public.profiles TO anon;

REVOKE SELECT ON public.nfc_catalog_products FROM anon;
GRANT SELECT (
  id, slug, name, description, base_price, category, gradient, photo_url,
  position, is_active, created_at, updated_at
) ON public.nfc_catalog_products TO anon;
